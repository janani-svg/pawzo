from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from app.db.database import engine, Base
from app.models import models  # ensure models are registered before create_all
from app.routers import auth, pets, meals, health, growth, expenses, memories, calendar, settings, chat, documents, alerts, push
from app.push.scheduler import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    scheduler = create_scheduler()
    scheduler.start()
    yield
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
app.include_router(settings.router,  prefix="/user",  tags=["settings"])
app.include_router(chat.router,      prefix="/user",  tags=["chat"])
app.include_router(documents.router, prefix="/user",  tags=["documents"])
app.include_router(alerts.router,    prefix="/user",  tags=["alerts"])
app.include_router(push.router,      prefix="/push",  tags=["push"])


@app.get("/")
def home():
    return {"message": "Pawzo API is running"}

@app.get("/debug-routes")
def debug_routes():
    return {"routes": [r.path for r in app.routes]}
