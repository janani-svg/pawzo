from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    identifier: str  # email or username
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    username: str
    email: str
    email_verified: bool = False
    photo_url: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    photo_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class VerifyEmailRequest(BaseModel):
    code: str


class MessageResponse(BaseModel):
    message: str


# ── Pets ──────────────────────────────────────────────────────────────────────

class PetCreate(BaseModel):
    name: str
    species: str = ""
    breed: str = ""
    gender: Literal["male", "female", "unknown"] = "unknown"
    dob: str = ""
    weight: str = ""
    photo_url: str = ""
    region: str = ""
    notes: str = ""


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    gender: Optional[Literal["male", "female", "unknown"]] = None
    dob: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    region: Optional[str] = None
    notes: Optional[str] = None


class PetOut(BaseModel):
    id: str
    owner_id: str
    name: str
    species: str
    breed: str
    gender: str
    dob: str
    weight: str
    photo_url: str
    region: str
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Meals ─────────────────────────────────────────────────────────────────────

class MealCreate(BaseModel):
    name: str
    time: str = ""
    food: str = ""
    kcal: float = 0


class MealUpdate(BaseModel):
    name: Optional[str] = None
    time: Optional[str] = None
    food: Optional[str] = None
    kcal: Optional[float] = None


class MealOut(BaseModel):
    id: str
    pet_id: str
    name: str
    time: str
    food: str
    kcal: float

    model_config = {"from_attributes": True}


class MealLogToggle(BaseModel):
    meal_id: str
    date: str
    fed_at: Optional[int] = None  # epoch ms — supplied by client when marking done


class MealLogOut(BaseModel):
    id: str
    pet_id: str
    meal_id: str
    date: str
    done: bool
    fed_at: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Vaccinations ──────────────────────────────────────────────────────────────

class VaccinationCreate(BaseModel):
    name: str
    date: str = ""
    next_due: str = ""
    clinic: str = ""


class VaccinationUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    next_due: Optional[str] = None
    clinic: Optional[str] = None


class VaccinationOut(BaseModel):
    id: str
    pet_id: str
    name: str
    date: str
    next_due: str
    clinic: str

    model_config = {"from_attributes": True}


# ── Health Records ────────────────────────────────────────────────────────────

class HealthRecordCreate(BaseModel):
    kind: Literal["vet", "medication"]
    title: str
    detail: str = ""
    date: str = ""
    active: bool = True


class HealthRecordUpdate(BaseModel):
    kind: Optional[Literal["vet", "medication"]] = None
    title: Optional[str] = None
    detail: Optional[str] = None
    date: Optional[str] = None
    active: Optional[bool] = None


class HealthRecordOut(BaseModel):
    id: str
    pet_id: str
    kind: str
    title: str
    detail: str
    date: str
    active: bool

    model_config = {"from_attributes": True}


# ── Weight Entries ────────────────────────────────────────────────────────────

class WeightEntryCreate(BaseModel):
    weight: float
    date: str
    note: str = ""


class WeightEntryUpdate(BaseModel):
    weight: Optional[float] = None
    date: Optional[str] = None
    note: Optional[str] = None


class WeightEntryOut(BaseModel):
    id: str
    pet_id: str
    weight: float
    date: str
    note: str

    model_config = {"from_attributes": True}


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    category: str = ""
    amount: float
    date: str
    note: str = ""
    receipt_url: str = ""


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    note: Optional[str] = None
    receipt_url: Optional[str] = None


class ExpenseOut(BaseModel):
    id: str
    pet_id: str
    category: str
    amount: float
    date: str
    note: str
    receipt_url: str

    model_config = {"from_attributes": True}


# ── Milestones ────────────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    emoji: str = ""
    title: str
    date: str


class MilestoneUpdate(BaseModel):
    emoji: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None


class MilestoneOut(BaseModel):
    id: str
    pet_id: str
    emoji: str
    title: str
    date: str

    model_config = {"from_attributes": True}


# ── Memories ──────────────────────────────────────────────────────────────────

