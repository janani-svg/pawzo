# PAWZO DATABASE SCHEMA
## PostgreSQL Database Design & Architecture
### Complete Data Model for Pet Companion App

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Architecture & Design Principles](#2-architecture--design-principles)
3. [Core Tables](#3-core-tables)
4. [User & Authentication](#4-user--authentication)
5. [Pet Management](#5-pet-management)
6. [Health & Wellness Tracking](#6-health--wellness-tracking)
7. [Feeding & Nutrition](#7-feeding--nutrition)
8. [Medication Management](#8-medication-management)
9. [Expenses & Records](#9-expenses--records)
10. [Memories & Media](#10-memories--media)
11. [Emergency & Vet Services](#11-emergency--vet-services)
12. [Notifications & Reminders](#12-notifications--reminders)
13. [Family & Co-Parenting](#13-family--co-parenting)
14. [Relationships Diagram](#14-relationships-diagram)
15. [Indexing Strategy](#15-indexing-strategy)
16. [Query Examples](#16-query-examples)
17. [Migration Strategy](#17-migration-strategy)
18. [Backup & Security](#18-backup--security)
19. [Performance Optimization](#19-performance-optimization)

---

## 1. DATABASE OVERVIEW

### 1.1 Database Specifications

```
Database Name: pawzo_db
Database Type: PostgreSQL (version 14+)
Time Zone: UTC (all timestamps)
Encoding: UTF-8
Extensions: uuid-ossp, pg_trgm, hstore (for JSON storage)
```

### 1.2 Connection String

```
postgresql://username:password@localhost:5432/pawzo_db
```

### 1.3 Schema Structure

```
Main Schema: public

Tables: 25+
Views: 5+
Functions: 10+
Indexes: 30+
Total Estimated Size: 1-5 GB (depending on usage)
```

### 1.4 Key Features

- **UUID Primary Keys** - Distributed system support
- **Timestamps** - Automatic created_at / updated_at
- **Soft Deletes** - Preserve data with deleted_at
- **JSON Fields** - Store flexible metadata
- **JSONB** - For efficient searching and indexing
- **Full-Text Search** - For memories, notes, search
- **Role-Based Access** - Permission management
- **Audit Logging** - Track all changes

---

## 2. ARCHITECTURE & DESIGN PRINCIPLES

### 2.1 Design Principles

**ACID Compliance**
- ✅ Atomicity - All or nothing transactions
- ✅ Consistency - Data stays valid
- ✅ Isolation - No interference between transactions
- ✅ Durability - Data persists

**Normalization**
- 3rd Normal Form (3NF) for most tables
- Denormalization only where performance critical
- Minimize data redundancy

**Scalability**
- UUID instead of auto-increment (distributed-friendly)
- Partitioning strategy for large tables (by date)
- Efficient indexing for common queries

**Security**
- Row-level security (RLS) for multi-tenancy
- Encrypted sensitive data (passwords, API keys)
- Audit trail for all changes
- User permissions per table

### 2.2 Naming Conventions

```
Tables:
  - Lowercase with underscores
  - Plural names (users, pets, health_records)
  - Example: user_family_members

Columns:
  - Lowercase with underscores
  - Be descriptive (pet_name, not pname)
  - Foreign keys: table_name_id
  - Boolean fields: is_active, has_permissions
  - Timestamps: created_at, updated_at, deleted_at
  - Example: last_feeding_time

Indexes:
  - ix_[table]_[column] for single column
  - ix_[table]_[col1]_[col2] for composite
  - Example: ix_pets_owner_id, ix_health_records_pet_id_date

Functions:
  - Lowercase with underscores
  - Describe action: get_pet_health_status, calculate_pet_age
  - Example: fn_update_pet_last_active()
```

### 2.3 Data Types

```sql
-- Common data types used in Pawzo
UUID          -- Primary keys, foreign keys
TEXT          -- Unlimited text (descriptions, notes)
VARCHAR(n)    -- Fixed length text (names, emails)
BOOLEAN       -- True/false values
INTEGER       -- Whole numbers
DECIMAL(10,2) -- Currency, percentages
DATE          -- Date only (no time)
TIMESTAMP     -- Date and time (UTC)
INTERVAL      -- Duration (time difference)
JSONB         -- JSON with indexing support
ARRAY         -- PostgreSQL arrays
ENUM          -- Predefined values
```

---

## 3. CORE TABLES

### 3.1 Database Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "ltree";
```

### 3.2 Enum Types

```sql
-- Pet type
CREATE TYPE pet_type AS ENUM (
  'dog',
  'cat',
  'bird',
  'rabbit',
  'guinea_pig',
  'hamster',
  'fish',
  'reptile',
  'other'
);

-- Pet size
CREATE TYPE pet_size AS ENUM (
  'extra_small',
  'small',
  'medium',
  'large',
  'extra_large'
);

-- Health status
CREATE TYPE health_status AS ENUM (
  'healthy',
  'attention_needed',
  'concern',
  'critical'
);

-- Activity level
CREATE TYPE activity_level AS ENUM (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extremely_active'
);

-- Gender
CREATE TYPE gender AS ENUM (
  'male',
  'female',
  'unknown'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'feeding_reminder',
  'medication_reminder',
  'vet_appointment',
  'health_alert',
  'memory_shared',
  'activity_update',
  'emergency_alert',
  'system_notification'
);

-- Expense category
CREATE TYPE expense_category AS ENUM (
  'veterinary',
  'medication',
  'food',
  'supplies',
  'grooming',
  'training',
  'emergency',
  'other'
);

-- Permission level
CREATE TYPE permission_level AS ENUM (
  'owner',
  'editor',
  'viewer',
  'limited_viewer'
);

-- Reminder frequency
CREATE TYPE reminder_frequency AS ENUM (
  'once',
  'daily',
  'weekly',
  'bi_weekly',
  'monthly',
  'custom'
);
```

---

## 4. USER & AUTHENTICATION

### 4.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  
  password_hash VARCHAR(255) NOT NULL,
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  
  -- Preferences
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Notification Settings
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sounds_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Account Status
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',  -- Store additional data
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Audit
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_is_active ON users(is_active);
CREATE INDEX ix_users_created_at ON users(created_at DESC);
CREATE INDEX ix_users_deleted_at ON users(deleted_at);
```

### 4.2 Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session Token
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255) UNIQUE,
  
  -- Device Info
  device_name VARCHAR(255),
  device_type VARCHAR(50),  -- mobile, web, tablet
  os_name VARCHAR(100),
  browser_name VARCHAR(100),
  
  -- Location
  ip_address VARCHAR(45),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX ix_sessions_user_id ON sessions(user_id);
CREATE INDEX ix_sessions_token_hash ON sessions(token_hash);
CREATE INDEX ix_sessions_is_active ON sessions(is_active);
CREATE INDEX ix_sessions_expires_at ON sessions(expires_at);
```

### 4.3 User Verification

```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  token VARCHAR(255) NOT NULL UNIQUE,
  
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX ix_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX ix_email_verifications_token ON email_verifications(token);
```

### 4.4 Password Reset

```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token VARCHAR(255) NOT NULL UNIQUE,
  
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX ix_password_resets_user_id ON password_resets(user_id);
CREATE INDEX ix_password_resets_token ON password_resets(token);
```

---

## 5. PET MANAGEMENT

### 5.1 Pets Table

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Owner
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(100) NOT NULL,
  pet_type pet_type NOT NULL,
  breed VARCHAR(100),
  color VARCHAR(100),
  
  -- Physical Attributes
  size pet_size,
  weight_kg DECIMAL(8, 2),
  height_cm DECIMAL(8, 2),
  
  -- Identity
  microchip_id VARCHAR(100),
  registration_number VARCHAR(100),
  
  -- Biology
  gender gender NOT NULL,
  birth_date DATE NOT NULL,
  neutered_spayed BOOLEAN,
  neutered_spayed_date DATE,
  
  -- Media
  profile_image_url TEXT,
  avatar_pixelated_url TEXT,
  
  -- Bio & Notes
  bio TEXT,
  special_notes TEXT,
  
  -- Health Status
  health_status health_status DEFAULT 'healthy',
  
  -- Settings
  is_primary_pet BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX ix_pets_owner_id ON pets(owner_id);
CREATE INDEX ix_pets_is_active ON pets(is_active);
CREATE INDEX ix_pets_health_status ON pets(health_status);
CREATE INDEX ix_pets_created_at ON pets(created_at DESC);
CREATE INDEX ix_pets_birth_date ON pets(birth_date);
```

### 5.2 Pet Medical History

```sql
CREATE TABLE pet_medical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Medical Info
  condition_name VARCHAR(255) NOT NULL,
  diagnosis_date DATE NOT NULL,
  
  -- Details
  description TEXT,
  notes TEXT,
  severity_level INTEGER DEFAULT 1,  -- 1-5 scale
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_date DATE,
  
  -- Medical Records
  document_url TEXT,
  vet_name VARCHAR(255),
  vet_clinic VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_pet_medical_history_pet_id ON pet_medical_history(pet_id);
CREATE INDEX ix_pet_medical_history_diagnosis_date ON pet_medical_history(diagnosis_date DESC);
```

### 5.3 Vaccinations

```sql
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Vaccination Info
  vaccine_name VARCHAR(255) NOT NULL,
  vaccine_type VARCHAR(100),
  
  -- Dates
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  expiry_date DATE,
  
  -- Details
  vet_name VARCHAR(255),
  vet_clinic VARCHAR(255),
  batch_number VARCHAR(100),
  
  -- Documents
  certificate_url TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX ix_vaccinations_next_due_date ON vaccinations(next_due_date);
```

---

## 6. HEALTH & WELLNESS TRACKING

### 6.1 Health Records

```sql
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_by_id UUID REFERENCES users(id),
  
  -- Record Date
  record_date DATE NOT NULL,
  record_time TIME,
  
  -- Vital Signs
  temperature_celsius DECIMAL(5, 2),
  heart_rate_bpm INTEGER,
  respiratory_rate_bpm INTEGER,
  
  -- Weight & Measurements
  weight_kg DECIMAL(8, 2),
  body_condition_score INTEGER,  -- 1-9 scale
  
  -- Observations
  observations TEXT,
  notes TEXT,
  
  -- Status
  health_status health_status DEFAULT 'healthy',
  flags JSONB DEFAULT '{}',  -- Array of concerns
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_health_records_pet_id ON health_records(pet_id);
CREATE INDEX ix_health_records_record_date ON health_records(record_date DESC);
CREATE INDEX ix_health_records_recorded_by_id ON health_records(recorded_by_id);
```

### 6.2 Symptoms & Concerns

```sql
CREATE TABLE health_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_by_id UUID REFERENCES users(id),
  
  -- Symptom Info
  symptom_name VARCHAR(255) NOT NULL,
  symptom_description TEXT,
  severity_level INTEGER DEFAULT 1,  -- 1-5 scale
  
  -- Timing
  onset_date DATE NOT NULL,
  onset_time TIME,
  duration_hours INTEGER,
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_date DATE,
  
  -- Follow-up
  requires_vet_visit BOOLEAN DEFAULT FALSE,
  vet_visit_scheduled BOOLEAN DEFAULT FALSE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_health_symptoms_pet_id ON health_symptoms(pet_id);
CREATE INDEX ix_health_symptoms_onset_date ON health_symptoms(onset_date DESC);
CREATE INDEX ix_health_symptoms_requires_vet ON health_symptoms(requires_vet_visit);
```

### 6.3 Vet Appointments

```sql
CREATE TABLE vet_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Appointment Info
  appointment_type VARCHAR(100),  -- checkup, surgery, dental, etc.
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  
  -- Duration
  duration_minutes INTEGER DEFAULT 30,
  
  -- Vet Info
  vet_name VARCHAR(255),
  vet_clinic VARCHAR(255),
  vet_phone VARCHAR(20),
  vet_address TEXT,
  
  -- Appointment Details
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, completed, cancelled
  completed_notes TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_vet_appointments_pet_id ON vet_appointments(pet_id);
CREATE INDEX ix_vet_appointments_appointment_date ON vet_appointments(appointment_date);
CREATE INDEX ix_vet_appointments_status ON vet_appointments(status);
```

---

## 7. FEEDING & NUTRITION

### 7.1 Feeding Schedule

```sql
CREATE TABLE feeding_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Schedule Info
  feeding_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timing
  time_of_day TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],  -- 1=Monday, 7=Sunday
  frequency reminder_frequency DEFAULT 'daily',
  
  -- Food Details
  food_type VARCHAR(100),  -- dry, wet, raw, etc.
  food_brand VARCHAR(100),
  food_amount_grams DECIMAL(8, 2),
  
  -- Nutrition Info
  calories_kcal INTEGER,
  protein_percent DECIMAL(5, 2),
  fat_percent DECIMAL(5, 2),
  fiber_percent DECIMAL(5, 2),
  
  -- Special Info
  special_instructions TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_feeding_schedules_pet_id ON feeding_schedules(pet_id);
CREATE INDEX ix_feeding_schedules_is_active ON feeding_schedules(is_active);
```

### 7.2 Feeding Log

```sql
CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_by_id UUID NOT NULL REFERENCES users(id),
  feeding_schedule_id UUID REFERENCES feeding_schedules(id),
  
  -- Feeding Info
  feeding_date DATE NOT NULL,
  feeding_time TIME NOT NULL,
  
  -- Amount
  amount_grams DECIMAL(8, 2),
  amount_type VARCHAR(50),  -- grams, cups, etc.
  
  -- Food Details
  food_type VARCHAR(100),
  food_brand VARCHAR(100),
  
  -- Consumption
  amount_consumed_percent DECIMAL(5, 2),  -- 0-100
  plate_cleaned BOOLEAN,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_feeding_logs_pet_id ON feeding_logs(pet_id);
CREATE INDEX ix_feeding_logs_feeding_date ON feeding_logs(feeding_date DESC);
CREATE INDEX ix_feeding_logs_recorded_by_id ON feeding_logs(recorded_by_id);
```

### 7.3 Water Intake

```sql
CREATE TABLE water_intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_by_id UUID REFERENCES users(id),
  
  -- Log Info
  log_date DATE NOT NULL,
  log_time TIME NOT NULL,
  
  -- Water Info
  water_amount_ml INTEGER,
  water_bowl_refilled BOOLEAN,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_water_intake_logs_pet_id ON water_intake_logs(pet_id);
CREATE INDEX ix_water_intake_logs_log_date ON water_intake_logs(log_date DESC);
```

---

## 8. MEDICATION MANAGEMENT

### 8.1 Medications

```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  prescribed_by_id UUID REFERENCES users(id),
  
  -- Medication Info
  medication_name VARCHAR(255) NOT NULL,
  active_ingredient VARCHAR(255),
  medication_form VARCHAR(100),  -- tablet, liquid, injection, etc.
  
  -- Dosage
  dosage_amount DECIMAL(10, 2),
  dosage_unit VARCHAR(50),  -- mg, ml, units, etc.
  
  -- Prescription
  prescribed_date DATE NOT NULL,
  prescription_expiry_date DATE,
  
  -- Frequency
  frequency reminder_frequency NOT NULL,
  times_per_day INTEGER,
  specific_times TIME[] DEFAULT ARRAY['08:00', '20:00'],
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Reason
  reason_prescribed TEXT,
  condition_treated VARCHAR(255),
  
  -- Vet Info
  vet_name VARCHAR(255),
  vet_clinic VARCHAR(255),
  prescription_number VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- Notes
  special_instructions TEXT,
  side_effects TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_medications_pet_id ON medications(pet_id);
CREATE INDEX ix_medications_is_active ON medications(is_active);
CREATE INDEX ix_medications_start_date ON medications(start_date DESC);
```

### 8.2 Medication Log

```sql
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  administered_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Administration Info
  administration_date DATE NOT NULL,
  administration_time TIME NOT NULL,
  
  -- Dosage
  dosage_given DECIMAL(10, 2),
  unit_given VARCHAR(50),
  
  -- Status
  was_taken BOOLEAN NOT NULL,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_medication_logs_pet_id ON medication_logs(pet_id);
CREATE INDEX ix_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX ix_medication_logs_administration_date ON medication_logs(administration_date DESC);
CREATE INDEX ix_medication_logs_was_taken ON medication_logs(was_taken);
```

---

## 9. EXPENSES & RECORDS

### 9.1 Expenses

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Expense Info
  expense_category expense_category NOT NULL,
  expense_description VARCHAR(255),
  
  -- Amount
  amount_currency DECIMAL(12, 2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'USD',
  
  -- Date
  expense_date DATE NOT NULL,
  
  -- Details
  vendor_name VARCHAR(255),
  payment_method VARCHAR(100),
  
  -- Documents
  receipt_url TEXT,
  invoice_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_expenses_pet_id ON expenses(pet_id);
CREATE INDEX ix_expenses_expense_category ON expenses(expense_category);
CREATE INDEX ix_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX ix_expenses_recorded_by_id ON expenses(recorded_by_id);
```

### 9.2 Medical Documents

```sql
CREATE TABLE medical_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Document Info
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),  -- vaccination_cert, prescription, xray, etc.
  
  -- File Info
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_mime_type VARCHAR(100),
  
  -- Related Info
  document_date DATE,
  related_vet_name VARCHAR(255),
  related_condition VARCHAR(255),
  
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date DATE,
  
  -- Notes
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_medical_documents_pet_id ON medical_documents(pet_id);
CREATE INDEX ix_medical_documents_document_type ON medical_documents(document_type);
```

---

## 10. MEMORIES & MEDIA

### 10.1 Pet Memories

```sql
CREATE TABLE pet_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Memory Info
  memory_title VARCHAR(255),
  memory_description TEXT,
  memory_date DATE NOT NULL,
  memory_time TIME,
  
  -- Categorization
  memory_type VARCHAR(100),  -- milestone, funny, health, everyday, etc.
  tags VARCHAR(500)[],  -- Array of tags for searching
  
  -- Media
  has_image BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  image_thumbnail_url TEXT,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Privacy
  is_private BOOLEAN DEFAULT FALSE,
  shared_with_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Search
  search_text TSVECTOR,  -- Full-text search index
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_pet_memories_pet_id ON pet_memories(pet_id);
CREATE INDEX ix_pet_memories_created_by_id ON pet_memories(created_by_id);
CREATE INDEX ix_pet_memories_memory_date ON pet_memories(memory_date DESC);
CREATE INDEX ix_pet_memories_memory_type ON pet_memories(memory_type);
CREATE INDEX ix_pet_memories_search_text ON pet_memories USING GIN(search_text);
CREATE INDEX ix_pet_memories_tags ON pet_memories USING GIN(tags);
```

### 10.2 Memory Comments

```sql
CREATE TABLE memory_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  memory_id UUID NOT NULL REFERENCES pet_memories(id) ON DELETE CASCADE,
  commented_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Comment
  comment_text TEXT NOT NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX ix_memory_comments_memory_id ON memory_comments(memory_id);
CREATE INDEX ix_memory_comments_commented_by_id ON memory_comments(commented_by_id);
```

### 10.3 Memory Likes

```sql
CREATE TABLE memory_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  memory_id UUID NOT NULL REFERENCES pet_memories(id) ON DELETE CASCADE,
  liked_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint (one like per user per memory)
  UNIQUE(memory_id, liked_by_id)
);

-- Indexes
CREATE INDEX ix_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX ix_memory_likes_liked_by_id ON memory_likes(liked_by_id);
```

---

## 11. EMERGENCY & VET SERVICES

### 11.1 Veterinary Clinics (Directory)

```sql
CREATE TABLE veterinary_clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Clinic Info
  clinic_name VARCHAR(255) NOT NULL,
  clinic_type VARCHAR(100),  -- general, emergency, specialty
  
  -- Contact
  phone_number VARCHAR(20),
  email VARCHAR(255),
  website_url TEXT,
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Coordinates
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Hours
  opening_hours JSONB,  -- {monday: "9:00-17:00", etc}
  emergency_available BOOLEAN DEFAULT FALSE,
  
  -- Services
  services VARCHAR(500)[],  -- Array of services
  
  -- Rating
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_vet_clinics_city ON veterinary_clinics(city);
CREATE INDEX ix_vet_clinics_location ON veterinary_clinics USING GIST(
  ll_to_earth(latitude, longitude)
);
```

### 11.2 Emergency Events

```sql
CREATE TABLE emergency_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  reported_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Emergency Info
  event_type VARCHAR(100),  -- medical, injury, lost, etc.
  severity_level INTEGER DEFAULT 1,  -- 1-5 scale
  description TEXT NOT NULL,
  
  -- Timing
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  
  -- Location
  event_location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Response
  vet_clinic_id UUID REFERENCES veterinary_clinics(id),
  vet_contacted BOOLEAN DEFAULT FALSE,
  vet_contact_time TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open',  -- open, in_progress, resolved, follow_up
  resolved_date DATE,
  
  -- Documentation
  notes TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_emergency_events_pet_id ON emergency_events(pet_id);
CREATE INDEX ix_emergency_events_event_date ON emergency_events(event_date DESC);
CREATE INDEX ix_emergency_events_status ON emergency_events(status);
```

---

## 12. NOTIFICATIONS & REMINDERS

### 12.1 Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Info
  notification_type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Content
  related_pet_id UUID REFERENCES pets(id),
  related_entity_type VARCHAR(100),  -- health_record, medication, memory, etc.
  related_entity_id UUID,
  
  -- Data
  action_url TEXT,
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Delivery
  send_via_push BOOLEAN DEFAULT TRUE,
  send_via_email BOOLEAN DEFAULT FALSE,
  
  delivered_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP
);

-- Indexes
CREATE INDEX ix_notifications_user_id ON notifications(user_id);
CREATE INDEX ix_notifications_is_read ON notifications(is_read);
CREATE INDEX ix_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX ix_notifications_notification_type ON notifications(notification_type);
```

### 12.2 Reminders

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Reminder Info
  reminder_title VARCHAR(255) NOT NULL,
  reminder_description TEXT,
  
  -- Type
  reminder_type VARCHAR(100),  -- feeding, medication, appointment, etc.
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  
  -- Timing
  reminder_time TIME NOT NULL,
  frequency reminder_frequency NOT NULL,
  repeat_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  
  -- Active Period
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT TRUE,
  
  -- Notification
  send_notification BOOLEAN DEFAULT TRUE,
  notification_minutes_before INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_reminders_user_id ON reminders(user_id);
CREATE INDEX ix_reminders_pet_id ON reminders(pet_id);
CREATE INDEX ix_reminders_is_active ON reminders(is_active);
```

### 12.3 Reminder Occurrences (Log)

```sql
CREATE TABLE reminder_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  
  -- Occurrence
  occurrence_date DATE NOT NULL,
  occurrence_time TIME NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, completed, missed, snoozed
  completed_at TIMESTAMP,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_reminder_occurrences_reminder_id ON reminder_occurrences(reminder_id);
CREATE INDEX ix_reminder_occurrences_occurrence_date ON reminder_occurrences(occurrence_date);
CREATE INDEX ix_reminder_occurrences_status ON reminder_occurrences(status);
```

---

## 13. FAMILY & CO-PARENTING

### 13.1 Family Members

```sql
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Users
  primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Relationship
  relationship_type VARCHAR(100),  -- partner, parent, child, sibling, friend, etc.
  
  -- Permission
  permission_level permission_level DEFAULT 'viewer',
  
  -- Status
  is_approved BOOLEAN DEFAULT FALSE,
  approval_date TIMESTAMP,
  
  -- Invitation
  invitation_sent_at TIMESTAMP,
  invitation_accepted_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint (prevent duplicates)
  UNIQUE(primary_user_id, family_user_id)
);

-- Indexes
CREATE INDEX ix_family_members_primary_user_id ON family_members(primary_user_id);
CREATE INDEX ix_family_members_family_user_id ON family_members(family_user_id);
CREATE INDEX ix_family_members_is_approved ON family_members(is_approved);
```

### 13.2 Pet Access Permissions

```sql
CREATE TABLE pet_access_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by_id UUID NOT NULL REFERENCES users(id),
  
  -- Permissions
  permission_level permission_level NOT NULL,
  
  -- Specific Permissions
  can_view_health BOOLEAN DEFAULT TRUE,
  can_edit_health BOOLEAN DEFAULT FALSE,
  can_view_feeding BOOLEAN DEFAULT TRUE,
  can_edit_feeding BOOLEAN DEFAULT FALSE,
  can_view_medication BOOLEAN DEFAULT TRUE,
  can_edit_medication BOOLEAN DEFAULT FALSE,
  can_view_memories BOOLEAN DEFAULT TRUE,
  can_add_memories BOOLEAN DEFAULT FALSE,
  can_view_emergency BOOLEAN DEFAULT TRUE,
  can_call_emergency BOOLEAN DEFAULT FALSE,
  
  -- Active Period
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint
  UNIQUE(pet_id, user_id)
);

-- Indexes
CREATE INDEX ix_pet_access_permissions_pet_id ON pet_access_permissions(pet_id);
CREATE INDEX ix_pet_access_permissions_user_id ON pet_access_permissions(user_id);
CREATE INDEX ix_pet_access_permissions_permission_level ON pet_access_permissions(permission_level);
```

### 13.3 Co-Parent Activity

```sql
CREATE TABLE coparent_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Activity
  activity_type VARCHAR(100),  -- viewed_pet, updated_health, added_memory, etc.
  activity_description TEXT,
  
  -- Entity
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  
  -- Timestamps
  activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ix_coparent_activity_log_pet_id ON coparent_activity_log(pet_id);
CREATE INDEX ix_coparent_activity_log_user_id ON coparent_activity_log(user_id);
CREATE INDEX ix_coparent_activity_log_activity_type ON coparent_activity_log(activity_type);
```

---

## 14. RELATIONSHIPS DIAGRAM

### 14.1 Entity Relationship Overview

```
                          USERS
                            |
              +------+------+------+-------+
              |      |      |      |       |
          SESSIONS  PETS  FAMILY  NOTIFICATIONS  REMINDERS
                      |    MEMBERS     |
          +--------+--+--+--------+    |
          |        |     |        |    |
        HEALTH  FEEDING MEDICATION EMERGENCIES
        RECORDS  LOGS    LOGS       |
          |
      +---+---+
      |   |   |
    VET  VACC  SYMPTOMS
    APPT       & CONCERNS
      
    MEMORIES -> COMMENTS, LIKES
    
    EXPENSES <- (all entities)
    
    MEDICAL_DOCUMENTS <- (health records)
    
    VETERINARY_CLINICS -> (referenced from appointments & emergencies)
```

### 14.2 Key Foreign Key Relationships

```
users (1) ---> (N) pets
users (1) ---> (N) sessions
users (1) ---> (N) health_records (as recorder)
users (1) ---> (N) family_members
users (1) ---> (N) notifications
users (1) ---> (N) reminders

pets (1) ---> (N) health_records
pets (1) ---> (N) feeding_logs
pets (1) ---> (N) feeding_schedules
pets (1) ---> (N) medications
pets (1) ---> (N) medication_logs
pets (1) ---> (N) vet_appointments
pets (1) ---> (N) vaccinations
pets (1) ---> (N) pet_medical_history
pets (1) ---> (N) health_symptoms
pets (1) ---> (N) pet_memories
pets (1) ---> (N) expenses
pets (1) ---> (N) medical_documents
pets (1) ---> (N) pet_access_permissions
pets (1) ---> (N) emergency_events

family_members (1) ---> (N) pet_access_permissions

medications (1) ---> (N) medication_logs

pet_memories (1) ---> (N) memory_comments
pet_memories (1) ---> (N) memory_likes

reminders (1) ---> (N) reminder_occurrences

veterinary_clinics (1) ---> (N) vet_appointments (optional)
veterinary_clinics (1) ---> (N) emergency_events (optional)
```

---

## 15. INDEXING STRATEGY

### 15.1 Primary Key Indexes (Automatic)

```sql
-- All tables have UUID primary keys with automatic indexes
PRIMARY KEY (id) - Always indexed
```

### 15.2 Foreign Key Indexes

```sql
-- All foreign keys automatically indexed for JOIN performance
CREATE INDEX ix_[table]_[fk_column] ON [table]([fk_column]);
```

### 15.3 Search & Filter Indexes

```sql
-- Commonly filtered columns
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_is_active ON users(is_active);
CREATE INDEX ix_pets_owner_id ON pets(owner_id);
CREATE INDEX ix_pets_is_active ON pets(is_active);
CREATE INDEX ix_health_records_pet_id ON health_records(pet_id);
CREATE INDEX ix_feeding_logs_pet_id ON feeding_logs(pet_id);
CREATE INDEX ix_medications_is_active ON medications(is_active);
```

### 15.4 Date/Time Indexes

```sql
-- Chronological queries
CREATE INDEX ix_health_records_record_date ON health_records(record_date DESC);
CREATE INDEX ix_feeding_logs_feeding_date ON feeding_logs(feeding_date DESC);
CREATE INDEX ix_vet_appointments_appointment_date ON vet_appointments(appointment_date);
CREATE INDEX ix_medications_start_date ON medications(start_date DESC);
```

### 15.5 Composite Indexes

```sql
-- Multiple column queries
CREATE INDEX ix_health_records_pet_date 
  ON health_records(pet_id, record_date DESC);

CREATE INDEX ix_feeding_logs_pet_date 
  ON feeding_logs(pet_id, feeding_date DESC);

CREATE INDEX ix_medication_logs_med_date 
  ON medication_logs(medication_id, administration_date DESC);

CREATE INDEX ix_pet_access_pet_user 
  ON pet_access_permissions(pet_id, user_id);
```

### 15.6 Full-Text Search Indexes

```sql
-- Search optimization
CREATE INDEX ix_pet_memories_search 
  ON pet_memories USING GIN(search_text);

CREATE INDEX ix_pet_memories_tags 
  ON pet_memories USING GIN(tags);
```

### 15.7 JSONB Indexes

```sql
-- JSON data searching
CREATE INDEX ix_users_metadata 
  ON users USING GIN(metadata);

CREATE INDEX ix_pets_metadata 
  ON pets USING GIN(metadata);
```

### 15.8 Geographic Indexes

```sql
-- Location-based queries
CREATE INDEX ix_vet_clinics_location 
  ON veterinary_clinics USING GIST(
    ll_to_earth(latitude, longitude)
  );
```

---

## 16. QUERY EXAMPLES

### 16.1 Get Pet Dashboard Data

```sql
SELECT 
  p.id,
  p.name,
  p.pet_type,
  p.profile_image_url,
  p.health_status,
  p.birth_date,
  CURRENT_DATE - p.birth_date AS age_days,
  (SELECT COUNT(*) FROM health_records 
   WHERE pet_id = p.id) AS total_health_checks,
  (SELECT SUM(amount_grams) FROM feeding_logs 
   WHERE pet_id = p.id 
   AND feeding_date = CURRENT_DATE) AS food_consumed_today_grams,
  (SELECT COUNT(*) FROM medications 
   WHERE pet_id = p.id AND is_active = TRUE) AS active_medications,
  (SELECT MAX(record_date) FROM health_records 
   WHERE pet_id = p.id) AS last_health_check,
  (SELECT MAX(feeding_date) FROM feeding_logs 
   WHERE pet_id = p.id) AS last_fed
FROM pets p
WHERE p.owner_id = $1
  AND p.is_active = TRUE
  AND p.deleted_at IS NULL
ORDER BY p.is_primary_pet DESC, p.created_at DESC;
```

### 16.2 Get Today's Medication Schedule

```sql
SELECT 
  m.id,
  m.medication_name,
  m.dosage_amount,
  m.dosage_unit,
  m.specific_times,
  p.name AS pet_name,
  p.id AS pet_id,
  (SELECT COUNT(*) FROM medication_logs 
   WHERE medication_id = m.id 
   AND administration_date = CURRENT_DATE 
   AND was_taken = TRUE) AS administered_count
FROM medications m
JOIN pets p ON m.pet_id = p.id
WHERE p.owner_id = $1
  AND m.is_active = TRUE
  AND m.start_date <= CURRENT_DATE
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
ORDER BY m.specific_times[1];
```

### 16.3 Get Upcoming Vet Appointments (Next 7 Days)

```sql
SELECT 
  va.id,
  va.appointment_date,
  va.appointment_time,
  va.appointment_type,
  va.vet_name,
  va.vet_clinic,
  va.reason,
  p.name AS pet_name,
  p.id AS pet_id,
  CASE 
    WHEN va.reminder_sent = FALSE THEN 'pending'
    ELSE 'sent'
  END AS reminder_status
FROM vet_appointments va
JOIN pets p ON va.pet_id = p.id
WHERE p.owner_id = $1
  AND va.status = 'scheduled'
  AND va.appointment_date BETWEEN CURRENT_DATE 
    AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY va.appointment_date, va.appointment_time;
```

### 16.4 Get Health Timeline (Last 30 Days)

```sql
SELECT 
  'health_record' AS record_type,
  hr.id,
  hr.record_date,
  hr.record_time,
  hr.health_status,
  hr.observations,
  hr.temperature_celsius,
  hr.heart_rate_bpm,
  hr.weight_kg,
  NULL::TEXT AS notes
FROM health_records hr
WHERE hr.pet_id = $1
  AND hr.record_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
  'feeding' AS record_type,
  fl.id,
  fl.feeding_date,
  fl.feeding_time,
  NULL::health_status,
  fl.food_type || ' - ' || fl.amount_grams || 'g',
  NULL::DECIMAL,
  NULL::INTEGER,
  NULL::DECIMAL,
  fl.notes
FROM feeding_logs fl
WHERE fl.pet_id = $1
  AND fl.feeding_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
  'medication' AS record_type,
  ml.id,
  ml.administration_date,
  ml.administration_time,
  CASE WHEN ml.was_taken = TRUE THEN 'healthy' ELSE 'concern' END,
  m.medication_name,
  NULL::DECIMAL,
  NULL::INTEGER,
  NULL::DECIMAL,
  NULL::TEXT
FROM medication_logs ml
JOIN medications m ON ml.medication_id = m.id
WHERE ml.pet_id = $1
  AND ml.administration_date >= CURRENT_DATE - INTERVAL '30 days'

ORDER BY record_date DESC, record_time DESC;
```

### 16.5 Get Co-Parent Dashboard

```sql
SELECT 
  p.id,
  p.name,
  p.profile_image_url,
  p.health_status,
  (SELECT MAX(record_date) FROM health_records 
   WHERE pet_id = p.id) AS last_health_check,
  (SELECT MAX(feeding_date) FROM feeding_logs 
   WHERE pet_id = p.id) AS last_fed,
  (SELECT COUNT(*) FROM pet_memories 
   WHERE pet_id = p.id 
   AND created_at >= CURRENT_DATE - INTERVAL '7 days') AS memories_this_week,
  (SELECT MAX(activity_timestamp) FROM coparent_activity_log 
   WHERE pet_id = p.id 
   AND user_id != $1) AS last_coparent_activity,
  (SELECT MAX(created_at) FROM notifications 
   WHERE related_pet_id = p.id 
   AND user_id = $2) AS last_notification_for_coparent
FROM pets p
JOIN pet_access_permissions pap ON p.id = pap.pet_id
WHERE pap.user_id = $1
  AND pap.is_active = TRUE
  AND p.deleted_at IS NULL
ORDER BY last_coparent_activity DESC NULLS LAST;
```

### 16.6 Get Nearby Vets by Location

```sql
SELECT 
  id,
  clinic_name,
  phone_number,
  address,
  city,
  ROUND(
    CAST(
      6371 * acos(
        cos(radians($2)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians($3)) + 
        sin(radians($2)) * sin(radians(latitude))
      ) AS NUMERIC
    ), 2
  ) AS distance_km,
  emergency_available,
  average_rating,
  opening_hours
FROM veterinary_clinics
WHERE city = $1
  AND emergency_available = TRUE
ORDER BY distance_km ASC
LIMIT 10;
```

### 16.7 Get Monthly Expense Report

```sql
SELECT 
  DATE_TRUNC('month', expense_date)::DATE AS month,
  expense_category,
  COUNT(*) AS transaction_count,
  SUM(amount_currency) AS total_amount,
  AVG(amount_currency) AS avg_amount,
  MIN(amount_currency) AS min_amount,
  MAX(amount_currency) AS max_amount
FROM expenses
WHERE pet_id = $1
  AND expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', expense_date), expense_category
ORDER BY month DESC, expense_category;
```

### 16.8 Get Medication Compliance Report

```sql
SELECT 
  m.medication_name,
  m.frequency,
  COUNT(ml.id) AS doses_logged,
  SUM(CASE WHEN ml.was_taken = TRUE THEN 1 ELSE 0 END) AS doses_taken,
  ROUND(
    (SUM(CASE WHEN ml.was_taken = TRUE THEN 1 ELSE 0 END)::NUMERIC / 
     NULLIF(COUNT(ml.id), 0)) * 100, 2
  ) AS compliance_percentage,
  MAX(ml.administration_date) AS last_dose_date
FROM medications m
LEFT JOIN medication_logs ml ON m.id = ml.medication_id
WHERE m.pet_id = $1
  AND m.start_date <= CURRENT_DATE
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE - INTERVAL '30 days')
GROUP BY m.id, m.medication_name, m.frequency
ORDER BY compliance_percentage ASC;
```

---

## 17. MIGRATION STRATEGY

### 17.1 Database Initialization

```bash
# 1. Create database
createdb -U postgres pawzo_db

# 2. Enable extensions
psql -U postgres -d pawzo_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d pawzo_db -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
psql -U postgres -d pawzo_db -c "CREATE EXTENSION IF NOT EXISTS \"hstore\";"

# 3. Run initialization script
psql -U postgres -d pawzo_db -f /path/to/schema_init.sql
```

### 17.2 Migration Tool Setup (Using Flyway or Liquibase)

```
migrations/
├── V1.0.0__Initial_Schema.sql
├── V1.0.1__Add_Indexes.sql
├── V1.1.0__Add_Notifications.sql
├── V1.2.0__Add_CoParenting.sql
└── V2.0.0__Add_Audit_Trail.sql
```

### 17.3 Migration File Template

```sql
-- V1.0.0__Initial_Schema.sql
-- Description: Initial database schema for Pawzo
-- Author: Team
-- Date: 2026-06-01

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables
CREATE TABLE users (
  -- ... table definition
);

-- Create indexes
CREATE INDEX ix_users_email ON users(email);

-- Create triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

COMMIT;
```

### 17.4 Rollback Strategy

```sql
-- Create rollback script for each migration
-- V1.0.0__Initial_Schema_rollback.sql

BEGIN;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TABLE IF EXISTS users CASCADE;
DROP INDEX IF EXISTS ix_users_email;

COMMIT;
```

---

## 18. BACKUP & SECURITY

### 18.1 Backup Strategy

```bash
# Daily full backup
pg_dump -U postgres -d pawzo_db -Fc > /backups/pawzo_db_$(date +%Y%m%d).backup

# Restore from backup
pg_restore -U postgres -d pawzo_db /backups/pawzo_db_20260615.backup

# Automated backup (cron job)
0 2 * * * pg_dump -U postgres -d pawzo_db -Fc > /backups/pawzo_db_$(date +\%Y\%m\%d).backup
```

### 18.2 Security Best Practices

**User Privileges:**
```sql
-- Create database user (not superuser)
CREATE USER pawzo_app WITH PASSWORD 'strong_password_here';

-- Grant minimal required privileges
GRANT CONNECT ON DATABASE pawzo_db TO pawzo_app;
GRANT USAGE ON SCHEMA public TO pawzo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pawzo_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pawzo_app;
```

**Row-Level Security (RLS):**
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_isolation ON users
  USING (id = current_user_id());

CREATE POLICY pet_owner_access ON pets
  USING (owner_id = current_user_id() OR 
         id IN (SELECT pet_id FROM pet_access_permissions 
                WHERE user_id = current_user_id()));
```

**Password Encryption:**
```sql
-- Store passwords as hashed values (bcrypt, Argon2)
-- Never store plain text passwords

-- Example: Use pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash password on insert/update
CREATE TRIGGER before_insert_users
BEFORE INSERT ON users FOR EACH ROW
EXECUTE FUNCTION crypt(NEW.password_hash, gen_salt('bf'));
```

**Data Encryption:**
```sql
-- Encrypt sensitive fields
ALTER TABLE users 
  ADD COLUMN phone_encrypted TEXT;

-- Use application-level encryption (recommended)
-- Or: pgcrypto for database-level encryption
SELECT pgp_sym_encrypt(phone_number, 'encryption_key')
FROM users;
```

### 18.3 Audit Logging

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  table_name VARCHAR(255) NOT NULL,
  operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  record_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  user_id UUID,
  user_email VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
  VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_function();
```

---

## 19. PERFORMANCE OPTIMIZATION

### 19.1 Query Optimization

**Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT p.name, COUNT(h.id) as health_checks
FROM pets p
LEFT JOIN health_records h ON p.id = h.pet_id
WHERE p.owner_id = $1
GROUP BY p.id, p.name;
```

**Common Optimization Techniques:**

1. **Batch Insert:**
```sql
INSERT INTO feeding_logs (pet_id, feeding_date, amount_grams)
VALUES 
  ($1, $2, $3),
  ($1, $2, $4),
  ($1, $2, $5)
ON CONFLICT DO NOTHING;
```

2. **Pagination:**
```sql
SELECT * FROM pets
WHERE owner_id = $1
ORDER BY created_at DESC
LIMIT 20
OFFSET ($2 - 1) * 20;
```

3. **Connection Pooling:**
```
Use PgBouncer or connection pool in application
Max connections: 100-200
Pool size: 20-50
```

### 19.2 Table Partitioning

```sql
-- Partition large tables by date (e.g., health_records, feeding_logs)
CREATE TABLE health_records_2026_01 PARTITION OF health_records
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE health_records_2026_02 PARTITION OF health_records
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### 19.3 Caching Strategy

**Query Results Cache (Redis):**
```
- Pet dashboard: Cache 5 minutes
- Health timeline: Cache 1 hour
- Medication schedule: Cache 30 minutes
- Memories: Cache 1 hour
- Nearby vets: Cache 24 hours
```

### 19.4 Monitoring

```sql
-- Monitor slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table size
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## APPENDIX A: Sample Data Script

```sql
-- Insert sample user
INSERT INTO users (email, first_name, last_name, password_hash)
VALUES ('john@example.com', 'John', 'Doe', 'hashed_password_here');

-- Insert sample pet
INSERT INTO pets (owner_id, name, pet_type, breed, birth_date, gender)
SELECT id, 'Fluffy', 'cat', 'Siamese', '2020-01-15', 'female'
FROM users WHERE email = 'john@example.com';

-- Insert sample health record
INSERT INTO health_records (pet_id, record_date, temperature_celsius, heart_rate_bpm, weight_kg)
SELECT id, CURRENT_DATE, 38.5, 120, 4.5
FROM pets WHERE name = 'Fluffy';
```

---

## APPENDIX B: PostgreSQL Configuration Recommendations

```ini
# postgresql.conf optimizations

# Memory
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
work_mem = 4MB                      # RAM / (max_connections * 2)

# Connections
max_connections = 200
superuser_reserved_connections = 3

# WAL
wal_level = replica
max_wal_senders = 3

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

---

*Document Version: 1.0*  
*Created: June 2026*  
*Database: PostgreSQL 14+*  
*Status: Ready for Development*  
*Owner: Backend Team*

**This database schema is the foundation for all Pawzo data storage and must be reviewed by the team before implementation.**
