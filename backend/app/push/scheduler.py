import logging
import random
from datetime import datetime, date as date_type

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, and_, not_, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import SessionLocal
from app.models.models import Meal, MealLog, Pet, PushSubscription, UserSettings, Vaccination
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
    """Every minute: for each user, compare meal times in their local timezone."""
    import zoneinfo
    from datetime import timezone, timedelta

    async with SessionLocal() as db:
        # Fetch all (meal, pet, subscription, user_timezone) in one query
        result = await db.execute(
            select(Meal, Pet, PushSubscription, UserSettings.timezone)
            .join(Pet, Meal.pet_id == Pet.id)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .outerjoin(UserSettings, UserSettings.user_id == Pet.owner_id)
        )
        rows = result.all()

        for meal, pet, sub, tz_name in rows:
            try:
                tz = zoneinfo.ZoneInfo(tz_name or "Asia/Kolkata")
            except Exception:
                tz = zoneinfo.ZoneInfo("Asia/Kolkata")

            now_local = datetime.now(tz)
            current_time = now_local.strftime("%H:%M")
            today = str(now_local.date())

            if meal.time != current_time:
                continue

            # Check if already fed today
            fed = await db.execute(
                select(MealLog.id).where(
                    MealLog.meal_id == meal.id,
                    MealLog.date == today,
                    MealLog.done == True,
                )
            )
            if fed.first():
                continue

            t, b = _pick(MEAL_MSGS, pet=pet.name, meal=meal.name)
            ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/food?petId={pet.id}")
            if not ok:
                await _delete_stale(db, sub)


async def check_daily_alerts():
    """Every hour: fire for users whose local time is 9 AM — vaccinations due + no-meal pets."""
    import zoneinfo

    async with SessionLocal() as db:
        rows = await db.execute(
            select(Pet, PushSubscription, UserSettings.timezone)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .outerjoin(UserSettings, UserSettings.user_id == Pet.owner_id)
        )
        seen_subs: set[str] = set()
        for pet, sub, tz_name in rows.all():
            try:
                tz = zoneinfo.ZoneInfo(tz_name or "Asia/Kolkata")
            except Exception:
                tz = zoneinfo.ZoneInfo("Asia/Kolkata")

            now_local = datetime.now(tz)
            if now_local.hour != 9:
                continue

            today = str(now_local.date())

            # Vaccinations due today for this pet
            vacc_rows = await db.execute(
                select(Vaccination)
                .where(Vaccination.pet_id == pet.id, Vaccination.next_due == today)
            )
            for (vacc,) in vacc_rows.all():
                t, b = _pick(VACC_MSGS, pet=pet.name, vacc=vacc.name)
                ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/health?petId={pet.id}")
                if not ok:
                    await _delete_stale(db, sub)
                    break

            # No meals configured
            if sub.endpoint not in seen_subs:
                has_meal = await db.execute(select(Meal.id).where(Meal.pet_id == pet.id))
                if not has_meal.first():
                    seen_subs.add(sub.endpoint)
                    t, b = _pick(NO_MEAL_MSGS, pet=pet.name)
                    ok = send_push(sub.endpoint, sub.p256dh, sub.auth, t, b, f"/pet-profile/food?petId={pet.id}")
                    if not ok:
                        await _delete_stale(db, sub)


async def check_evening_unfed():
    """Every hour: fire for users whose local time is 8 PM — remind about unfed meals today."""
    import zoneinfo

    async with SessionLocal() as db:
        result = await db.execute(
            select(Meal, Pet, PushSubscription, UserSettings.timezone)
            .join(Pet, Meal.pet_id == Pet.id)
            .join(PushSubscription, PushSubscription.user_id == Pet.owner_id)
            .outerjoin(UserSettings, UserSettings.user_id == Pet.owner_id)
        )
        seen: set[str] = set()
        for meal, pet, sub, tz_name in result.all():
            try:
                tz = zoneinfo.ZoneInfo(tz_name or "Asia/Kolkata")
            except Exception:
                tz = zoneinfo.ZoneInfo("Asia/Kolkata")

            now_local = datetime.now(tz)
            if now_local.hour != 20:
                continue

            today = str(now_local.date())

            fed = await db.execute(
                select(MealLog.id).where(
                    MealLog.meal_id == meal.id,
                    MealLog.date == today,
                    MealLog.done == True,
                )
            )
            if fed.first():
                continue

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
    scheduler.add_job(check_meal_reminders, IntervalTrigger(minutes=1),  id="meal_reminders", replace_existing=True, misfire_grace_time=30)
    scheduler.add_job(check_daily_alerts,   IntervalTrigger(hours=1),    id="daily_alerts",   replace_existing=True, misfire_grace_time=120)
    scheduler.add_job(check_evening_unfed,  IntervalTrigger(hours=1),    id="evening_unfed",  replace_existing=True, misfire_grace_time=120)
    return scheduler
