# 🔍 SYSTEM PROMPT: TRAVELOOP CODEBASE AUDIT, GAP ANALYSIS & COMPLETION

**Target AI Engineer:** Antigravity  
**Project State:** Partially Built / Existing Codebase  
**Core Objective:** Audit the existing **Traveloop** codebase against this master specification, identify every missing or incomplete feature across all 14 required screens, and implement 100% of the missing functionality so the project is completely finished.

---

## ⚠️ CRITICAL OPERATING RULES FOR ANTIGRAVITY (READ FIRST)

1. **DO NOT REBUILD FROM SCRATCH:** A working project already exists in this workspace. Preserve the existing tech stack, folder structure, styling conventions, and working features.
2. **STOP AND ASK THE USER WHEN NEEDED:** Before writing code or if you encounter ambiguity during implementation, **ask the user** if you need:
   * Environment variables (`.env`), database connection strings, or API keys.
   * SQL dump files, existing schema definitions, or migration files not visible in the workspace.
   * Clarification on whether a specific mock/UI component should replace an existing screen or integrate into it.
   * Permission before running destructive database migrations.
3. **MANDATORY 3-STEP EXECUTION WORKFLOW:**
   * **Phase 1 — Codebase Audit & Gap Report:** Scan the entire existing repository (frontend routes, components, backend controllers/routes, and relational database tables). Output a clear checklist showing what is `[COMPLETE]`, `[PARTIAL / STUBBED]`, and `[MISSING]` against the 14 modules below.
   * **Phase 2 — Clarifying Questions:** Ask the user for any missing files, credentials, or architectural preferences you need.
   * **Phase 3 — Full Implementation:** Systematically fix every broken endpoint, wire up all hardcoded/mocked UI elements to the real relational database, and build every missing screen and feature until 0 gaps remain.
4. **ZERO PLACEHOLDERS:** Every single one of the 14 screens (including Screen 14: Admin / Analytics Dashboard) is **mandatory**. Replace any dummy data, `// TODO` comments, or dead buttons with full end-to-end functionality.

---

## 1. Project Context & Core Requirements

### 1.1 Overall Vision
The overarching vision for **Traveloop** is to become a personalized, intelligent, and collaborative platform that transforms the way individuals plan and experience travel. The platform empowers users to dream, design, and organize trips with ease by offering an end-to-end travel planning tool that combines flexibility and interactivity. Users can explore global destinations, visualize their journeys through structured itineraries, make cost-effective decisions, and share their travel plans within a community.

### 1.2 Mission & Core Capabilities
Verify that the existing application seamlessly allows users to:
* [ ] Add and manage travel stops and durations
* [ ] Explore cities and activities of interest
* [ ] Estimate trip budgets automatically
* [ ] Visualize timelines and plans
* [ ] Share trip plans with others

### 1.3 Problem Statement & Architectural Mandate
The application **must demonstrate proper use of a relational database** to store and retrieve complex travel data such as user-specific itineraries, stops, activities, and estimated expenses. The system must also support dynamic user interfaces that adapt to each user's trip flow.
* **Reference Mockup URL:** `https://link.excalidraw.com/l/65VNwvy7c4X/22030WE3bE4`

---

## 2. Relational Database Audit Checklist

Inspect the existing database schema/models. Do not break existing column names if they already work, but **add any missing tables, columns, or foreign keys** required to support all 14 screens:

1. **Users Table (`users`)**
   * Needs: `id`, `name`, `email`, `password_hash`, `photo_url`, `language_preference`, `role` (`'user'` / `'admin'`), `created_at`.
