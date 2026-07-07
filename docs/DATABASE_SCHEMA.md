# PAWZO — Database Schema (As-Built)

> **Source of truth:** this document reflects the actual SQLAlchemy models in
> [`backend/app/models/models.py`](../backend/app/models/models.py) and the
> Alembic migrations in [`backend/alembic/versions/`](../backend/alembic/versions).
> If the code and this document ever disagree, the code wins — update this file.

---

## 1. Overview

- **Engine:** PostgreSQL (async, via SQLAlchemy 2.0 + `asyncpg`).
- **Migrations:** [Alembic](../backend/alembic). Apply with `alembic upgrade head`.
- **ORM:** SQLAlchemy declarative models (`Base` from `app.db.database`).
- **Total tables:** 19.

### 1.1 Conventions used by the actual code

| Convention | How it's implemented |
|------------|----------------------|
| Primary keys | `id` — a `VARCHAR` holding a UUID4 hex string (`new_id()` = `str(uuid.uuid4())`). One table (`alert_records`) uses a composite PK. |
| Foreign keys | `<entity>_id` (e.g. `owner_id`, `pet_id`, `user_id`), all `ON DELETE CASCADE`. |
| Table names | Plural, snake_case. |
| Booleans | Plain `Boolean` columns (e.g. `done`, `active`, `all_day`, `push`). |
| Timestamps | Mixed by design: creation times use `DateTime` (`created_at`, default `utcnow`); calendar/user-entered dates are stored as `VARCHAR` ISO strings (`"yyyy-mm-dd"`); high-resolution event times use epoch-milliseconds in `BIGINT` (`fed_at`, `when_ms`, `sort_time`). |
| Enums | **Not enforced at the DB level.** Status-like fields are plain strings with a small set of conventional values (documented per-table below). |
| Binary/media | Images and files are stored inline as base64 **data URLs** in `TEXT` columns (`documents.file_data`, `chat_messages.image_data`, `memories.photo_url`, `*.photo_url`). No external object store. |
| Deletes | **Hard deletes** with FK `CASCADE`. There is no soft-delete `deleted_at` column. (`users.deletion_requested_at` is a grace-period marker for account-deletion, not a soft delete.) |

---

## 2. Entity Relationship Overview

```
users ─┬─< pets ─┬─< meals ──< meal_logs
       │         ├─< meal_logs
       │         ├─< vaccinations
       │         ├─< weight_entries
       │         ├─< health_records
       │         ├─< expenses
       │         ├─< milestones
       │         ├─< memories
       │         ├─< calendar_events
       │         └─< environment_tasks
       ├─1 vets                 (one per user)
       ├─1 user_settings        (one per user)
       ├─< user_activity
       ├─< documents
       ├─< chat_messages        (pet_id optional)
       ├─< alert_records
       └─< push_subscriptions
```

---

## 3. Tables

### 3.1 `users`
The account holder. One row per registered person.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| name | VARCHAR | no | — | Display name |
| username | VARCHAR | no | — | Unique |
| email | VARCHAR | no | — | Unique |
| password_hash | VARCHAR | no | — | bcrypt via passlib |
| photo_url | TEXT | yes | "" | Avatar (data URL or path) |
| created_at | DATETIME | yes | utcnow | |
| deletion_requested_at | DATETIME | yes | null | Set when the user requests account deletion (grace period before purge) |
| email_verified | BOOLEAN | no | false | |
| verification_code | VARCHAR | yes | null | Email verification code |
| verification_code_expires | DATETIME | yes | null | |
| password_reset_token | VARCHAR | yes | null | Link-based reset |
| password_reset_token_expires | DATETIME | yes | null | |
| password_reset_code | VARCHAR | yes | null | Code-based reset |
| password_reset_code_expires | DATETIME | yes | null | |

**Relationships:** `pets`, `vet` (1:1), `settings` (1:1), `activity`, `documents`, `alert_records`, `push_subscriptions` — all cascade-delete.

### 3.2 `pets`
A pet belonging to a user.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| owner_id | VARCHAR | no | — | FK → users.id (CASCADE) |
| name | VARCHAR | no | — | |
| species | VARCHAR | yes | "" | Free text (e.g. dog, cat, bird…) |
| breed | VARCHAR | yes | "" | |
| gender | VARCHAR | yes | "unknown" | Conventional: `male` / `female` / `unknown` |
| dob | VARCHAR | yes | "" | ISO date string |
| weight | VARCHAR | yes | "" | Display string |
| photo_url | TEXT | yes | "" | Avatar |
| region | VARCHAR | yes | "" | |
| notes | TEXT | yes | "" | |
| created_at | DATETIME | yes | utcnow | |

