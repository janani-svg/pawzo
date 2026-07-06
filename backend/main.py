from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from app.db.database import engine, Base
from app.models import models  # ensure models are registered before create_all
from app.routers import auth, pets, meals, health, growth, expenses, memories, calendar, settings, chat, documents, alerts, environment

_push_err_msg = None
try:
    from app.routers import push as push_router
    from app.push.scheduler import create_scheduler
    _push_available = True
    print("[pawzo] Push module loaded OK")
except Exception as _push_err:
    import traceback as _tb
    _push_err_msg = _tb.format_exc()
    print(f"[pawzo] Push/scheduler NOT available:\n{_push_err_msg}")
    push_router = None
    _push_available = False


def _run_migrations():
    import subprocess, sys, os
    alembic_cfg = os.path.join(os.path.dirname(__file__), "alembic.ini")
    if os.path.exists(alembic_cfg):
        try:
            subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True, cwd=os.path.dirname(__file__))
            print("[pawzo] Alembic migrations applied.")
        except Exception as e:
            print(f"[pawzo] Alembic migration warning: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_migrations()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    scheduler = None
    if _push_available:
        try:
            scheduler = create_scheduler()
            scheduler.start()
            print("[pawzo] Scheduler started OK")
        except Exception as e:
            import traceback
            print(f"[pawzo] Scheduler FAILED to start: {e}\n{traceback.format_exc()}")
    yield
    if scheduler:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Pawzo API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",  tags=["auth"])
app.include_router(pets.router,     prefix="/pets",  tags=["pets"])
app.include_router(meals.router,    prefix="/pets",  tags=["meals"])
app.include_router(health.router,   prefix="/pets",  tags=["health"])
app.include_router(growth.router,   prefix="/pets",  tags=["growth"])
app.include_router(expenses.router, prefix="/pets",  tags=["expenses"])
app.include_router(memories.router, prefix="/pets",  tags=["memories"])
app.include_router(calendar.router, prefix="/pets",  tags=["calendar"])
app.include_router(environment.router, prefix="/pets", tags=["environment"])
app.include_router(settings.router,  prefix="/user",  tags=["settings"])
app.include_router(chat.router,      prefix="/user",  tags=["chat"])
app.include_router(documents.router, prefix="/user",  tags=["documents"])
app.include_router(alerts.router,    prefix="/user",  tags=["alerts"])
if push_router:
    app.include_router(push_router.router, prefix="/push", tags=["push"])


@app.get("/")
def home():
    return {"message": "Pawzo API is running"}

@app.get("/push-clear-all")
async def push_clear_all():
    """Debug: delete all push subscriptions so fresh ones can be created."""
    if _push_available:
        from app.db.database import SessionLocal
        from app.models.models import PushSubscription
        from sqlalchemy import delete
        async with SessionLocal() as db:
            result = await db.execute(delete(PushSubscription))
            await db.commit()
            return {"deleted": result.rowcount}
    return {"error": "push not available"}


@app.get("/push-status")
async def push_status(test: bool = False):
    info = {"push_available": _push_available, "error": _push_err_msg}
    if _push_available:
        from app.db.database import SessionLocal
        from app.models.models import PushSubscription
        from sqlalchemy import select, func
        async with SessionLocal() as db:
            count = (await db.execute(select(func.count()).select_from(PushSubscription))).scalar()
            info["total_subscriptions_in_db"] = count
            if test:
                from app.push.sender import send_push
                subs = (await db.execute(select(PushSubscription))).scalars().all()
                results = []
                for s in subs:
                    try:
                        ok = send_push(s.endpoint, s.p256dh, s.auth, "🐾 Pawzo Test", "If you see this, push works!", "/dashboard")
                        results.append({"ok": ok, "endpoint": s.endpoint[:50]})
                        print(f"[push-test] sent to {s.endpoint[:50]} ok={ok}")
                        if not ok:
                            await db.delete(s)
                    except Exception as e:
                        results.append({"ok": False, "error": str(e), "endpoint": s.endpoint[:50]})
                        print(f"[push-test] ERROR {e}")
                await db.commit()
                info["test_results"] = results
    return info

@app.get("/debug-routes")
def debug_routes():
    return {"routes": [r.path for r in app.routes]}
