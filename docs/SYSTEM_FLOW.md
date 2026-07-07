# PAWZO SYSTEM FLOW
## Complete User Journey & System Architecture
### Comprehensive Application Flow Map

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Onboarding Flow](#2-user-onboarding-flow)
3. [Authentication Flows](#3-authentication-flows)
4. [Main Dashboard](#4-main-dashboard)
5. [Pet Management Flow](#5-pet-management-flow)
6. [Pet Profile Structure](#6-pet-profile-structure)
7. [Pet Feeding System](#7-pet-feeding-system)
8. [Health & Wellness Flow](#8-health--wellness-flow)
9. [Expense Tracking](#9-expense-tracking)
10. [User Profile & Settings](#10-user-profile--settings)
11. [Home Navigation Hub](#11-home-navigation-hub)
12. [State Management](#12-state-management)
13. [Error Handling](#13-error-handling)
14. [Data Flow Diagrams](#14-data-flow-diagrams)

---

## 1. OVERVIEW

### 1.1 Application Architecture

```
PAWZO Application Flow Structure:

┌─ LANDING PAGE
│  └─ Welcome Introduction
│     ├─ Login
│     └─ Sign Up
│
├─ AUTHENTICATION PHASE
│  ├─ Email/Password Login
│  └─ Sign Up Process
│
├─ ONBOARDING PHASE
│  ├─ User Data Collection
│  ├─ Notification Permissions
│  └─ App Tour
│
└─ MAIN APPLICATION
   ├─ Dashboard (Home Hub)
   ├─ Pet Management
   ├─ Health & Wellness
   ├─ Feeding & Nutrition
   ├─ Expenses
   ├─ Memories
   ├─ Profile & Settings
   └─ Emergency Services
```

### 1.2 Key User Flows

1. **New User:** Landing → Sign Up → User Data → Permissions → Tour → Dashboard
2. **Existing User:** Landing → Login → Dashboard
3. **Pet Owner:** Dashboard → Select Pet → Pet Features (Food, Health, etc.)
4. **AI Help:** Ask AI tab → Ask a question (optionally about a specific pet) → Guidance

---

## 2. USER ONBOARDING FLOW

### 2.1 Landing Page

```
LANDING PAGE
├─ Purpose: App introduction and entry point
├─ Key Elements:
│  ├─ App logo and brand
│  ├─ Value proposition
│  ├─ "Sign Up" CTA
│  ├─ "Login" link
│  └─ Social proof (optional)
└─ Navigation:
   ├─ Click "Login" → Login Page
   ├─ Click "Sign Up" → Sign Up Page
   └─ Click "Get Started (Free)" → Sign Up
```

### 2.2 Welcome Page

```
WELCOME PAGE (Optional post-landing)
├─ Purpose: App features overview
├─ Content:
│  ├─ Feature highlights
│  ├─ Benefits of using Pawzo
│  ├─ Social proof/testimonials
│  └─ CTAs for sign up/login
└─ Actions:
   └─ "Get Started" → Sign Up Page
```

### 2.3 Sign Up Flow

```
SIGN UP PAGE
├─ Fields:
│  ├─ Full Name
│  ├─ Username
│  ├─ Email
│  ├─ Create Password
│  ├─ Confirm Password
│  └─ Agree to Terms
│
├─ Validation:
│  ├─ Email format validation
│  ├─ Password strength requirements
│  ├─ Username uniqueness check
│  └─ Terms agreement required
│
├─ Success:
│  └─ "Login" button → User Data Collection Page
│
└─ Error States:
   ├─ Duplicate email → Show error message
   ├─ Weak password → Show requirements
   └─ Username taken → Suggest alternatives
```

---

## 3. AUTHENTICATION FLOWS

### 3.1 Login Flow (Email/Password)

```
LOGIN PAGE
├─ Inputs:
│  ├─ Email or Username
│  └─ Password
│
├─ Options:
│  ├─ "Forgot Password" link
│  └─ "Sign Up" link
│
├─ Success Flow:
│  ├─ Validate credentials
│  ├─ Check email verification status
│  │  ├─ If verified → Dashboard
│  │  └─ If not verified → Verification Prompt
│  └─ Issue JWT (stored client-side; keeps the user signed in)
│
└─ Error Flow:
   ├─ Invalid email/password
   ├─ Account locked (too many attempts)
   ├─ Account not verified
   └─ Server error
```

### 3.2 Sign Up Completion

```
USER DATA COLLECTION (Post Sign Up)
├─ Purpose: Complete profile setup
├─ Screens:
│  ├─ Screen 1: Basic Profile
│  │  ├─ Full Name (pre-filled)
│  │  ├─ Profile Picture
│  │  └─ Bio/About (optional)
│  │
│  ├─ Screen 2: Preferences
│  │  ├─ Language Preference
│  │  ├─ Timezone
│  │  └─ Notification Frequency
│  │
│  └─ Screen 3: Notifications Permission
│     ├─ Enable push notifications?
│     ├─ Enable email notifications?
│     └─ Enable sound effects?
│
├─ App Tour (Optional):
│  ├─ Feature introduction
│  ├─ Quick tips
│  ├─ "Next" buttons between screens
│  └─ "Skip" option
│
└─ Completion:
   └─ "Start Using Pawzo" → Dashboard
```

---

## 4. MAIN DASHBOARD

### 4.1 Dashboard Overview

```
DASHBOARD (Home Hub)
├─ Purpose: Central hub for all pet information
├─ Key Sections:
│  ├─ Header
│  │  ├─ Welcome message ("Hi, [Name]!")
│  │  └─ Notification bell
│  │
│  ├─ MY PETS Section
│  │  ├─ Pet cards (2-3 displayed)
│  │  ├─ "More..." option if >3 pets
│  │  └─ "+ New Pet" button
│  │
│  ├─ Quick Stats (per pet)
│  │  ├─ Health status (green/yellow/red)
│  │  ├─ Last feeding time
│  │  ├─ Active medications
│  │  └─ Last health check
│  │
│  └─ Quick Actions
│     └─ "Emergency"
│
├─ Calendar Tab (Bottom Navigation)
│  ├─ Monthly calendar view
│  ├─ Events marked by date
│  ├─ Tap date for details
│  └─ Create event option
│
├─ Memory Gallery Tab (Bottom Navigation)
│  ├─ Photo grid (3-column)
│  ├─ Filter by pet/date
│  ├─ Tap for full view
│  └─ Add memory (caption, mood, tags)
│
└─ Navigation:
   ├─ Tap Pet Card → Pet Profile Page
   ├─ Tap "+ New Pet" → Add Pet Flow
   ├─ Bottom Navigation Tabs (5 tabs)
   └─ Top Hamburger Menu
```

### 4.2 Dashboard Data Flow

```
Dashboard Data Update Flow:
┌─ Page Load
├─ Fetch User Data
├─ Fetch All Pets for User
├─ For Each Pet:
│  ├─ Fetch Health Status
│  ├─ Fetch Latest Feeding Log
│  ├─ Fetch Active Medications
│  └─ Fetch Latest Health Record
├─ Fetch Today's Reminders
├─ Render Dashboard
└─ Poll for updates every 5 minutes (socket/API)
```

---

## 5. PET MANAGEMENT FLOW

### 5.1 Add New Pet Flow

```
ADD NEW PET (+ New Pet Button)
├─ Step 1: Upload Profile Picture
│  ├─ Camera icon
│  ├─ Upload from gallery
│  └─ Optional
│
├─ Step 2: Pet Basic Information
│  ├─ Pet Name (required)
│  ├─ Species (dropdown: Dog, Cat, Bird, etc.)
│  ├─ Breed (text input)
│  └─ Gender (radio: Male, Female, Unknown)
│
├─ Step 3: Pet Physical Details
│  ├─ Birth Date (date picker)
│  ├─ Weight (kg/lbs)
│  ├─ Size/Height (optional)
│  └─ Color (optional)
│
├─ Step 4: Additional Info
│  ├─ Microchip ID (optional)
│  ├─ Registration Number (optional)
│  └─ Special Notes/Bio
│
├─ Form Validation:
│  ├─ Name required (1-100 chars)
│  ├─ Species required
│  ├─ Valid date format
│  └─ Age calculation from birth date
│
├─ Buttons:
│  ├─ "Cancel" (discard changes)
│  ├─ "Save Profile" (save and go to pet detail)
│  └─ "Back" (previous step)
│
└─ Success:
   └─ → Pet Profile Page
```

### 5.2 View All Pets

```
MY PETS LIST PAGE
├─ Shows:
│  ├─ Pet 1 Card
│  │  ├─ Pet avatar/image
│  │  ├─ Pet name
│  │  ├─ Breed/type
│  │  └─ Quick health status
│  │
│  ├─ Pet 2 Card
│  │  └─ (same as Pet 1)
│  │
│  ├─ More... (shows remaining pets in grid)
│  └─ "+ New Pet" button
│
├─ Actions:
│  ├─ Tap pet card → Pet Profile
│  ├─ Long press → Edit/Delete options
│  └─ "+ New Pet" → Add New Pet Flow
│
└─ Sorting:
   └─ Primary pet first, then by creation date
```

---

## 6. PET PROFILE STRUCTURE

### 6.1 Pet Profile Page

```
PET PROFILE PAGE (After clicking a pet from Dashboard)
├─ Header Section:
│  ├─ Pet avatar/image
│  ├─ Pet name (editable)
│  └─ Back button to Dashboard
│
├─ Main Tabs/Sections (Scrollable):
│  │
│  ├─ TAB 1: TODAY'S SCHEDULE
│  │  ├─ Upcoming feeding times
│  │  ├─ Medication reminders
│  │  ├─ Vet appointments
│  │  └─ Quick action buttons
│  │
│  ├─ TAB 2: FOOD & NUTRITION
│  │  ├─ Today's menu (breakfast, lunch, dinner)
│  │  ├─ Change menu options
│  │  ├─ Meal graph
│  │  ├─ Food statistics
│  │  └─ Meal history
│  │
│  ├─ TAB 3: HEALTH & WELLNESS
│  │  ├─ Health overview
│  │  ├─ Weight tracking
│  │  ├─ Vaccination status
│  │  ├─ Health clinic ledger
│  │  └─ Add health records
│  │
│  ├─ TAB 4: EXPENSES
│  │  ├─ Add expense entry
│  │  ├─ Expense categories
│  │  ├─ Cost distribution chart
│  │  ├─ Recent invoices/receipts
│  │  └─ Spending reports
│  │
│  ├─ TAB 5: ASK AI
│  │  ├─ Chat with AI assistant
│  │  ├─ Pet-specific questions
│  │  ├─ Health & nutrition advice
│  │  └─ Care recommendations
│  │
│  └─ TAB 6: PET PROFILE
│     ├─ Pet Image (large display)
│     ├─ Pet Name
│     ├─ Date of Birth (DOB)
│     ├─ Age (calculated)
│     ├─ Weight
│     ├─ Pet Type/Species
│     ├─ Breed
│     ├─ Gender
│     └─ "Update Details" button (edit all fields)
│
└─ Bottom Actions:
   ├─ Edit Pet
   └─ Delete Pet (with confirmation)
```

### 6.2 Pet Profile Editing

```
EDIT PET DETAILS
├─ Same fields as Add Pet:
│  ├─ Pet Name
│  ├─ Breed
│  ├─ DOB
│  ├─ Gender
│  ├─ Weight
│  ├─ Pet Type
│  ├─ Pet Image
│  └─ Special Notes
│
├─ Changes tracked:
│  ├─ Save button only active if changes
│  └─ "Cancel" discards changes
│
└─ Success:
   └─ → Pet Profile Page (updated)
```

---

## 7. PET FEEDING SYSTEM

### 7.1 Food Management

```
FOOD / FEEDING SECTION
├─ Today's Menu
│  ├─ Breakfast (time, amount, type)
│  ├─ Lunch (time, amount, type)
│  ├─ Dinner (time, amount, type)
│  └─ "+ Add Menu" button (additional meals)
│
├─ Change Menu Options:
│  ├─ "Design Your Menu" (custom creation)
│  │  ├─ Select meals
│  │  ├─ Set times
│  │  └─ Set amounts
│  │
│  └─ "Ask AI" (AI-generated recommendations)
│     ├─ Pet type input
│     ├─ Current diet input
│     ├─ Dietary restrictions
│     └─ AI suggests menu
│
├─ Meal Graph:
│  ├─ Visual chart of meal schedule
│  ├─ Completion tracker
│  └─ Trends over time
│
├─ Food Statistics:
│  ├─ Total calories consumed
│  ├─ Nutrition breakdown
│  ├─ Average meal size
│  └─ Consistency rating
│
└─ Meal History:
   ├─ List of all past meals
   ├─ Filter by date range
   ├─ Edit/delete past meals
   └─ Notes on each meal
```

### 7.2 Log Feeding Entry

```
LOG FEEDING ENTRY (from Today's Menu)
├─ Pre-filled from schedule:
│  ├─ Time (from schedule)
│  ├─ Food type
│  ├─ Planned amount
│  └─ Date
│
├─ Actual Consumption:
│  ├─ Amount consumed (grams/cups)
│  ├─ Percentage eaten (slider 0-100%)
│  ├─ Plate cleaned? (yes/no)
│  └─ Notes
│
├─ Actions:
│  ├─ "Save" → Confirm and update statistics
│  └─ "Cancel" → Discard
│
└─ Notification:
   ├─ Sound effect (tingly happy tone)
   └─ Toast: "Feeding logged! 🐾"
```

---

## 8. HEALTH & WELLNESS FLOW

### 8.1 Health Overview

```
HEALTH & WELLNESS SECTION
├─ Health and Vaccination Status
│  ├─ Overall health indicator
│  ├─ Last health check date
│  ├─ Active conditions
│  ├─ Vaccination status
│  └─ Next vaccinations due
│
├─ Weight Matrix
│  ├─ Current weight
│  ├─ Weight history graph
│  ├─ Weight trend (up/down/stable)
│  ├─ Ideal weight range
│  └─ "Log Weight" button
│
├─ Health Clinic Ledger:
│  ├─ "+ Vaccination" (new vaccination record)
│  ├─ "+ Vet Consultation" (new visit)
│  ├─ "Vaccine & Booster" (history)
│  ├─ "Current Medications" (active drugs)
│  ├─ "Vet Consultation History"
│  └─ "Prescription History"
│
└─ Quick Actions:
   ├─ "Schedule Vet Visit"
   ├─ "Add Health Note"
   ├─ "Add Symptom"
   └─ "Emergency"
```

### 8.2 Log Weight

```
LOG WEIGHT ENTRY
├─ Inputs:
│  ├─ Weight (kg/lbs)
│  ├─ Date Checked (today by default)
│  └─ Notes (optional)
│
├─ Display:
│  ├─ Previous weight
│  ├─ Weight change (+ or -)
│  ├─ Percentage change
│  └─ Days since last check
│
├─ Actions:
│  ├─ "Save" → Add to weight history
│  └─ "Log Checked Weight Data"
│
└─ Automatic:
   ├─ Update graph
   └─ Send notification if abnormal change
```

### 8.3 Health Records

```
HEALTH RECORDS / CLINIC LEDGER
├─ Add Vaccination:
│  ├─ Vaccine name
│  ├─ Vaccination date
│  ├─ Next due date
│  ├─ Vet clinic
│  ├─ Certificate upload (optional)
│  └─ Notes
│
├─ Add Vet Consultation:
│  ├─ Consultation date
│  ├─ Vet name & clinic
│  ├─ Reason for visit
│  ├─ Diagnosis
│  ├─ Prescription (if any)
│  ├─ Notes
│  └─ Upload medical documents
│
├─ Add Medication:
│  ├─ Medication name
│  ├─ Dosage
│  ├─ Frequency
│  ├─ Start date
│  ├─ End date (if applicable)
│  ├─ Prescribed by (vet name)
│  └─ Reason prescribed
│
├─ View Records:
│  ├─ Vaccination list (sorted by date)
│  ├─ Consultation history
│  ├─ Current medications
│  └─ Prescription history
│
└─ Actions per Record:
   ├─ Edit
   ├─ Delete
   ├─ Download/Share
   └─ Print
```

---

## 9. EXPENSE TRACKING

### 9.1 Expenses Section

```
EXPENSES / SPENDING TRACKER
├─ Categories:
│  ├─ Food expenses
│  ├─ Vet/Medical
│  ├─ Grooming
│  ├─ Toys & Supplies
│  └─ Miscellaneous
│
├─ Add Expense Entry:
│  ├─ Category (dropdown)
│  ├─ Item Name
│  ├─ Amount Paid (currency)
│  ├─ Date of Purchase
│  ├─ Payment Invoice Date (optional)
│  └─ "Add Receipt Details" (optional)
│
├─ Receipt Management:
│  ├─ Upload receipt image
│  ├─ OCR extraction (optional)
│  └─ Store digitally
│
├─ Views:
│  ├─ Monthly spending report
│  ├─ Category breakdown
│  ├─ Total spent per category
│  ├─ Spending trends
│  ├─ Compare to budget
│  ├─ Total Visual Cost Distribution (pie/donut chart)
│  └─ Recent Invoices/Receipts (history list)
│
└─ Actions:
   ├─ Edit expense
   ├─ Delete expense
   ├─ Share report
   ├─ Export to CSV
   └─ Set budget alerts

### 9.2 Total Visual Cost Distribution

```
COST DISTRIBUTION VISUALIZATION
├─ Chart Type:
│  ├─ Pie chart (default)
│  ├─ Donut chart
│  └─ Bar chart alternative
│
├─ Display Options:
│  ├─ By category (Food, Vet, Grooming, Toys, Misc)
│  ├─ By time period (Monthly, Quarterly, Yearly)
│  ├─ By pet (if multiple pets)
│  └─ All pets combined
│
├─ Interactive Features:
│  ├─ Tap slice to see details
│  ├─ Filter by date range
│  ├─ Zoom/expand view
│  └─ Export chart as image
│
└─ Insights:
   ├─ Largest expense category
   ├─ Percentage breakdown
   ├─ Spending variance from average
   └─ Predictions for next period
```

### 9.3 Recent Invoices/Receipts

```
RECEIPT HISTORY & MANAGEMENT
├─ List View:
│  ├─ Most recent invoices first
│  ├─ Date, category, amount, vendor
│  ├─ Thumbnail of receipt image (if uploaded)
│  └─ Status badge (paid, pending, disputed)
│
├─ Filter Options:
│  ├─ By date range
│  ├─ By category
│  ├─ By vendor
│  ├─ By payment status
│  └─ Search by description
│
├─ Actions per Receipt:
│  ├─ View full details
│  ├─ View receipt image (zoomed)
│  ├─ Download receipt
│  ├─ Share receipt
│  ├─ Edit details
│  ├─ Delete receipt
│  └─ Link to expense entry
│
├─ Receipt Details:
│  ├─ Receipt image/scan
│  ├─ Date of purchase
│  ├─ Vendor/store name
│  ├─ Category
│  ├─ Items purchased (line items)
│  ├─ Subtotal/tax/total
│  ├─ Payment method
│  ├─ Transaction ID
│  ├─ OCR extracted text
│  └─ Custom notes
│
└─ Organization:
   ├─ Archive old receipts
   ├─ Favorite important receipts
   ├─ Organize by folders/tags
   └─ Search across all receipts
```
```

---

## 10. USER PROFILE & SETTINGS

### 10.1 Profile Page

```
PROFILE PAGE
├─ Header:
│  ├─ User avatar/profile picture
│  ├─ Full Name
│  └─ Username
│
├─ User Information:
│  ├─ Full Name (editable)
│  ├─ Username (editable)
│  ├─ Bio (editable)
│  └─ Email (read-only)
│
├─ Achievements:
│  ├─ Badges earned
│  ├─ Pet count
│  ├─ Days active
│  └─ Milestones reached
│
├─ Stats:
│  ├─ Joined Date
│  ├─ Total Pets Added
│  ├─ Total Memories Created
│  ├─ Total Check-ins
│  └─ App Usage Stats
│
├─ Quick Actions:
│  ├─ "Rate App" (App Store)
│  ├─ "Share App" (Social/Friends)
│  └─ Edit Profile
│
└─ Sections:
   └─ → Account Settings
   └─ → Calendar / Events
   └─ → Memory Gallery
```

### 10.2 Settings Page

```
SETTINGS PAGE
├─ Theme Settings:
│  ├─ Light Mode
│  ├─ Dark Mode
│  └─ Auto (system)
│
├─ Account Settings:
│  ├─ Change Username (edit field)
│  ├─ Change Password
│  ├─ Two-Factor Authentication
│  ├─ Connected Devices
│  └─ Session Management
│
├─ Privacy & Security:
│  ├─ Privacy Policy (external link)
│  ├─ Terms of Use (external link)
│  ├─ Logout
│  └─ Delete Account (with confirmation)
│
├─ Notification Preferences:
│  ├─ Push Notifications (toggle)
│  ├─ Email Notifications (toggle)
│  ├─ Sound Effects (toggle)
│  ├─ Notification Sound (selector)
│  └─ Quiet Hours (time range)
│
├─ App Preferences:
│  ├─ Language (dropdown)
│  ├─ Timezone (dropdown)
│  ├─ Measurement Units (metric/imperial)
│  └─ Currency (dropdown)
│
└─ Data Management:
   ├─ Export My Data
   ├─ Backup Data
   ├─ Delete All Data
   ├─ Download Health Records
   └─ Clear Cache
```

---

## 11. HOME NAVIGATION HUB

### 11.1 Bottom Navigation Bar

```
BOTTOM NAVIGATION (Always Visible)
├─ Position: Fixed at bottom of screen
├─ Height: ~56px (mobile design standard)
├─ Background: Light (or dark in dark mode)
├─ Items (5 tabs):
│  │
│  ├─ 1. HOME / DASHBOARD
│  │  ├─ Icon: House icon
│  │  ├─ Label: "Home"
│  │  ├─ Contains: My Pets, Calendar, Memory Gallery
│  │  └─ → Dashboard Page
│  │
│  ├─ 2. NOTIFICATIONS
│  │  ├─ Icon: Bell icon
│  │  ├─ Label: "Notifications"
│  │  ├─ Badge: Unread count
│  │  └─ → Notifications List
│  │
│  ├─ 3. PROFILE / ACCOUNT
│  │  ├─ Icon: User/Person icon
│  │  ├─ Label: "Profile"
│  │  └─ → Profile Page
│  │
│  ├─ 4. SETTINGS
│  │  ├─ Icon: Gear/Settings icon
│  │  ├─ Label: "Settings"
│  │  └─ → Settings Page
│  │
│  └─ 5. PET DETAIL (Context-Aware)
│     ├─ Shows when user is viewing a pet profile
│     ├─ Displays pet name/icon
│     └─ Quick access to pet tabs
│
├─ Active Tab:
│  ├─ Color: Primary accent color (#BA324F)
│  ├─ Icon: Filled/bold
│  └─ Label: Visible
│
└─ Inactive Tab:
   ├─ Color: Secondary gray
   ├─ Icon: Outline
   └─ Label: Visible
```

### 11.2 Navigation States

```
Navigation State Management:
├─ Current Tab Tracking:
│  ├─ Store in app state
│  ├─ Persist between sessions
│  └─ Update on tab click
│
├─ Page Stack (Back Navigation):
│  ├─ Home → Dashboard
│  ├─ Notifications → Alert List
│  ├─ Profile → Settings → Account Settings
│  ├─ Calendar → Event Details
│  └─ Memories → Gallery → Photo Viewer
│
├─ Deep Linking:
│  ├─ Notification click → specific page
│  ├─ Share link → pet profile
│  ├─ Emergency → emergency page
│  └─ Reminder → related page
│
└─ Back Button Behavior:
   ├─ Mobile: Android back button
   ├─ Web: Browser back / header back arrow
   └─ Confirmation before leaving unsaved
```

### 11.3 Dashboard Home Page (Updated Structure)

```
DASHBOARD HOME PAGE (Corrected)
├─ Default View:
│  ├─ My Pets Section
│  ├─ Quick Stats
│  └─ Quick Actions
│
├─ Sliding Tabs/Sections:
│  │
│  ├─ TAB 1: MY PETS (Default)
│  │  ├─ Pet cards (2-3 displayed)
│  │  ├─ Health status badges
│  │  ├─ Last feeding/activity
│  │  └─ "+ New Pet" button
│  │
│  ├─ TAB 2: CALENDAR
│  │  ├─ Monthly calendar view
│  │  ├─ Events marked by date
│  │  ├─ All pet events combined
│  │  ├─ Tap date for event details
│  │  └─ Create event button
│  │
│  └─ TAB 3: MEMORY GALLERY
│     ├─ Photo grid (3-column)
│     ├─ All photos from all pets
│     ├─ Filter by pet/date
│     ├─ Tap for full view
│     └─ Add memory (caption, mood, tags)
│
└─ Navigation:
   ├─ Tap Pet Card → Pet Profile Page (with 6 tabs)
   ├─ Swipe to switch tabs
   └─ Bottom nav always visible
```

---

**PET PROFILE PAGE NAVIGATION (When Pet is Selected)**

```
PET PROFILE PAGE TABS
├─ TAB 1: TODAY'S SCHEDULE
│  ├─ Feeding times for today
│  ├─ Medication reminders
│  ├─ Vet appointments
│  └─ Mark as complete buttons
│
├─ TAB 2: FOOD
│  ├─ Today's menu setup
│  ├─ Log feeding entries
│  ├─ Meal statistics
│  └─ Feeding history
│
├─ TAB 3: HEALTH
│  ├─ Health records
│  ├─ Weight tracking
│  ├─ Vaccinations
│  ├─ Medications
│  └─ Health clinic ledger
│
├─ TAB 4: EXPENSES
│  ├─ Add expense entries
│  ├─ Expense breakdown
│  ├─ Receipt management
│  └─ Cost distribution chart
│
├─ TAB 5: ASK AI
│  ├─ AI chat interface
│  ├─ Pet-specific questions
│  ├─ Recommendations
│  └─ Health advice
│
└─ TAB 6: PET PROFILE
   ├─ Pet Image (display)
   ├─ Pet Name
   ├─ Breed
   ├─ Date of Birth
   ├─ Age
   ├─ Weight
   ├─ Pet Type
   ├─ Gender
   └─ "Update Details" button
```

---

## 12. STATE MANAGEMENT

### 12.1 Application State

```
Global State Structure:
│
├─ User State:
│  ├─ user_id
│  ├─ email
│  ├─ full_name
│  ├─ username
│  ├─ avatar_url
│  ├─ is_logged_in
│  ├─ auth_token
│  └─ preferences
│
├─ Pets State:
│  ├─ all_pets (array)
│  ├─ selected_pet_id
│  ├─ pets_loading
│  └─ pets_error
│
├─ Navigation State:
│  ├─ current_tab
│  ├─ current_page
│  ├─ page_stack (for back navigation)
│  └─ modal_stack
│
├─ Data State:
│  ├─ health_records
│  ├─ feeding_logs
│  ├─ medications
│  ├─ vaccinations
│  ├─ expenses
│  ├─ memories
│  ├─ notifications
│  └─ reminders
│
├─ UI State:
│  ├─ loading
│  ├─ errors
│  ├─ snackbar_message
│  ├─ modal_open
│  └─ theme (light/dark)
│
└─ Session State:
   ├─ last_activity
   ├─ session_timeout
   ├─ notification_settings
   └─ app_version
```

### 12.2 Data Synchronization

```
Data Sync Flow:
├─ On App Load:
│  ├─ Check auth token validity
│  ├─ Fetch user data
│  ├─ Fetch pets list
│  └─ Initialize local storage
│
├─ Page Navigation:
│  ├─ Fetch page-specific data
│  ├─ Show loading state
│  └─ Cache results
│
├─ Real-time Updates:
│  ├─ WebSocket connection for live data
│  ├─ Notification push updates
│  ├─ Poll for updates (5-min interval)
│  └─ Update UI on data change
│
├─ Offline Support:
│  ├─ Cache critical data locally
│  ├─ Queue actions for sync
│  ├─ Show offline indicator
│  └─ Sync when online
│
└─ Error Handling:
   ├─ Retry failed requests
   ├─ Show error messages
   ├─ Fallback to cached data
   └─ Log errors for debugging
```

---

## 13. ERROR HANDLING

### 13.1 Error States

```
Network Errors:
├─ No Internet Connection
│  ├─ Show: "No internet connection"
│  ├─ Offer: "Retry" or "Use offline mode"
│  └─ Cache: Use cached data if available
│
├─ Timeout (>30 seconds)
│  ├─ Show: "Request timed out"
│  ├─ Offer: "Retry"
│  └─ Auto-retry: Up to 3 times
│
└─ Server Error (5xx)
   ├─ Show: "Server error. Please try again."
   ├─ Offer: "Retry" or "Report issue"
   └─ Log: Send error report to backend

User Errors:
├─ Validation Error
│  ├─ Invalid email → "Invalid email format"
│  ├─ Missing required field → Highlight field
│  ├─ Password too weak → "Password must contain..."
│  └─ File too large → "File size exceeds limit"
│
├─ Permission Error
│  ├─ No access to pet → "You don't have access to this pet"
│  ├─ No notification permission → "Enable permission in settings"
│  └─ Read-only access → "You can only view this"
│
└─ Business Logic Error
   ├─ Pet not found → "Pet no longer exists"
   ├─ Appointment passed → "Cannot edit past appointment"
   └─ Invalid state → "Cannot perform this action"
```

### 13.2 Error UI Patterns

```
Error Display Patterns:

1. Toast/Snackbar (bottom):
   ├─ Duration: 3-5 seconds
   ├─ Color: #D62839 (red) for errors
   ├─ Action: Optional "Retry" button
   └─ Example: "Failed to save. Tap to retry."

2. Inline Error Messages:
   ├─ Position: Below input field
   ├─ Color: #D62839
   ├─ Animation: Shake effect
   └─ Example: "Email already registered"

3. Modal/Dialog:
   ├─ Title: Error description
   ├─ Body: Full error explanation
   ├─ Actions: "OK", "Retry", "Contact Support"
   └─ Usage: Critical errors only

4. Empty State:
   ├─ Icon: Gray illustration
   ├─ Message: "No data available"
   ├─ Action: "Retry" or "Create new"
   └─ Usage: When list is empty

5. Loading State:
   ├─ Spinner: Animated circle
   ├─ Color: #BA324F (primary)
   ├─ Text: "Loading..." (optional)
   └─ Duration: Until data loads
```

---

## 14. DATA FLOW DIAGRAMS

### 14.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     PAWZO USER JOURNEY                       │
└─────────────────────────────────────────────────────────────┘

     ┌─ LANDING ─ AUTHENTICATION ─ ONBOARDING ─ MAIN APP ─┐
     │                                                      │
     ▼                                                      ▼
 [Entry]                                            [Dashboard]
   │                                                    │
   ├─ Login                    OR    ┌───────────────┬─┴─┬──────────┐
   │  └─ Email/Password              │               │   │          │
   │     └─ Home Dashboard           │               │   │          │
   │                          OR     ▼               ▼   ▼          ▼
   │                              [Select Pet]  [Health] [Food] [Emergency]
   └─ Sign Up                         │
      └─ User Data                    ├─ Pet Details
      └─ Permissions                  ├─ Add Pet
      └─ App Tour                     ├─ Edit Pet
      └─ Home Dashboard              └─ Delete Pet
                                        │
                                        ├─ Health Records
                                        ├─ Feeding Logs
                                        ├─ Medications
                                        ├─ Expenses
                                        └─ Memories
```

### 14.2 Pet Health Management Flow

```
┌────────────────────────────────────────┐
│   PET HEALTH MANAGEMENT WORKFLOW        │
└────────────────────────────────────────┘

User Opens Pet Profile
        │
        ├─────────────────────┬──────────────┬────────────┐
        │                     │              │            │
        ▼                     ▼              ▼            ▼
   [Health Tab]         [Feeding Tab]   [Expenses]  [Ask AI]
        │
        ├─────────┬────────────┬──────────────┐
        │         │            │              │
        ▼         ▼            ▼              ▼
    [Weight]  [Vaccines]  [Medication]  [Vet Visit]
        │         │            │              │
        └─────────┴────────────┴──────────────┘
                  │
                  ▼
          [Notification Sent]
                  │
                  ├─ Push notification
                  ├─ Email notification
                  └─ In-app alert
                  │
                  ▼
          [Dashboard Updated]
```

### 14.3 Feeding Workflow

```
┌────────────────────────────────────┐
│    FEEDING MANAGEMENT WORKFLOW      │
└────────────────────────────────────┘

[Food Section]
    │
    ├─ Today's Menu
    │    │
    │    ├─ Breakfast Time
    │    │    └─ [Log Feeding] → Actual consumed
    │    ├─ Lunch Time
    │    │    └─ [Log Feeding] → Actual consumed
    │    └─ Dinner Time
    │         └─ [Log Feeding] → Actual consumed
    │
    ├─ Change Menu
    │    ├─ Design Your Menu
    │    │    └─ Customize meals & times
    │    └─ Ask AI
    │         └─ AI recommends menu
    │
    ├─ Meal Graph
    │    └─ Visual schedule
    │
    ├─ Food Statistics
    │    └─ Calories, nutrition, trends
    │
    └─ Meal History
         └─ All past meals with notes

[Reminders Sent]
    │
    ├─ 30 min before feeding
    ├─ Notification sound
    └─ Dashboard update
```

---

## 15. KEY METRICS & TRACKING

### 15.1 User Flow Metrics

```
Metrics to Track:

Sign Up Funnel:
├─ Landing page views
├─ Sign up clicks
├─ Email confirmation rate
├─ First login rate
├─ First pet added rate (conversion)
└─ Active after 7 days (retention)

Main App Usage:
├─ Daily active users (DAU)
├─ Monthly active users (MAU)
├─ Feature usage (what features used most)
├─ Average session duration
├─ Days between sessions
└─ Churn rate (inactive users)

Pet Management:
├─ Avg pets per user
├─ Health records logged
├─ Feeding logs logged
├─ Medications tracked
├─ Memories created
└─ Documents uploaded
```

---

## 16. APPENDIX: COMPLETE PAGE TREE

```
PAWZO - COMPLETE SITE MAP

Home (/)
├─ Landing Page
│  ├─ Welcome Page
│  ├─ Features Overview
│  └─ Call-to-Action
│
├─ Authentication
│  ├─ Login (/login)
│  │  ├─ Email/Password Login
│  │  ├─ Forgot Password
│  │  └─ Sign Up Link
│  │
│  ├─ Sign Up (/signup)
│  │  ├─ Registration Form
│  │  │  ├─ Full Name
│  │  │  ├─ Username
│  │  │  ├─ Email
│  │  │  ├─ Password
│  │  │  ├─ Confirm Password
│  │  │  └─ Agree Terms
│  │  │
│  │  ├─ Email Verification
│  │  └─ User Data Collection
│  │
│  └─ Onboarding (/onboard)
│     ├─ User Profile Setup
│     ├─ Notification Permissions
│     └─ App Tour
│
├─ Main App (/app)
│  │
│  ├─ Dashboard (/app/dashboard)
│  │  ├─ My Pets Section
│  │  │  ├─ Pet Cards
│  │  │  ├─ New Pet Button
│  │  │  └─ Pet Actions
│  │  │
│  │  └─ Today's Schedule
│  │
│  ├─ Pet Management
│  │  │
│  │  ├─ Add Pet (/app/pets/new)
│  │  │  ├─ Upload Photo
│  │  │  ├─ Basic Info
│  │  │  ├─ Physical Details
│  │  │  └─ Additional Info
│  │  │
│  │  ├─ Pet Detail (/app/pets/:id)
│  │  │  ├─ Pet Profile
│  │  │  ├─ Edit Profile
│  │  │  ├─ AI Assistant
│  │  │  ├─ Food Section
│  │  │  ├─ Health Section
│  │  │  ├─ Expenses Section
│  │  │  └─ Today's Schedule
│  │  │
│  │  ├─ Food Management (/app/pets/:id/food)
│  │  │  ├─ Today's Menu
│  │  │  ├─ Change Menu
│  │  │  ├─ Meal Graph
│  │  │  ├─ Food Statistics
│  │  │  └─ Meal History
│  │  │
│  │  ├─ Health Management (/app/pets/:id/health)
│  │  │  ├─ Health Overview
│  │  │  ├─ Weight Tracking
│  │  │  ├─ Health Clinic Ledger
│  │  │  ├─ Add Vaccination
│  │  │  ├─ Add Vet Visit
│  │  │  └─ Add Medication
│  │  │
│  │  └─ Expense Tracking (/app/pets/:id/expenses)
│  │     ├─ Expense Categories
│  │     ├─ Add Expense
│  │     ├─ Receipt Management
│  │     └─ Expense Reports
│  │
│  ├─ User Account
│  │  │
│  │  ├─ Profile (/app/profile)
│  │  │  ├─ User Info
│  │  │  ├─ Achievements
│  │  │  ├─ Stats
│  │  │  └─ Quick Actions
│  │  │
│  │  └─ Settings (/app/settings)
│  │     ├─ Theme Settings
│  │     ├─ Account Settings
│  │     ├─ Privacy & Security
│  │     ├─ Notifications
│  │     ├─ App Preferences
│  │     └─ Data Management
│  │
│  ├─ Navigation Tabs
│  │  ├─ Home (Dashboard)
│  │  ├─ Notifications
│  │  ├─ Profile
│  │  ├─ Calendar
│  │  └─ Memories Gallery
│  │
│  ├─ Notifications (/app/notifications)
│  │  ├─ Notification List
│  │  ├─ Notification Detail
│  │  └─ Mark as Read
│  │
│  ├─ Calendar (/app/calendar)
│  │  ├─ Monthly View
│  │  ├─ Day Details
│  │  ├─ Create Event
│  │  └─ Filter Events
│  │
│  └─ Memory Gallery (/app/memories)
│     ├─ Photo Grid
│     ├─ Pet Filter
│     ├─ Photo Viewer
│     └─ Add Memory (caption, mood, tags)
│
├─ Emergency (/app/emergency)
│  ├─ Preferred Vet Card (name, clinic, phone, address)
│  ├─ One-Tap Call (tel: link)
│  └─ Add / Edit / Delete Vet
│
└─ Legal
   ├─ Privacy (/privacy)
   └─ Terms (/terms)
```

---

*Document Version: 2.0 — reconciled with the shipped build*  
*Last Updated: July 2026*  
*Status: Reflects the current Next.js 16 PWA. Email/password auth only (no Google OAuth); emergency = preferred-vet one-tap call.*

**This document provides the complete system flow, user journeys, and application architecture for Pawzo. Use this as the reference for feature development and team coordination.**