**Relationships:** cascade-owns `meals`, `meal_logs`, `vaccinations`, `weights`, `health`, `expenses`, `milestones`, `memories`, `events`, `env_tasks`.

### 3.3 `meals`
A recurring meal definition for a pet's feeding schedule.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| name | VARCHAR | no | — | e.g. "Breakfast" |
| time | VARCHAR | yes | "" | Scheduled time string |
| food | VARCHAR | yes | "" | |
| kcal | FLOAT | yes | 0 | Calories |
| recipe | TEXT | yes | "" | |

### 3.4 `meal_logs`
A per-day feeding record for a meal.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| meal_id | VARCHAR | no | — | FK → meals.id (CASCADE) |
| date | VARCHAR | no | — | ISO `yyyy-mm-dd` |
| done | BOOLEAN | yes | false | |
| fed_at | BIGINT | yes | null | Epoch ms when marked fed |

### 3.5 `vaccinations`

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| name | VARCHAR | no | — | |
| date | VARCHAR | yes | "" | Given on |
| next_due | VARCHAR | yes | "" | |
| clinic | VARCHAR | yes | "" | |

### 3.6 `weight_entries`

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| weight | FLOAT | no | — | |
| date | VARCHAR | no | — | ISO date |
| note | TEXT | yes | "" | |

### 3.7 `health_records`
Vet visits and medications share this table, distinguished by `kind`.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| kind | VARCHAR | no | — | Conventional: `vet` / `medication` |
| title | VARCHAR | no | — | |
| detail | TEXT | yes | "" | |
| date | VARCHAR | yes | "" | |
| active | BOOLEAN | yes | true | e.g. medication currently active |

### 3.8 `expenses`

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| category | VARCHAR | yes | "" | e.g. veterinary, food, grooming |
| amount | FLOAT | no | — | |
| date | VARCHAR | no | — | ISO date |
| note | TEXT | yes | "" | |
| receipt_url | TEXT | yes | "" | Receipt image (data URL) |

### 3.9 `milestones`
Growth/life milestones for a pet.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| emoji | VARCHAR | yes | "" | |
| title | VARCHAR | no | — | |
| date | VARCHAR | no | — | ISO date |

### 3.10 `memories`
Photo/media moments.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| photo_url | TEXT | yes | "" | Media (data URL) |
| caption | TEXT | yes | "" | |
| date | VARCHAR | no | — | ISO date |
| title | VARCHAR | yes | "" | |
| mood | VARCHAR | yes | "" | |
| tags | TEXT | yes | "" | Comma/JSON-ish string |
| media_type | VARCHAR | yes | "photo" | e.g. `photo` |
| time_taken | VARCHAR | yes | "" | |

### 3.11 `calendar_events`

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| title | VARCHAR | no | — | |
| date | VARCHAR | no | — | ISO date |
| time | VARCHAR | yes | "" | |
| all_day | BOOLEAN | yes | false | |
| emoji | VARCHAR | yes | "" | |

### 3.12 `environment_tasks`
Recurring habitat/care tasks (e.g. "clean tank every 14 days").

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| pet_id | VARCHAR | no | — | FK → pets.id (CASCADE) |
| name | VARCHAR | no | — | |
| frequency | VARCHAR | yes | "Weekly" | Display label, e.g. "Every 14 Days" |
| interval_days | INTEGER | yes | 7 | Days between completions |
| last_completed | VARCHAR | yes | "" | ISO date ("" if never) |
| next_due | VARCHAR | yes | "" | ISO date |
| created_at | DATETIME | yes | utcnow | |

### 3.13 `vets`
The user's primary vet contact (one per user).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| owner_id | VARCHAR | no | — | FK → users.id (CASCADE), **unique** |
| name | VARCHAR | no | — | |
| clinic | VARCHAR | yes | "" | |
| phone | VARCHAR | yes | "" | |
| alt_phone | VARCHAR | yes | "" | |
| address | TEXT | yes | "" | |

