from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Pawzo API is running"}