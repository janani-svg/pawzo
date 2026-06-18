from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import uuid


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=new_id)
    name          = Column(String, nullable=False)
    username      = Column(String, unique=True, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    pets     = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    vet      = relationship("Vet", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    activity = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    id         = Column(String, primary_key=True, default=new_id)
    owner_id   = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name       = Column(String, nullable=False)
    species    = Column(String, default="")
    breed      = Column(String, default="")
    gender     = Column(String, default="unknown")
    dob        = Column(String, default="")
    weight     = Column(String, default="")
    photo_url  = Column(Text, default="")
    region     = Column(String, default="")
    notes      = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner        = relationship("User", back_populates="pets")
    meals        = relationship("Meal", back_populates="pet", cascade="all, delete-orphan")
    meal_logs    = relationship("MealLog", back_populates="pet", cascade="all, delete-orphan")
    vaccinations = relationship("Vaccination", back_populates="pet", cascade="all, delete-orphan")
    weights      = relationship("WeightEntry", back_populates="pet", cascade="all, delete-orphan")
    health       = relationship("HealthRecord", back_populates="pet", cascade="all, delete-orphan")
    expenses     = relationship("Expense", back_populates="pet", cascade="all, delete-orphan")
    milestones   = relationship("Milestone", back_populates="pet", cascade="all, delete-orphan")
    memories     = relationship("Memory", back_populates="pet", cascade="all, delete-orphan")
    events       = relationship("CalendarEvent", back_populates="pet", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"

    id     = Column(String, primary_key=True, default=new_id)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    name   = Column(String, nullable=False)
    time   = Column(String, default="")
    food   = Column(String, default="")
    kcal   = Column(Float, default=0)

    pet      = relationship("Pet", back_populates="meals")
    meal_logs = relationship("MealLog", back_populates="meal", cascade="all, delete-orphan")


class MealLog(Base):
    __tablename__ = "meal_logs"

    id      = Column(String, primary_key=True, default=new_id)
    pet_id  = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    meal_id = Column(String, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    date    = Column(String, nullable=False)
    done    = Column(Boolean, default=False)

    pet  = relationship("Pet", back_populates="meal_logs")
    meal = relationship("Meal", back_populates="meal_logs")


class Vaccination(Base):
    __tablename__ = "vaccinations"

    id       = Column(String, primary_key=True, default=new_id)
    pet_id   = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    name     = Column(String, nullable=False)
    date     = Column(String, default="")
    next_due = Column(String, default="")
    clinic   = Column(String, default="")

    pet = relationship("Pet", back_populates="vaccinations")


class WeightEntry(Base):
    __tablename__ = "weight_entries"

    id     = Column(String, primary_key=True, default=new_id)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    weight = Column(Float, nullable=False)
    date   = Column(String, nullable=False)
    note   = Column(Text, default="")

    pet = relationship("Pet", back_populates="weights")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id     = Column(String, primary_key=True, default=new_id)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    kind   = Column(String, nullable=False)  # "vet" | "medication"
    title  = Column(String, nullable=False)
    detail = Column(Text, default="")
    date   = Column(String, default="")
    active = Column(Boolean, default=True)

    pet = relationship("Pet", back_populates="health")


class Expense(Base):
    __tablename__ = "expenses"

    id          = Column(String, primary_key=True, default=new_id)
    pet_id      = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    category    = Column(String, default="")
    amount      = Column(Float, nullable=False)
    date        = Column(String, nullable=False)
    note        = Column(Text, default="")
    receipt_url = Column(Text, default="")

    pet = relationship("Pet", back_populates="expenses")


class Milestone(Base):
    __tablename__ = "milestones"

    id     = Column(String, primary_key=True, default=new_id)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    emoji  = Column(String, default="")
    title  = Column(String, nullable=False)
    date   = Column(String, nullable=False)

    pet = relationship("Pet", back_populates="milestones")


class Memory(Base):
    __tablename__ = "memories"

    id        = Column(String, primary_key=True, default=new_id)
    pet_id    = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(Text, default="")
    caption   = Column(Text, default="")
    date      = Column(String, nullable=False)

    pet = relationship("Pet", back_populates="memories")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id     = Column(String, primary_key=True, default=new_id)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    title  = Column(String, nullable=False)
    date   = Column(String, nullable=False)
    emoji  = Column(String, default="")

    pet = relationship("Pet", back_populates="events")


class Vet(Base):
    __tablename__ = "vets"

    id        = Column(String, primary_key=True, default=new_id)
    owner_id  = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name      = Column(String, nullable=False)
    clinic    = Column(String, default="")
    phone     = Column(String, default="")
    alt_phone = Column(String, default="")
    address   = Column(Text, default="")

    owner = relationship("User", back_populates="vet")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id       = Column(String, primary_key=True, default=new_id)
    user_id  = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    theme    = Column(String, default="light")
    push     = Column(Boolean, default=True)
    email    = Column(Boolean, default=False)
    sound    = Column(Boolean, default=True)
    units    = Column(String, default="metric")
    currency = Column(String, default="USD")
    language = Column(String, default="English")

    user = relationship("User", back_populates="settings")


class UserActivity(Base):
    __tablename__ = "user_activity"

    id      = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date    = Column(String, nullable=False)  # ISO yyyy-mm-dd

    user = relationship("User", back_populates="activity")