### 3.14 `user_settings`
One row per user (unique `user_id`).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| user_id | VARCHAR | no | — | FK → users.id (CASCADE), **unique** |
| theme | VARCHAR | yes | "light" | |
| push | BOOLEAN | yes | true | Push notifications on |
| email | BOOLEAN | yes | false | Email notifications on |
| sound | BOOLEAN | yes | true | In-app sound |
| units | VARCHAR | yes | "metric" | `metric` / `imperial` |
| currency | VARCHAR | yes | "USD" | |
| language | VARCHAR | yes | "English" | |
| timezone | VARCHAR | yes | "Asia/Kolkata" | IANA tz, used by the push scheduler |

### 3.15 `user_activity`
Login/activity day markers (used for streaks/engagement).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| user_id | VARCHAR | no | — | FK → users.id (CASCADE) |
| date | VARCHAR | no | — | ISO `yyyy-mm-dd` |

### 3.16 `documents`
User-uploaded documents (vet records, etc.), stored inline.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| user_id | VARCHAR | no | — | FK → users.id (CASCADE) |
| name | VARCHAR | no | — | |
| category | VARCHAR | yes | "Other" | |
| file_data | TEXT | yes | "" | base64 data URL |
| mime_type | VARCHAR | yes | "" | |
| uploaded_at | VARCHAR | no | — | ISO timestamp string |

### 3.17 `chat_messages`
AI assistant conversation history. `pet_id` is optional (general vs pet-specific chat).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| user_id | VARCHAR | no | — | FK → users.id (CASCADE) |
| pet_id | VARCHAR | yes | null | FK → pets.id (CASCADE) |
| role | VARCHAR | no | — | Conventional: `user` / `ai` |
| text | TEXT | no | — | Message body |
| image_data | TEXT | yes | null | base64 image (user messages only) |
| created_at | DATETIME | yes | utcnow | |

### 3.18 `alert_records`
Materialized notification/reminder feed. **Composite primary key** `(alert_key, user_id)`.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| alert_key | VARCHAR | no | — | PK part 1 |
| user_id | VARCHAR | no | — | PK part 2, FK → users.id (CASCADE) |
| pet_id | VARCHAR | yes | null | (no FK constraint) |
| emoji | VARCHAR | yes | "" | |
| title | VARCHAR | no | — | |
| body | TEXT | yes | "" | |
| when_display | VARCHAR | yes | "" | Human-readable time |
| when_ms | BIGINT | yes | null | Epoch ms |
| group_name | VARCHAR | yes | "Today" | Feed grouping |
| color | VARCHAR | yes | "" | |
| sort_time | BIGINT | yes | null | Epoch ms sort key |
| status | VARCHAR | yes | "upcoming" | e.g. `upcoming` |
| created_at | BIGINT | no | — | Epoch ms |
| expires_at | BIGINT | no | — | Epoch ms |

### 3.19 `push_subscriptions`
Web Push (VAPID) browser subscriptions.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | VARCHAR | no | uuid4 | PK |
| user_id | VARCHAR | no | — | FK → users.id (CASCADE) |
| endpoint | TEXT | no | — | **Unique** push endpoint URL |
| p256dh | TEXT | no | — | Client public key |
| auth | TEXT | no | — | Auth secret |
| created_at | DATETIME | yes | utcnow | |

---

## 4. Notes & known simplifications

- **String-typed dates:** Most user-facing dates/times are stored as strings, not native `DATE`/`TIMESTAMP`. Sorting/filtering relies on ISO string ordering. High-resolution scheduling uses epoch-ms `BIGINT` columns instead.
- **No DB-level enums:** Status/category/kind fields are free strings; valid values are enforced (loosely) in application code and Pydantic schemas ([`backend/app/schemas/schemas.py`](../backend/app/schemas/schemas.py)).
- **Inline media:** Images/files are base64 data URLs in `TEXT` columns. This keeps deployment simple but bloats rows — a future migration to object storage (e.g. Supabase Storage / S3) would move these out.
- **Stateless auth:** There is no `sessions` table — authentication is JWT-based (see [`backend/app/auth.py`](../backend/app/auth.py)). Tokens are signed with `SECRET_KEY`.
- **Not yet implemented (from earlier design drafts):** co-parenting / family permissions, a public vet-clinic directory, water-intake tracking, memory comments/likes, and geographic (PostGIS) vet search are **not** part of the current schema.

---

*As-built · derived from `backend/app/models/models.py`. Keep in sync with the models and migrations.*
