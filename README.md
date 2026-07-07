# 🐾 Pawzo — Your Pet's Health & Wellness Companion

Pawzo is an all-in-one pet care app that helps owners track everything about their pets' wellbeing — health, feeding, medication, growth, expenses, and emergencies — in one warm, friendly, mobile-first place. It's built as a Progressive Web App with an AI assistant, smart reminders, and push notifications so nothing about your pet's care slips through the cracks.

> *"A warm hug from your pet."*

---

## ✨ Features

- **🐶 Multiple Pet Profiles** — Manage all your pets with profiles, avatars, and health baselines
- **📅 Health Dashboard** — Calendar-driven hub for appointments, health events, and daily schedules
- **🍽️ Feeding Tracker** — Log meals, recipes, and feeding schedules with reminders
- **💊 Medication Manager** — Track prescriptions, dosages, and dose logs
- **📈 Growth Tracking** — Monitor weight and physical milestones over time
- **💰 Expense Tracking** — Record and categorize vet and pet-care costs
- **🤖 AI Assistant** — Chatbot for pet-care advice, Q&A, and symptom guidance (with image support)
- **🚑 Emergency Services** — Nearby vet finder, one-tap emergency call, and first-aid guidance
- **📸 Memories** — Capture and store photos and life moments
- **🧾 Document OCR** — Scan and extract text from vet documents on-device
- **🔔 Push Notifications** — Timely reminders for feeding, medication, and appointments
- **🔐 Secure Auth** — Email/password login with JWT, password reset, and account recovery

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase JS** (client/storage)
- **Tesseract.js** (in-browser OCR)
- **PWA** — service worker + Web Push notifications

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** (async Python)
- **PostgreSQL** with **SQLAlchemy 2.0** (async, `asyncpg`) + **Alembic** migrations
- **JWT auth** (`python-jose`, `passlib` + `bcrypt`)
- **OpenAI** — AI assistant
- **pywebpush** (VAPID) — push notifications
- **SendGrid** — transactional email
- **APScheduler** — scheduled reminder delivery

---

## 📁 Project Structure

```
pawzo/
├── frontend/               # Next.js 16 PWA
│   ├── app/
│   │   ├── components/      # Shared UI components
│   │   ├── lib/            # API client, push, OCR, store, utils
│   │   ├── dashboard/      # Main dashboard (My Pets · Calendar · Memories)
│   │   ├── pet-profile/    # Per-pet tabs (Food · Health · Growth · Expenses · AI)
│   │   ├── login/ · signup/ · onboarding/  # Auth & onboarding flows
│   │   └── ...             # Emergency, notifications, settings, profile, etc.
│   └── public/            # Service worker, manifest, icons, assets
│
├── backend/                # FastAPI service
│   ├── app/
│   │   ├── routers/        # API endpoints (auth, pets, meals, health, chat, push, ...)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── push/           # Web-push sender + scheduler
│   │   ├── db/             # Database engine/session
│   │   └── auth.py         # JWT + password hashing
│   ├── alembic/           # Database migrations
│   └── main.py            # App entrypoint
│
└── docs/                   # Product, design, schema & flow specifications
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+
- A **PostgreSQL** database (local or hosted, e.g. Supabase/Railway)

### 1. Clone the repo
```bash
git clone https://github.com/janani-svg/pawzo.git
cd pawzo
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate
# macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see [Environment Variables](#-environment-variables) below), then run migrations and start the server:
```bash
alembic upgrade head
uvicorn main:app --reload
```
The API runs at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
The app runs at `http://localhost:3000`.

---

## 🔑 Environment Variables

Create `backend/.env` with the following (never commit this file — it's gitignored):

```env
# Database — either a full URL...
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/pawzo
# ...or individual parts:
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pawzo

# Auth
SECRET_KEY=your_strong_random_secret        # REQUIRED in production
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI Assistant
OPENAI_API_KEY=sk-...

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
SMTP_FROM=your@email.com

# Push notifications (VAPID) — generate with backend/generate_vapid.py
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your@email.com
```

> Generate VAPID keys by running `python backend/generate_vapid.py`.

Configure the frontend's API base URL (and any Supabase keys) via a `frontend/.env.local` file as needed.

---

## 🗄️ Database Migrations

This project uses **Alembic**. Common commands (run from `backend/`):
```bash
alembic upgrade head            # apply all migrations
alembic revision --autogenerate -m "describe change"   # create a new migration
alembic downgrade -1            # roll back one migration
```

---

## 🎨 Design System

Pawzo follows a documented design system — a soft, cheerful 16-color palette, Inter + Poppins typography, an 8px spacing grid, and a defined component library. See the [`docs/`](docs/) folder for the full specifications:

- `PAWZO_Project_Context.md` — scope, features, and user flows
- `DESIGN_SYSTEM.md` — colors, components, motion, and voice
- `PAWZO_Typography_Font_Specifications.md` — type scale
- `screen_flow.md` — navigation and screen structure
- `DATABASE_SCHEMA.md` — tables, fields, and enums

---

## 📱 Progressive Web App

Pawzo is installable and works offline-friendly:
- Add to home screen on iOS (Safari 16.4+) and Android
- Web Push notifications via a service worker ([`frontend/public/sw.js`](frontend/public/sw.js))
- App manifest at [`frontend/public/manifest.json`](frontend/public/manifest.json)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is currently unlicensed. Add a license file (e.g. MIT) if you'd like to define usage terms.

---

<p align="center">Made with ❤️ for pets and the people who love them 🐾</p>
