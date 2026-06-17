from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:Janani%4016@localhost:5432/pawzo"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT current_database();"))
    print(result.fetchone())