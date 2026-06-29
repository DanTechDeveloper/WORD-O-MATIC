# Architecture

## Backend

- Controllers remain thin.
- Validation uses Form Requests.
- Authorization uses Policies.
- Business logic belongs in Services when reused.
- Notifications use Laravel Notifications.

## Frontend

- Pages live in resources/js/Pages
- Shared UI lives in Components
- Layouts wrap pages
- Hooks contain reusable logic

## Data Flow

Teacher
↓
Controller
↓
Service
↓
Models
↓
Database

## Principles

Reuse existing code.

Prefer Laravel conventions.

Avoid duplicate business logic.