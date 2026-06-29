# Database

## Core Models

User

StudentProfile

WordModule

ParagraphModule

GameSession

Badge

## Relationships

Student → Attempts

Student → Badges

Module → Words

Paragraph → ParagraphWords

## Important Rules

Teacher dashboards read denormalized student fields.

Progress tables remain the source of detailed history.