import logging
import random
from datetime import datetime, date as date_type

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, and_, not_, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import SessionLocal
from app.models.models import Meal, MealLog, Pet, PushSubscription, Vaccination
from app.push.sender import send_push

log = logging.getLogger(__name__)

# Notification message pools  ─────────────────────────────────────────────────

MEAL_MSGS = [
    ("{pet}'s {meal} time! 🍽️",       "{pet} is giving you the hungry eyes. Tap to log it and keep the streak alive! 🔥"),
    ("⏰ Time to feed {pet}!",          "{pet}'s stomach just filed an official complaint. {meal} is ready to serve!"),
    ("😋 {pet} is ready for {meal}!",   "The bowl is empty and {pet} is waiting. Tap Pawzo to log their meal!"),
    ("🐾 {pet}: 'Excuse me, human!'",   "{pet} would like to formally announce that {meal} time has arrived."),
    ("🔔 Feeding reminder!",            "{pet} hasn't had their {meal} yet today. Don't break the care streak!"),
]

NO_MEAL_MSGS = [
    ("🗓️ Set up {pet}'s meal schedule!", "No meals added for {pet} yet. Add their daily meals in Pawzo and never miss a feeding!"),
    ("🍽️ {pet} has no meal plan!",       "Head to Pawzo and set up {pet}'s meal schedule so we can remind you at the right times."),
    ("📋 Meal reminders for {pet}",      "Add {pet}'s meals in Pawzo to track nutrition and get timely feeding reminders!"),
]

VACC_MSGS = [
    ("💉 Vaccination due today!",  "{pet}'s {vacc} is due today. Book the vet and log it in Pawzo!"),
    ("🏥 {pet}'s {vacc} due today!", "Don't miss {pet}'s vaccination — it's due today. Stay on top of their health!"),
    ("⚠️ Health alert for {pet}!", "{pet}'s {vacc} vaccination is due today. Tap to view Health page."),
]

EVENING_MSGS = [
    ("🌆 Did {pet} eat today?",          "Some of {pet}'s meals haven't been logged yet. Open Pawzo to check!"),
    ("🔥 Streak at risk for {pet}!",     "{pet}'s feeding log is incomplete. Tap to log before midnight!"),
    ("😺 {pet} wants to know…",          "Were all meals served today? Open Pawzo to complete {pet}'s daily care log."),
]


def _pick(pool, **kw):
    t, b = random.choice(pool)
    return t.format(**kw), b.format(**kw)


async def _delete_stale(db: AsyncSession, sub: PushSubscription):
    await db.delete(sub)
    await db.commit()


# Scheduler jobs  ─────────────────────────────────────────────────────────────

async def check_meal_reminders():
    """Every minute: find meals whose time == now and haven't been marked done → push."""
    current_time = datetime.now().strftime("%H:%M")
    today = str(date_type.today())

    async with SessionLocal() as db:
        # Single JOIN query: meals due now + owner's push subscriptions
        # where no done meal_log exists for today
        fed_today = (
            select(MealLog.id)
            .where(
                MealLog.meal_id == Meal.id,
                MealLog.date == today,
                MealLog.done == True,
            )
        )
        result = await db.execute(
            select(Meal, Pet, PushSubscription)
            .join(Pet, Meal.pet_id == Pet.id)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .where(Meal.time == current_time)
            .where(not_(exists(fed_today)))
        )
        for meal, pet, sub in result.all():
            t, b = _pick(MEAL_MSGS, pet=pet.name, meal=meal.name)
            ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/food?petId={pet.id}")
            if not ok:
                await _delete_stale(db, sub)


async def check_daily_alerts():
    """Daily at 9 AM: vaccinations due today + pets with no meals configured."""
    today = str(date_type.today())

    async with SessionLocal() as db:
        # Vaccinations due today
        vacc_rows = await db.execute(
            select(Vaccination, Pet, PushSubscription)
            .join(Pet, Vaccination.pet_id == Pet.id)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .where(Vaccination.next_due == today)
        )
        for vacc, pet, sub in vacc_rows.all():
            t, b = _pick(VACC_MSGS, pet=pet.name, vacc=vacc.name)
            ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/health?petId={pet.id}")
            if not ok:
                await _delete_stale(db, sub)

        # Pets that have no meals at all — remind owner to set up a schedule
        no_meal_sub = (
            select(Pet, PushSubscription)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .where(not_(exists(select(Meal.id).where(Meal.pet_id == Pet.id))))
        )
        for pet, sub in (await db.execute(no_meal_sub)).all():
            t, b = _pick(NO_MEAL_MSGS, pet=pet.name)
            ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/food?petId={pet.id}")
            if not ok:
                await _delete_stale(db, sub)


async def check_evening_unfed():
    """Daily at 8 PM: one push per user if any meal was not logged done today."""
    today = str(date_type.today())

    async with SessionLocal() as db:
        fed_today = (
            select(MealLog.id)
            .where(
                MealLog.meal_id == Meal.id,
                MealLog.date == today,
                MealLog.done == True,
            )
        )
        result = await db.execute(
            select(Meal, Pet, PushSubscription)
            .join(Pet, Meal.pet_id == Pet.id)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .where(not_(exists(fed_today)))
        )
        # One notification per subscription endpoint (avoid spamming per meal)
        seen: set[str] = set()
        for meal, pet, sub in result.all():
            if sub.endpoint in seen:
                continue
            seen.add(sub.endpoint)
            t, b = _pick(EVENING_MSGS, pet=pet.name)
            ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/food?petId={pet.id}")
            if not ok:
                await _delete_stale(db, sub)


# Factory  ────────────────────────────────────────────────────────────────────

def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(check_meal_reminders, IntervalTrigger(minutes=1), id="meal_reminders",  replace_existing=True, misfire_grace_time=30)
    scheduler.add_job(check_daily_alerts,   CronTrigger(hour=9,  minute=0), id="daily_alerts",   replace_existing=True)
    scheduler.add_job(check_evening_unfed,  CronTrigger(hour=20, minute=0), id="evening_unfed",  replace_existing=True)
    return scheduler