class MemoryCreate(BaseModel):
    photo_url: str = ""
    caption: str = ""
    date: str
    title: str = ""
    mood: str = ""
    tags: str = ""
    media_type: str = "photo"
    time_taken: str = ""


class MemoryUpdate(BaseModel):
    photo_url: Optional[str] = None
    caption: Optional[str] = None
    date: Optional[str] = None
    title: Optional[str] = None
    mood: Optional[str] = None
    tags: Optional[str] = None
    media_type: Optional[str] = None
    time_taken: Optional[str] = None


class MemoryOut(BaseModel):
    id: str
    pet_id: str
    photo_url: str
    caption: str
    date: str
    title: str = ""
    mood: str = ""
    tags: str = ""
    media_type: str = "photo"
    time_taken: str = ""

    model_config = {"from_attributes": True}


class MoodDetectRequest(BaseModel):
    photo_data_url: str
    pet_name: str = ""
    pet_species: str = ""


class MoodDetectOut(BaseModel):
    mood: str


# ── Calendar Events ───────────────────────────────────────────────────────────

class CalendarEventCreate(BaseModel):
    title: str
    date: str
    time: str = ""
    all_day: bool = False
    emoji: str = ""


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    all_day: Optional[bool] = None
    emoji: Optional[str] = None


class CalendarEventOut(BaseModel):
    id: str
    pet_id: str
    title: str
    date: str
    time: str = ""
    all_day: bool = False
    emoji: str

    model_config = {"from_attributes": True}


# ── Vet ───────────────────────────────────────────────────────────────────────

class VetCreate(BaseModel):
    name: str
    clinic: str = ""
    phone: str = ""
    alt_phone: str = ""
    address: str = ""


class VetOut(BaseModel):
    id: str
    owner_id: str
    name: str
    clinic: str
    phone: str
    alt_phone: str
    address: str

    model_config = {"from_attributes": True}


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    theme: Optional[Literal["light", "dark", "auto"]] = None
    push: Optional[bool] = None
    email: Optional[bool] = None
    sound: Optional[bool] = None
    units: Optional[Literal["metric", "imperial"]] = None
    currency: Optional[str] = None
    language: Optional[str] = None


class SettingsOut(BaseModel):
    theme: str
    push: bool
    email: bool
    sound: bool
    units: str
    currency: str
    language: str

    model_config = {"from_attributes": True}


# ── Alert Records ─────────────────────────────────────────────────────────────

class AlertRecordIn(BaseModel):
    alert_key:    str
    pet_id:       Optional[str] = None
    emoji:        str = ""
    title:        str
    body:         str = ""
    when_display: str = ""
    when_ms:      Optional[int] = None
    group_name:   str = "Today"
    color:        str = ""
    sort_time:    Optional[int] = None
    status:       str = "upcoming"
    created_at:   int
    expires_at:   int


class AlertRecordOut(BaseModel):
    alert_key:    str
    user_id:      str
    pet_id:       Optional[str] = None
    emoji:        str
    title:        str
    body:         str
    when_display: str
    when_ms:      Optional[int] = None
    group_name:   str
    color:        str
    sort_time:    Optional[int] = None
    status:       str
    created_at:   int
    expires_at:   int

    model_config = {"from_attributes": True}


# ── Activity / Streak ─────────────────────────────────────────────────────────

class ActivityOut(BaseModel):
    dates: list[str]
    streak: int = 0
    streak_broken: bool = False


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    name: str
    category: str = "Other"
    file_data: str = ""
    mime_type: str = ""
    uploaded_at: str


class DocumentOut(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    file_data: str
    mime_type: str
    uploaded_at: str

    model_config = {"from_attributes": True}


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatSend(BaseModel):
    text: str
    pet_id: Optional[str] = None
    image_base64: Optional[str] = None  # base64-encoded image from frontend


class ChatMessageOut(BaseModel):
    id: str
    user_id: str
    pet_id: Optional[str]
    role: str
    text: str
    image_data: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    user_msg: ChatMessageOut
    ai_msg: ChatMessageOut
