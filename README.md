# Pasok — Advisory Attendance Helper

Pasok is a phone-first classroom helper for one senior high school advisory class (16+). The classroom secretary records daily absences, day types, and notes; the advisory teacher confirms (locks) the record; and parents can view their child's attendance through a private personal link with no login required.

> **Unofficial classroom tool:** Pasok is not an official school attendance record. Development, tests, and demos use fake student data only.

## Project Documentation (`pbi-docs/`)

- [PBI-20261122-pasok-advisory-attendance.md](./pbi-docs/PBI-20261122-pasok-advisory-attendance.md) — Project overview, version 1 scope, acceptance criteria, database schema, and design grill decisions.
- [PBI-20261122-review.md](./pbi-docs/PBI-20261122-review.md) — Architectural review and phased build plan (Phases 0–7).
- [PBI-20261122-questions-school.md](./pbi-docs/PBI-20261122-questions-school.md) — Open questions for the school / data protection officer.

## Stack

- **Frontend & Server:** Next.js (App Router), TypeScript, Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL, Google OAuth, Row-Level Security, `pg_cron`)
- **Language:** Bilingual UI — Filipino (`fil`, default) and English (`en`), persisted in a cookie (`pasok_lang`)
- **Time Zone:** `Asia/Manila` (`UTC+8`) across all dates, day checks, and exports
