from fastapi import FastAPI
from app.db.database import engine, Base
from app.models.upload import Upload

app = FastAPI()

# Create tables in PostgreSQL
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "Pawzo backend running"}