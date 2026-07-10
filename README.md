<div align="center">

# 🚀 Word-O-Matic

### A gamified literacy platform that boosts students' **reading** and **speaking** skills through interactive mini-games.

<br>

<img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
<img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/Inertia.js-2-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />

<br><br>

<table>
<tr>
<td align="center" width="50%">
<h3>⚡ Word Blast</h3>
Reading-focused word recognition game
</td>
<td align="center" width="50%">
<h3>📖 Story Quest</h3>
Speaking-focused storytelling activity
</td>
</tr>
</table>

<sub>A sci-fi themed interface increases engagement, while teachers get tools to monitor progress, assign modules, and analyze performance.</sub>

</div>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **Backend** | PHP 8.3, Laravel 13, Laravel Sanctum |
| **Frontend** | React 18, Inertia.js v2, Tailwind CSS v3 |
| **Database** | MySQL (Production), SQLite `:memory:` (Testing) |
| **Charts** | Recharts (PieChart, BarChart) |
| **Icons** | Material Symbols |

</div>

---

## ⚙️ Setup

Install all dependencies and prepare the application:

```bash
composer run setup
```

<details>
<summary><b>What this command does</b></summary>

<br>

1. Installs Composer dependencies
2. Creates the `.env` file
3. Generates the application key
4. Runs database migrations
5. Installs NPM packages
6. Builds frontend assets

</details>

---

## 💻 Development

Run the complete local development environment:

```bash
composer run dev
```

<details>
<summary><b>Services started (all run concurrently)</b></summary>

<br>

- Laravel development server
- Queue worker
- Log watcher
- Vite development server

</details>

---

## 🧪 Testing

Run the automated test suite:

```bash
composer run test   # or: php artisan test
```

> Tests use an in-memory SQLite database — no external database configuration required.

---

## 🌱 Seed Database

Populate the application with demo data:

```bash
php artisan migrate:fresh --seed
```

<div align="center">

| Account | Details |
|:--------|:--------|
| 👩‍🏫 **1 Teacher** | Username `admin` · Password `password` |
| 🎓 **100 Students** | 3 sectors · randomized progress · varied statuses · sample gameplay history |

</div>

---

## 🏗️ Architecture

### Models

The application contains **16 Eloquent models**, including:

`User` · `StudentProfile` · `WordModule` · `ParagraphModule` · `Word` · `ParagraphWord` · Progress models · Mastery models · `Badges` · `GameSession` · `Setting`

### Core Services

<table>
<tr>
<td width="33%" valign="top">

**🎯 ProgressService**

- Saving gameplay results
- Recording the **highest score** only
- Updating progress
- Denormalized statistics
- Accuracy & level computation

</td>
<td width="33%" valign="top">

**🏅 BadgeService**

- Badge eligibility
- Badge assignment
- Achievement progression

</td>
<td width="33%" valign="top">

**📈 LevelService**

- Student progression
- Module unlocking
- Level gating

</td>
</tr>
</table>

---

## 🗺️ Routing

<div align="center">

| Role | Prefix | Includes |
|:-----|:-------|:---------|
| **Guest** | `/`, `/teacher/login` | Landing, login |
| **Teacher** | `/teacher/*` | Dashboard · Student Management · Reports · Module Management |
| **Student** | `/student/*` | Onboarding · Dashboard · Gameplay · Leaderboards · Progress Tracking |

</div>

---

## 🔒 Key Behaviors

<details>
<summary><b>Student Onboarding</b></summary>

<br>

Students must complete avatar selection before accessing the platform. Enforced via the `CheckStudentOnboarding` middleware.

</details>

<details>
<summary><b>Global Data Sharing</b></summary>

<br>

`HandleInertiaRequests::share()` exposes global frontend data: authenticated user, flash messages, and teacher context.

</details>

<details>
<summary><b>Database Design</b></summary>

<br>

Foreign keys use **cascading deletes**. Deleting a user automatically removes student profiles, game sessions, progress, mastery, and badges.

</details>

---

## 📁 Project Structure

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── TeacherController.php
│   │   ├── StudentController.php
│   │   └── UserController.php
│   └── Middleware/
│       ├── HandleInertiaRequests.php
│       ├── EnsureUserRole.php
│       └── CheckStudentOnboarding.php
│
├── Services/
│   ├── ProgressService.php
│   ├── BadgeService.php
│   └── LevelService.php
│
└── Models/            # 16 Eloquent models

database/
├── migrations/
└── seeders/
    └── DatabaseSeeder.php

resources/
└── js/
    ├── Pages/         # Teacher/ · Student/
    ├── Layouts/
    ├── Components/
    └── hooks/
```

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 👩‍🏫 Teacher

- Student management
- Module assignment
- Progress monitoring
- Performance reports
- Parent report emails (Gmail SMTP + deadline gating)
- Dashboard analytics
- Leaderboards
- Student detail pages

</td>
<td width="50%" valign="top">

### 🎓 Student

- Avatar onboarding
- Word Blast gameplay
- Story Quest gameplay
- Progress tracking
- Leaderboards
- Achievement badges

</td>
</tr>
</table>

---

<div align="center">

### 🌟 Highlights

Laravel 13 + React 18 + Inertia.js &nbsp;•&nbsp; Best-score-only tracking &nbsp;•&nbsp; Gamified literacy &nbsp;•&nbsp; Teacher analytics &nbsp;•&nbsp; Badge & level system &nbsp;•&nbsp; Parent report emails &nbsp;•&nbsp; Responsive Tailwind UI &nbsp;•&nbsp; In-memory SQLite testing &nbsp;•&nbsp; Seeded demo environment

<br>

<sub>Built with ❤️ as a capstone project</sub>

</div>