2. **Cities Catalog Table (`cities`)**
   * Needs: `id`, `name`, `country`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`.
3. **Saved Destinations Table (`saved_destinations`)**
   * Needs: `id`, `user_id` (FK -> `users`), `city_id` (FK -> `cities`).
4. **Activities Catalog Table (`activities` / `activities_catalog`)**
   * Needs: `id`, `city_id` (FK -> `cities`), `name`, `category` (Sightseeing, Food Tours, Adventure, etc.), `estimated_cost`, `duration_hours`, `description`, `image_url`.
5. **Trips Table (`trips`)**
   * Needs: `id`, `user_id` (FK -> `users`), `name`, `start_date`, `end_date`, `description`, `cover_photo_url`, `total_budget_limit`, `daily_budget_threshold`, `is_public`, `share_slug`, `created_at`.
6. **Trip Stops Table (`trip_stops`)**
   * Needs: `id`, `trip_id` (FK -> `trips`), `city_id` (FK -> `cities`), `stop_order` (Int for reordering cities), `arrival_date`, `departure_date`.
7. **Scheduled Stop Activities Table (`stop_activities`)**
   * Needs: `id`, `trip_stop_id` (FK -> `trip_stops`), `activity_id` (FK -> `activities`, nullable for custom entries), `custom_title`, `scheduled_date`, `scheduled_time`, `duration_hours`, `cost`, `category`.
8. **Trip Expenses Table (`trip_expenses`)**
   * Needs: `id`, `trip_id` (FK -> `trips`), `trip_stop_id` (FK, nullable), `category` (`'Transport'`, `'Stay'`, `'Activities'`, `'Meals'`), `amount`, `expense_date`, `notes`.
9. **Packing Checklist Table (`packing_items`)**
   * Needs: `id`, `trip_id` (FK -> `trips`), `item_name`, `category` (`'Clothing'`, `'Documents'`, `'Electronics'`, `'Toiletries'`, `'Miscellaneous'`), `is_packed` (Boolean).
10. **Trip Notes / Journal Table (`trip_notes`)**
    * Needs: `id`, `trip_id` (FK -> `trips`), `trip_stop_id` (FK, nullable), `note_date` (nullable), `title`, `content`, `created_at`, `updated_at`.

---

## 3. Feature-by-Feature Gap Audit (All 14 Required Screens)

Audit every screen below in the current codebase. If a screen is missing, create it. If a screen exists but is missing sub-components, filters, or backend persistence, complete it.

### 1. Login / Signup Screen
* **Description:** Entry point of the app allowing users to create or access their account.
* **Purpose:** Authenticate users to manage personal travel plans.
* **Audit & Complete These Components:**
  * [ ] Email & password fields with basic validation (email format, password length, clear error states).
  * [ ] Working Login button connected to backend authentication.
  * [ ] Working Signup link / registration form that persists new users in the database.
  * [ ] "Forgot Password" flow (modal or screen to initiate password reset).

### 2. Dashboard / Home Screen
* **Description:** Central hub showing upcoming trips, popular cities, and quick actions.
* **Purpose:** Allows users to navigate to their trips and explore inspiration.
* **Audit & Complete These Components:**
  * [ ] Personalized welcome message showing the logged-in user's name.
  * [ ] Dynamic list of recent / upcoming trips fetched from the database (not hardcoded).
  * [ ] "Plan New Trip" button routing directly to the Create Trip Screen.
  * [ ] Recommended destinations section displaying popular cities with metadata.
  * [ ] Budget highlights widget summarizing trip costs and budget status.

### 3. Create Trip Screen
* **Description:** Form to initiate a new trip by providing a name, travel dates, and a description.
* **Purpose:** Begins the process of creating a personalized travel plan.
* **Audit & Complete These Components:**
  * [ ] Trip name input field.
  * [ ] Start & end date pickers (with validation ensuring end date is not before start date).
  * [ ] Trip description textarea.
  * [ ] Optional cover photo upload (or image URL / preset cover picker).
  * [ ] Save button that writes to the relational database and redirects to the Itinerary Builder.

### 4. My Trips (Trip List) Screen
* **Description:** List view of all trips created by the user with basic summary data.
* **Purpose:** Easily access and manage existing or upcoming trips.
* **Audit & Complete These Components:**
  * [ ] Trip cards displaying trip name, date range, and destination (stop) count.
  * [ ] Working **View** action (opens Itinerary View Screen).
  * [ ] Working **Edit** action (opens Itinerary Builder / Trip Edit).
  * [ ] Working **Delete** action (removes trip from database with confirmation).

### 5. Itinerary Builder Screen
* **Description:** Interface to add cities, dates, and activities for each stop.
* **Purpose:** Construct the full day-wise trip plan in an interactive format.
* **Audit & Complete These Components:**
  * [ ] "Add Stop" button to append a city to the trip.
  * [ ] Select city and assign travel dates (arrival & departure) for each stop.
  * [ ] Assign activities to each stop (with time, duration, and cost).
  * [ ] Reorder cities functionality (drag-and-drop or up/down buttons that persist `stop_order` in the database).

### 6. Itinerary View Screen
* **Description:** Visual representation of the completed trip itinerary.
* **Purpose:** Review the full plan in a structured format (timeline or grouped by cities).
* **Audit & Complete These Components:**
  * [ ] Structured day-wise layout (Day 1, Day 2, etc.).
  * [ ] Clear city headers for each stop/section.
  * [ ] Activity blocks displaying scheduled time and estimated cost.
  * [ ] Working view mode toggle switching between **Calendar View** and **List / Timeline View** (and/or grouped by cities).

### 7. City Search
* **Description:** Search interface to find and add cities to a trip, with info like country, cost index, and popularity.
* **Purpose:** Discover and include relevant cities in the itinerary.
* **Audit & Complete These Components:**
  * [ ] Real-time search bar by city name or keyword.
  * [ ] List of cities displaying metadata: **Country**, **Cost Index**, and **Popularity**.
  * [ ] Filter by **Country / Region**.
  * [ ] Working **"Add to Trip"** button (lets the user pick one of their trips and adds the city as a stop).
  * [ ] Ability to bookmark/save a city to the user's `saved_destinations` list.

### 8. Activity Search
* **Description:** Browse and select things to do in each stop, categorized by interest or cost.
* **Purpose:** Enrich trips with experiences like sightseeing, food tours, or adventure activities.
* **Audit & Complete These Components:**
  * [ ] Activity filters by **Type/Category** (sightseeing, food tours, adventure, etc.), **Cost**, and **Duration**.
  * [ ] Working **Add / Remove** buttons to attach or detach the activity from a trip stop.
  * [ ] **Quick View** modal/drawer displaying full activity description and images.

### 9. Trip Budget & Cost Breakdown Screen
* **Description:** Summarized financial view showing estimated total cost and breakdowns.
* **Purpose:** Helps travelers stay informed and within budget.
* **Audit & Complete These Components:**
  * [ ] Cost breakdown categorized strictly by: **Transport**, **Stay**, **Activities**, and **Meals** (plus ability to log/edit Transport, Stay, and Meal expenses if missing).
  * [ ] Visual **Pie Chart** and **Bar Chart** rendering real trip financial data.
  * [ ] Automatic calculation and display of **Average Cost Per Day** ($\text{Total Cost} \div \text{Total Days}$).
  * [ ] Visual **Alerts for Over-Budget Days** (triggers when a specific day's expenses + activities exceed the daily threshold or total budget).

### 10. Packing Checklist Screen
* **Description:** A per-trip checklist where users can add, check off, and manage items they need to pack for their journey.
* **Purpose:** Helps travelers stay organized and ensure nothing essential is forgotten before or during the trip.
* **Audit & Complete These Components:**
  * [ ] Add and remove checklist items tied to a specific trip.
  * [ ] Mark items as packed/unpacked (persisted in database).
  * [ ] Categorize items by type (**Clothing**, **Documents**, **Electronics**, etc.).
  * [ ] **"Reset Checklist"** button to uncheck all items for reuse.

### 11. Shared / Public Itinerary View Screen
* **Description:** Public page displaying a sharable version of an itinerary.
* **Purpose:** Allows others to view, get inspired, or copy the trip.
* **Audit & Complete These Components:**
  * [ ] Unique public URL route (e.g., `/share/:slug` or `/public/trip/:id`) accessible in read-only mode.
  * [ ] Complete itinerary summary (stops, day-wise activities, and cost overview) with all edit controls hidden.
  * [ ] Working **"Copy Trip" button** that duplicates the shared trip's stops and activities into the logged-in user's account.
  * [ ] Social media sharing buttons (Copy Link, WhatsApp, X/Twitter, etc.).

### 12. User Profile / Settings Screen
* **Description:** User settings page to update profile information and preferences.
* **Purpose:** Enables users to control their data, preferences, and privacy.
* **Audit & Complete These Components:**
  * [ ] Editable profile fields: **Name**, **Photo**, and **Email** connected to a backend update endpoint.
  * [ ] **Language preference** selector persisted to the user profile.
  * [ ] **Saved Destinations List** displaying cities the user bookmarked, with option to remove or start a trip.
  * [ ] **Delete Account** button with confirmation modal that deletes the user and cascades their data.

### 13. Trip Notes / Journal Screen
* **Description:** A simple text note-taking screen where users can write and save notes or reminders tied to a specific trip or day.
* **Purpose:** Lets travelers jot down important details such as hotel check-in info, local contacts, or day-specific reminders without leaving the app.
* **Audit & Complete These Components:**
  * [ ] Add, edit, and delete notes tied to a **specific trip** or **specific stop/day**.
  * [ ] Clear **timestamp display** on each note.
  * [ ] Notes list view **sorted by date**.

### 14. Admin / Analytics Dashboard
* **Description:** Admin-only interface to track user trends, trip data, and platform usage.
* **Purpose:** Helps in monitoring app adoption, popular cities, and user behavior.
* **Audit & Complete These Components:**
  * [ ] Tables and charts of **Trips Created**.
  * [ ] Analytics showing **Top Cities** and **Top Activities**.
  * [ ] **User Engagement Stats** (total users, active planners, public vs. private trips, average budgets).
  * [ ] **User Management Tools** (view registered users, change roles, or delete/suspend accounts).

---

## 4. Database Seeding & Verification

If the database currently lacks sufficient seed data to demonstrate all 14 features (such as City Search, Activity Search, Over-Budget Day Alerts, or Admin Analytics charts), create or update the database seed script so that:
1. `cities` has at least 10–12 global cities with country, region, cost index, popularity score, and images.
2. `activities` has at least 30+ activities distributed across those cities with categories, costs, and durations.
3. At least 1 complete multi-city sample trip exists with stops, scheduled activities, transport/stay/meal expenses (including an over-budget day), packing items, and journal notes.

---

## 5. Immediate First Action for Antigravity

**Start now by scanning the workspace.**  
Do not write implementation code until you first give me:
1. Your **Gap Analysis Report** (listing which of the 14 screens and database tables are currently complete, partial, or missing).
2. Any **questions or requests** for files, environment variables, or database credentials you need from me to proceed.