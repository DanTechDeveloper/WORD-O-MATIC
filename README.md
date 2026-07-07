# Word-O-Matic

A gamified literacy platform designed to improve students' reading and speaking skills through interactive mini-games.

Students learn through:

- **Word Blast** – Reading-focused word recognition game
- **Story Quest** – Speaking-focused storytelling activity

The platform uses a sci-fi themed interface to increase engagement while giving teachers tools to monitor student progress, assign learning modules, and analyze performance.

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Backend | PHP 8.3, Laravel 13, Laravel Sanctum |
| Frontend | React 18, Inertia.js v2, Tailwind CSS v3 |
| Database | MySQL (Production), SQLite `:memory:` (Testing) |
| Charts | Recharts (PieChart, BarChart) |
| Icons | Material Symbols |

---

# Setup

Install all dependencies and prepare the application:

```bash
composer run setup
```

This command performs the following:

1. Installs Composer dependencies
2. Creates the `.env` file
3. Generates the application key
4. Runs database migrations
5. Installs NPM packages
6. Builds frontend assets

---

# Development

Run the complete local development environment:

```bash
composer run dev
```

This starts:

- Laravel development server
- Queue worker
- Log watcher
- Vite development server

All services run concurrently.

---

# Testing

Run the automated test suite:

```bash
composer run test
```

or

```bash
php artisan test
```

Tests use an in-memory SQLite database, so no external database configuration is required.

---

# Seed Database

Populate the application with demo data:

```bash
php artisan migrate:fresh --seed
```

This creates:

- **1 Teacher Account**
  - Username: `admin`
  - Password: `password`

- **100 Student Accounts**
  - Distributed across three sectors
  - Randomized progress
  - Various completion statuses
  - Sample gameplay history

---

# Architecture

## Models

The application contains **16 Eloquent models**, including:

- User
- StudentProfile
- WordModule
- ParagraphModule
- Word
- ParagraphWord
- Progress models
- Mastery models
- Badge
- GameSession
- Setting

---

## Core Services

### ProgressService

Responsible for:

- Saving gameplay results
- Recording only the student's **highest score**
- Updating progress
- Maintaining denormalized statistics
- Computing accuracy and level information

### BadgeService

Handles:

- Badge eligibility
- Badge assignment
- Achievement progression

### LevelService

Responsible for:

- Student progression
- Module unlocking
- Level gating

### DashboardService

Provides teacher dashboard analytics including:

- Student statistics
- Progress summaries
- Chart data
- Performance metrics

---

# Routing

### Guest

- `/`
- `/teacher/login`

### Teacher

All teacher functionality is available under:

```
/teacher/*
```

Including:

- Dashboard
- Student Management
- Reports
- Module Management

### Student

All student functionality is available under:

```
/student/*
```

Including:

- Onboarding
- Dashboard
- Gameplay
- Leaderboards
- Progress Tracking

---

# Student Onboarding

Students are required to complete avatar selection before accessing the platform.

This is enforced through the:

```
CheckStudentOnboarding
```

middleware.

---

# Global Data Sharing

The application uses:

```
HandleInertiaRequests::share()
```

to expose global frontend data, including:

- Authenticated user
- Flash messages
- Teacher context

---

# Database Design

Foreign key relationships use cascading deletes.

Deleting a user automatically removes related records, including:

- Student profiles
- Game sessions
- Progress
- Mastery
- Badges

---

# Project Structure

```text
app/
├── Http/
│   └── Controllers/
│       ├── TeacherController.php
│       ├── StudentController.php
│       └── UserController.php
│
├── Services/
│   ├── ProgressService.php
│   ├── DashboardService.php
│   ├── BadgeService.php
│   └── LevelService.php
│
├── Middleware/
│   ├── HandleInertiaRequests.php
│   ├── EnsureUserRole.php
│   └── CheckStudentOnboarding.php
│
└── Models/
    └── 16 Eloquent models

database/
├── migrations/
└── seeders/
    └── DatabaseSeeder.php

resources/
└── js/
    ├── Pages/
    │   ├── Teacher/
    │   └── Student/
    │
    ├── Layouts/
    ├── Components/
    └── hooks/
        └── Student/
```

---

# Key Features

## Teacher

- Student management
- Module assignment
- Progress monitoring
- Performance reports
- Dashboard analytics
- Leaderboards
- Student detail pages

## Student

- Avatar onboarding
- Word Blast gameplay
- Story Quest gameplay
- Progress tracking
- Leaderboards
- Achievement badges

---

# Highlights

- Laravel 13 + React 18 + Inertia.js architecture
- Best-score-only progress tracking
- Gamified literacy activities
- Teacher analytics dashboard
- Achievement and badge system
- Level progression system
- Responsive Tailwind CSS interface
- SQLite in-memory testing
- Seeded demo environment
- Cascading database relationships
