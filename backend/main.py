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
        except Exception as e:
            import logging as _log
            _log.getLogger(__name__).warning("Scheduler failed to start: %s", e)
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

@app.get("/push-status")
def push_status():
    return {"push_available": _push_available, "error": _push_err_msg}

@app.get("/debug-routes")
def debug_routes():
    return {"routes": [r.path for r in app.routes]}
