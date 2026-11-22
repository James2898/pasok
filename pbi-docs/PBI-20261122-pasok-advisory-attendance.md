# PBI-20261122 — Pasok: Advisory Attendance

- **Saved:** 2026-11-22
- **Source:** Pasted PBI text (Pasok_Advisory_Attendance_Project_Overview.md, v0.3)

---

## PBI (verbatim)

# Pasok: Advisory Attendance Project Overview

*Living draft, version 0.3, November 22, 2026. Written to be handed to a coding agent for review and planning.*

## Instructions for the coding agent

This document is the single source of truth for the project. Your first job is to review it and prepare a plan, not to write code.

1. Read the whole document. Treat everything in it as a deliberate decision unless it appears under Open questions. The Decisions and reasons section at the end explains why.
2. List the contradictions, gaps, risks and unknowns you find, and ask the person to settle the ones that block planning.
3. Challenge the preferred stack only for a concrete reason (for example hosting limits) and say what you would use instead.
4. Propose a phased build plan: the milestones, the order of work, and how each milestone is tested against the acceptance criteria.
5. Do not start implementing until the plan is approved.
6. Use fake students only, in development, tests and demos. Never real student data.

## Problem

An advisory teacher is sometimes unable to hold their own advisory class, so they do not know who is absent. When parents contact the teacher about their child’s attendance, the teacher has no answer. This tool closes that gap: the classroom secretary records attendance, the teacher confirms it, and parents can check it themselves.

## What it is, and what it is not

- A classroom helper tool for one advisory class of senior high school students (16 and above).
- Not an official record. The school already has an official attendance checker, but it is clunky, has a complicated login, and an outdated interface. The teacher transcribes the data into it afterward; this tool only lessens the friction.
- The secretary records who is absent on a given day, with a preset reason and a short note, and can set the day type and the day note. Nothing else.

## Roles

- **Teacher:** confirms (locks) days, edits locked days, reopens a day, sets day types, manages the class list, adds secretaries by Google email, regenerates student links, runs exports, reads the activity log. Signs in with Google.
- **Secretary:** a student chosen by the teacher; a class can have several. Signs in with Google (personal account). Marks absences with a reason and a short note, sets the day type and note, and submits each day. Can fix entries until the teacher locks the day.
- **Parent or guest:** no account. Opens the personal link the teacher sent and sees that child’s attendance. View only. Sees the day type, and the reason and note for any absence of that child.
- **System admin:** adds teachers by Google email (in version 1 through a script or a database entry, since there is no admin screen) and has no screen to browse student data. Can read the activity log. Currently the only sysadmin is the developer.

## Core flow: day types and states

Every school day has a type (what kind of day it was) and a state (where its attendance stands).

**Day types**

| Type | Attendance taken | Notes |
| --- | --- | --- |
| Whole day | Yes | The default |
| Early dismissal | Yes | Class is held; attendance is still for the whole day |
| Half day | Yes | Morning or afternoon only; attendance is still for the whole day |
| Suspended: weather | No | Typhoon, flood and similar |
| Suspended: other | No | Any other suspension |
| Holiday | No | Pre-filled from the class holiday list; the teacher can change it |
| School event or activity | No | Assembly, foundation day and similar |
| Other no-class day | No | Add a note saying why |

**States**

1. **Not recorded.** The default. A new day opens with everyone set to present, but it does not count as recorded until someone submits it.
2. **Submitted.** The secretary (or a teacher) has submitted the day, including the case where nobody is absent. Parents see it labeled as unconfirmed.
3. **Locked.** The teacher confirmed it. Only teachers can edit it from here, and a reopen is logged.

Rules:

- School days are Monday to Friday only in version 1. Weekends show greyed out on the parent’s month view, and a school day with no record shows “Not yet recorded.” Saturday make-up classes come later.
- Parents never see a day as plain “present” unless someone actually submitted it.
- Absence marks (who is absent, with reasons and notes) stay hidden from parents until the secretary or teacher presses Submit. Once submitted, parents see them right away, labeled as unconfirmed until the teacher locks the day.
- A day’s type and note show to parents right away, marked unconfirmed until the teacher locks the day, so a same-morning suspension is visible quickly.
- If a week has unlocked days, the site shows a “week not yet confirmed” prompt.
- Locking freezes everything on the day: the type, the note and the attendance.
- Until the lock, the secretary can change the day type, the notes and the attendance, including for past days. Every change is logged.
- Days that take no attendance can’t be submitted, but they can be locked.
- Every day can carry one optional note (up to 150 characters) that parents see.
- If two people edit the same day at once, the last save wins, and both changes appear in the activity log.

## Parent access

- Each student has a personal link, a long random address that opens only that child’s page. There is nothing to type and no login.
- The teacher sends the link to the parent by personal message on Facebook Messenger and can pin it in the chat. Keeping the link private is the parent’s or guardian’s responsibility.
- The parent sees that child’s month: the day type, the attendance state, and for absences the reason and note, all marked unconfirmed until the teacher locks the day.
- The link is stored hashed, so the teacher sees it only once, right after import or regeneration. If a link is lost or leaks, the teacher regenerates it and the old link stops working.
- A deactivated student’s link stops working immediately.
- The page title is generic, so Messenger link previews never show the child’s name. The page loads nothing from other sites and sends no referrer.
- The parent page carries a short line such as “Wrong entry? Message your adviser.” There is no in-app error reporting in version 1.

## Language

- The whole app is bilingual: Filipino by default, with a switch to English. The choice is saved in the browser’s local storage on each device.
- Every piece of interface text exists in both languages: buttons, day types, absence reasons, states, the parent banner and privacy notice, and the Messenger message template. Text that people type, such as notes, is not translated.
- Dates follow the Philippine format and time zone.
- The Filipino wording must be reviewed by a native speaker before real use. A first draft of the parent notice is in this document.

## Teacher features

- Dashboard of days by state, with lock, reopen, and edit.
- Set day types (suspended, holiday, early dismissal and so on) and edit the class’s own copy of the holiday list.
- Class list: CSV import that is all-or-nothing: a preview report lists every row as fine or as an error with the reason, and nothing is saved if any row has an error. Duplicates (the same last name, first name and middle initial as an existing active student, or twice in the file) are errors. Importing never overwrites or deletes anything; to add a student later, upload a file with only the new student, plus a downloadable template. The template comes with a ready-made prompt so the teacher can give it to the school AI with the student names.
- Add or deactivate secretaries by their Google email.
- Copy each student’s personal link (with a ready-made message to send on Messenger), regenerate a link, and deactivate students (soft delete; they can be restored).
- Exports and activity log (below).

## Preset absence reasons

Sick, Family matter, Excused (parent informed teacher), School activity, Reason not stated (default). A short note (up to 150 characters) can be added by the secretary or teacher. Everyone who can see that absence, including the parent, sees the note, and a hint under the field says to keep it short and factual.

## Exports

CSV, PDF, and DOCX of attendance by month, filtered to one student or all students. Each row carries its status so pending days are labeled. The input format of the official school system is unknown, so exports stay generic for now.

## Activity log

Visible to the teacher and the sysadmin only; append-only. Each entry records who acted (teacher or secretary), their role, the action, the target, the before and after values for edits, IP address, device, and time. It also covers link regenerations, locks and reopens, and imports. Each entry stores a snapshot of the actor’s email, name and role, so it survives deleting the user. It holds student ids, never student names, and entries about one student are removed if that student is truly deleted. Kept until the class is deleted, 30 days after it is archived.

## Security and privacy

Version 1 (demo):

- Personal links: a long random token per student, stored hashed. The link, the page title and link previews never contain a student’s name.
- Row-level security on, with the service key used only on the server. The browser never reads the students table directly; parent and staff requests go through server endpoints.
- All student reads and writes go through one data-access module, so encryption can be added later in one place.
- Random UUIDs for student IDs, with names in their own columns.
- No student names in logs or error output.
- The demo uses a made-up class only. Real rosters are loaded only after encryption is in place, or at least after the school’s go-ahead and a privacy notice.

Later:

- Field-level encryption of student names and teacher notes (AES-256-GCM, key kept as a server secret outside the database, version prefix on stored values).
- Honest framing to the school: no screen exists to browse students and the data is encrypted in the database, but whoever controls the server could technically decrypt it.
- Ask the school about a data protection officer under the Philippines’ Data Privacy Act, and confirm with them.

## Parent page notice (draft, English and Filipino)

Draft text with placeholders in brackets. The school or its data protection officer should review it before any real students are added.

**Banner at the top of the page**

> **Unofficial classroom tool.** This page is a helper for \[Teacher name\]’s advisory class. It is not the school’s official attendance record. Entries are recorded by the class secretary and may be unconfirmed until the teacher confirms them, so mistakes are possible. For corrections, message your adviser.

**Privacy notice (linked from the banner)**

- **What we store:** your child’s name, daily attendance, absence reasons and short notes, and day types such as suspensions. For teachers and secretaries: Google email, name, and a log of their changes with time, IP address and device.
- **Why:** so parents can see whether their child is in school, and so the adviser can answer questions.
- **Who sees it:** the adviser and the class secretary see the class record. Anyone with your child’s personal link sees that child’s record only, so please keep the link private and do not share it. The person who maintains this system can technically access stored data for maintenance and does not browse it.
- **What we don’t do:** sell your data, show ads, or share it with anyone outside the class. It is stored with our hosting providers only to run this tool.
- **How long:** one month after the school year ends, the class and all its records are permanently deleted.
- **Your choices:** ask your adviser at \[contact\] to correct or remove your child’s record, or to replace your link if it was lost or shared.

### Filipino version (first draft, needs native-speaker review)

> **Hindi opisyal na kasangkapan sa klase.** Ang pahinang ito ay pantulong para sa advisory class ni \[Pangalan ng guro\]. Hindi ito ang opisyal na talaan ng pagdalo ng paaralan. Ang class secretary ang nagtatala ng mga entry at maaaring hindi pa ito kumpirmado ng guro, kaya maaaring may pagkakamali. Para sa pagwawasto, magmensahe sa inyong adviser.

- **Ano ang iniimbak:** ang pangalan ng inyong anak, araw-araw na pagdalo, mga dahilan ng pagliban at maikling tala, at mga uri ng araw tulad ng suspensyon. Para sa mga guro at secretary: Google email, pangalan, at talaan ng kanilang mga pagbabago kasama ang oras, IP address, at device.
- **Bakit:** upang makita ng mga magulang kung pumapasok ang kanilang anak, at upang masagot ng adviser ang mga tanong.
- **Sino ang nakakakita:** ang adviser at ang class secretary ang nakakakita ng talaan ng klase. Ang sinumang may personal na link ng inyong anak ay makakakita lamang ng talaan ng batang iyon, kaya pakiingatan ang link at huwag itong ibahagi. Ang taong nangangasiwa ng sistemang ito ay maaaring teknikal na makapasok sa nakaimbak na datos para sa maintenance, at hindi niya ito tinitingnan.
- **Ang hindi namin gagawin:** ibenta ang inyong datos, magpakita ng mga ad, o ibahagi ito sa sinuman sa labas ng klase. Nakaimbak ito sa aming mga hosting provider para lamang mapatakbo ang tool na ito.
- **Gaano katagal:** isang buwan matapos ang school year, permanenteng buburahin ang klase at lahat ng talaan nito.
- **Ang inyong mga pagpipilian:** makipag-ugnayan sa inyong adviser sa \[contact\] upang ipawasto o ipabura ang talaan ng inyong anak, o upang palitan ang inyong link kung ito ay nawala o naibahagi.

## Version 1 scope (teacher demo)

Included:

- Single teacher, Google login for the teacher and the secretary
- Class list via all-or-nothing CSV import with a preview report
- Personal link per student, sent on Messenger, and the parent view it opens
- Secretary daily sheet with preset reasons, short notes and day types
- Day types and states (not recorded, submitted, locked), plus the per-class holiday list, Monday to Friday
- Activity log
- CSV, PDF, and DOCX monthly export
- Filipino and English interface, Filipino by default

Not included:

- Email updates
- Encryption
- System admin panel
- Multiple classes, each with its own address (the structure already supports it)
- Parent error reporting
- Saturday make-up classes
- Custom roles or permissions

## Acceptance criteria for version 1

1. A teacher added by the sysadmin can sign in with Google. A Google account that was not invited gets no access.
2. The teacher can import a valid CSV class list. A file with any error saves nothing, and the report shows each row’s result and the reason for every error.
3. After an import, the teacher can copy each student’s personal link once. Regenerating a link stops the old link from working.
4. The teacher can add a secretary by Google email, and only that matching Google account can sign in as the secretary.
5. The secretary can open any unlocked school day, mark students absent with a preset reason and a note of up to 150 characters, and submit the day, including “no one absent.”
6. Until a day is submitted, parents see “Not yet recorded” and none of its absence marks.
7. A personal link opens only that student’s month view, with the day type, the state and, for absences, the reason and note, labeled unconfirmed until the day is locked.
8. The teacher can lock a day. After that the secretary cannot change anything on it, and the teacher can reopen it.
9. Suspended, holiday, school event and other no-class days take no attendance. Holidays are pre-filled from the class holiday list.
10. Every change appears in the activity log with the actor, role, action, before and after values, IP address and device. Entries cannot be edited, and the teacher can read the log.
11. Exports (CSV, PDF, DOCX) for one month, for one student or all, label unlocked days as unconfirmed.
12. A deactivated student’s link stops working and the student disappears from the secretary’s sheet.
13. Switching the language between Filipino and English changes all interface text and is remembered on that device.
14. An archived class is permanently deleted 30 days later, with its students, days and activity log.
15. No student name appears in a link, page title, link preview, server log or error report.
16. Every screen works on a phone-sized display.

## Demo script for the teacher

1. The sysadmin adds the teacher’s Google email to a fake class.
2. The teacher signs in with Google and sees an empty class.
3. The teacher imports a CSV of about ten fake students. The first file has a deliberate error, to show that nothing is saved. A fixed file then succeeds.
4. The teacher copies one student’s link and opens it in a private browser window: a month with nothing recorded yet.
5. The teacher adds a secretary by Google email, and the secretary signs in on a phone.
6. The secretary marks two students absent (with reasons and a note) and submits today. The parent link now shows the absences as unconfirmed.
7. The secretary sets another day to “Suspended: weather.” The parent link shows it right away.
8. The teacher locks the week. The unconfirmed labels disappear and the secretary can no longer edit those days.
9. The teacher reads the activity log, then exports the month as a PDF.
10. The teacher regenerates one student’s link, and the old link stops working.
11. The language is switched to English and back.

## Later versions

**Version 2: email updates**

- Weekly email to opted-in parents per child: no absences that week, or the absences with notes.
- Each subscriber picks weekly, monthly, or none.
- Subscribers sign up from their child’s personal link page, and the teacher approves each one.
- Strict rule: if the week is not locked, or nothing is confirmed, no email is sent.
- Open for later: correction emails when a locked day is edited after an email went out; unsubscribe link in every email.

**Version 2: encryption** as described above.

**Future: multiple teachers**

- Each teacher has their own class and URL, for example a subdomain per teacher (a separate domain per teacher is possible but costs more to run).
- Add a system admin panel for managing teachers only.
- Google login requires exact redirect addresses, so per-teacher domains need one central login address.
- Preparation now: put a class identifier on every table and resolve the class from the URL instead of hardcoding it.

## Draft database schema (version 1)

Each table below lists its columns with type, whether a value is required, and the limits that apply. Types are Postgres types. Every class-owned table carries a class\_id, so adding more teachers later does not change the structure.

### Fixed lists (enums)

| Enum | Values |
| --- | --- |
| `member_role` | `teacher`, `secretary` |
| `day_type` | `whole_day` (default), `early_dismissal`, `half_day`, `suspended_weather`, `suspended_other`, `holiday`, `school_event`, `other_no_class` |
| `day_state` | `not_recorded` (default), `submitted`, `locked` |
| `absence_reason` | `sick`, `family_matter`, `excused`, `school_activity`, `not_stated` (default) |

These lists are constant in version 1.

### `classes`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `name` | text | yes | 1–100 characters |
| `school_year` | text | yes | Format such as 2026-2027 |
| `starts_on` | date | yes | First day of the school year |
| `ends_on` | date | yes | Must be after `starts_on` |
| `archived_at` | timestamptz | no | Empty while the class is active. Set automatically on the end date, or earlier by the teacher. The class and all its records are permanently deleted 30 days later |
| `created_at` | timestamptz | yes | Default now |

### `users`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key; same id as the Google sign-in account, removed if that account is removed |
| `email` | text | yes | Unique, stored lowercase, must match the Google email |
| `display_name` | text | no | Up to 100 characters; copied into log entries |
| `active` | boolean | yes | Default true |
| `created_at` | timestamptz | yes | Default now |

### `class_members`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Links to `classes`; removed with the class |
| `user_id` | uuid | yes | Links to `users` |
| `role` | member\_role | yes | `teacher` or `secretary` |
| `created_at` | timestamptz | yes | Default now |

One role per person per class (unique on `class_id` and `user_id`). A class can have several teachers and several secretaries.

### `staff_invites`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Links to `classes`; removed with the class |
| `email` | text | yes | Stored lowercase; must match the person’s Google email |
| `role` | member\_role | yes | `teacher` or `secretary` |
| `invited_by` | uuid | no | Links to `users`; empty when the sysadmin adds a teacher |
| `created_at` | timestamptz | yes | Default now |
| `claimed_at` | timestamptz | no | Set at the first sign-in with the matching email |

Unique on `class_id` and `email`. The sysadmin adds teachers; a teacher adds secretaries. No confirmation code.

### `students`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Links to `classes`; removed with the class |
| `last_name` | text | yes | 1–100 characters, not blank |
| `first_name` | text | yes | 1–100 characters, not blank |
| `middle_initial` | text | no | Exactly 1 character |
| `link_token_hash` | text | yes | Unique. Hash of the long random token in the student’s personal link. The token itself is shown to the teacher once and can only be regenerated, never viewed again |
| `active` | boolean | yes | Default true; false = soft deleted (hidden from the sheet, the personal link stops working) |
| `deactivated_at` | timestamptz | no | Set when `active` becomes false |
| `created_at` | timestamptz | yes | Default now |
| `updated_at` | timestamptz | yes | Default now, refreshed on every change |

No unique rule on names; duplicates are flagged in the import preview.

### `school_days`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Links to `classes`; removed with the class |
| `school_date` | date | yes | Unique together with `class_id` |
| `day_type` | day\_type | yes | Default `whole_day` |
| `note` | text | no | 1–150 characters; shown to parents |
| `state` | day\_state | yes | Default `not_recorded` |
| `submitted_by` | uuid | no | Links to `users`; required when state is `submitted` |
| `submitted_at` | timestamptz | no | Required when state is `submitted` |
| `locked_by` | uuid | no | Links to `users`; required when state is `locked` |
| `locked_at` | timestamptz | no | Required when state is `locked` |
| `created_at` | timestamptz | yes | Default now |
| `updated_at` | timestamptz | yes | Default now, refreshed on every change |

Locking freezes the day type, the note and the attendance. Days of type `suspended_weather`, `suspended_other`, `holiday`, `school_event` or `other_no_class` take no attendance: they can’t be `submitted` and have no absence rows, but they can be locked.

### `absences`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Day and student must both belong to this class |
| `school_day_id` | uuid | yes | Links to `school_days`; removed with the day |
| `student_id` | uuid | yes | Links to `students`; removed with the student |
| `reason` | absence\_reason | yes | Default `not_stated` |
| `note` | text | no | 1–150 characters; shown to everyone who can see the absence, including the parent |
| `marked_by` | uuid | no | Links to `users` |
| `created_at` | timestamptz | yes | Default now |
| `updated_at` | timestamptz | yes | Default now, refreshed on every change |

Unique on `school_day_id` and `student_id`. Only absent students get a row. Parents see the reason and the note for their own child.

### `holiday_templates`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `holiday_date` | date | yes | Unique |
| `name` | text | yes | 1–100 characters |
| `created_at` | timestamptz | yes | Default now |

### `holidays`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key, random by default |
| `class_id` | uuid | yes | Links to `classes`; removed with the class |
| `holiday_date` | date | yes | Unique together with `class_id` |
| `name` | text | yes | 1–100 characters |
| `source` | text | yes | `template` (copied at class setup) or `teacher` |
| `created_at` | timestamptz | yes | Default now |

Each class gets its own editable copy of the templates when it is set up.

### `activity_log`

| Column | Type | Required | Limits and notes |
| --- | --- | --- | --- |
| `id` | bigint | yes | Primary key, counts up automatically |
| `class_id` | uuid | no | Links to `classes` |
| `student_id` | uuid | no | Links to `students`; the entry is removed if the student is truly deleted |
| `actor_user_id` | uuid | no | Plain id with no link, so the entry survives deleting the user |
| `actor_email` | text | no | Snapshot at the time of the action |
| `actor_name` | text | no | Snapshot at the time of the action |
| `actor_role` | text | yes | `teacher`, `secretary` or `system` |
| `action` | text | yes | Short code such as `absence.marked`, up to 100 characters |
| `target_type` | text | no | Up to 50 characters |
| `target_id` | uuid | no | The record that was changed |
| `before` | jsonb | no | Values before the change; student ids only, no names |
| `after` | jsonb | no | Values after the change; student ids only, no names |
| `ip` | inet | no | From the forwarded request header |
| `user_agent` | text | no | Up to 500 characters (device and browser) |
| `created_at` | timestamptz | yes | Default now |

Append-only: entries can’t be edited. Deleting is allowed only through a student’s true deletion or the yearly cleanup.

## Draft project scaffold

Preferred stack (the coding agent may challenge it with concrete reasons): Next.js (App Router) with TypeScript and Tailwind, Supabase (Postgres, Google sign-in, row-level security), hosted on Vercel.

Planned structure:

- **app/s/\[token\]:** parent view opened by the personal link (month view)
- **app/teacher:** dashboard, class list and import, day review, exports, activity log
- **app/secretary:** today’s sheet
- **app/api:** server endpoints for parent page data, link regeneration, locking, imports, exports
- **lib/data:** the single data-access module for all student reads and writes
- **lib/auth:** Google sign-in and role checks
- **lib/export:** CSV, PDF, and DOCX generation
- **supabase/migrations:** the schema and row-level security policies
- **supabase/seed:** the Philippine holiday list and a fake demo class
- Environment variables kept server-side only, with a sample file in the repo

Build order: auth and roles, then class list and import, then the secretary sheet and day states, then the parent view with personal links, then the activity log, then exports and holidays.

## Defaults assumed (change if wrong)

- A class can have several teachers and several secretaries; the teacher can also submit if the secretaries are out.
- Each school year is a new class with a freshly imported student list and new links.
- Classes are archived automatically on their end date and permanently deleted 30 days later, together with their activity log. All dates and times use Philippine time (Asia/Manila).
- Screens are designed phone-first, since parents open their link from Messenger.
- A day’s type and note show to parents right away, while absence marks wait for Submit.

## Open questions

- What input format does the official school attendance system take? (Exports stay generic until this is known.)
- Which scheduler runs the daily cleanup (Supabase or Vercel)?
- Domain name. The working project name is Pasok.
- School approval and privacy notice wording before any real student data is loaded.
- Two real students with the same name and middle initial: the import blocks the second. A distinguishing suffix or initial is the suggested fix.
- The Filipino wording needs a native-speaker review before real use.
- Hosting limits (for example, free-tier projects pausing after inactivity, or scheduled-job limits) need checking against the school calendar.

## Decisions and reasons

These are deliberate choices. Please do not change them without asking.

| Decision | Reason |
| --- | --- |
| Parents open a personal link per student, with no login and no PIN | The lowest friction for parents. The link is the secret, so there is nothing to type and nothing to guess |
| The link is stored hashed and can only be regenerated | A database leak does not expose working links, and the teacher’s Messenger chat already keeps the copy |
| Parents see submitted but unconfirmed entries | The point of the app is that parents get an answer even when the teacher is unavailable |
| A day is “Not yet recorded” until someone submits it | It avoids false reassurance that everyone was present |
| The secretary edits until the teacher locks | The secretary does the daily work and the teacher stays the final authority |
| The secretary is a student with a Google account | Low friction. Accountability comes from the activity log |
| Students are soft deleted | History is kept and the teacher can restore a student. True deletion is rare and done by the sysadmin |
| A class is deleted 30 days after it is archived | Privacy. The school’s own system is the official record |
| Encryption is postponed to version 2 | The demo uses fake students, and the code is structured (one data-access module, random ids) so encryption can be added in one place |
| Email updates are postponed to version 2 | They have the most moving parts (opt-in, approval, scheduling, corrections), and version 1 is useful without them |
| One shared note, no private note | It reduces error: everyone sees the same thing |
| Filipino is the default language | It is the everyday language of the parents and students |
| Each class has its own copy of the holiday list | Suspensions and make-up classes differ per class |
| School days are Monday to Friday only | The simplest correct calendar for version 1 |
| Import is all-or-nothing | It protects against overwritten data and duplicates |
| Roles are fixed (teacher, secretary), several allowed per class | The structure supports multiple teachers later without custom permissions |

## Glossary

| Term | Meaning |
| --- | --- |
| Class | One advisory group for one school year, with its teachers, secretaries and students |
| Adviser | The advisory teacher |
| Secretary | The student the teacher assigns to record attendance |
| Day type | What kind of school day it was: whole day, early dismissal, half day, a suspension, a holiday, a school event, or another no-class day |
| Day state | Where a day’s attendance stands: not recorded, submitted, or locked |
| Submit | Marking a day’s attendance as complete, including “no one absent” |
| Lock | The teacher’s confirmation, which freezes the day |
| Unconfirmed | Submitted but not yet locked |
| Personal link | The private address that opens one student’s page |
| Archive | Closing a class on its end date. It is deleted 30 days later |
| Deactivate | Soft delete: hide a student or secretary without erasing history |
| Sysadmin | The developer who runs the system |

---

## Analysis

### Acceptance Criteria

Explicit (from "Acceptance criteria for version 1"):

- [ ] AC1: A teacher invited by the sysadmin can sign in with Google. An uninvited Google account gets no access.
- [ ] AC2: Importing a valid CSV saves every row. A file with any error saves nothing, and the preview shows each row's result with the reason for every error.
- [ ] AC3: Each student's personal link can be copied once, after import or regeneration. Regenerating makes the old link return no data.
- [ ] AC4: A secretary added by Google email can sign in only with that exact Google account.
- [ ] AC5: The secretary can open any unlocked school day, mark absences with a preset reason and a note of up to 150 characters, and submit, including "no one absent".
- [ ] AC6: Before a day is submitted, the parent view shows "Not yet recorded" and none of that day's absence marks.
- [ ] AC7: A personal link shows only that student's month: day type, state, and the reason and note for absences, labelled unconfirmed until the day is locked.
- [ ] AC8: After the teacher locks a day, the secretary cannot change anything on it. The teacher can reopen it.
- [ ] AC9: Days of no-attendance types take no attendance. Holidays are pre-filled from the class holiday list.
- [ ] AC10: Every change is logged with actor, role, action, before and after values, IP address and device. Entries can't be edited, and the teacher can read the log.
- [ ] AC11: CSV, PDF and DOCX exports for one month, for one student or all, label unlocked days as unconfirmed.
- [ ] AC12: A deactivated student's link stops working and the student no longer appears on the secretary's sheet.
- [ ] AC13: Switching between Filipino and English changes all interface text and is remembered on that device. Filipino is the default.
- [ ] AC14: An archived class is permanently deleted 30 days later, together with its students, days and activity log.
- [ ] AC15: No student name appears in a link, page title, link preview, server log or error report.
- [ ] AC16: Every screen works at phone width.

Derived:

- [ ] Submitted absences are visible to parents right away, labelled unconfirmed (derived, from Core flow rules)
- [ ] Day type and note are visible to parents before submit, labelled unconfirmed (derived)
- [ ] School days are Monday to Friday only. Weekends are greyed out in the parent month view (derived)
- [ ] The "week not yet confirmed" prompt appears while a week has unlocked days (derived)
- [ ] Day notes and absence notes are limited to 150 characters, with a "keep it short and factual" hint (derived)
- [ ] Duplicates (last name + first name + middle initial, against active students or within the file) are import errors (derived)
- [ ] Link tokens are stored only as a hash. The page sends `Referrer-Policy: no-referrer` and loads no third-party resources (derived)
- [ ] The browser never reads student tables directly. RLS is on and the service key stays on the server (derived)
- [ ] All student reads and writes go through `lib/data` (derived)
- [ ] Concurrent edits: the last save wins, and both edits appear in the log (derived)
- [ ] All dates and "today" use Asia/Manila (derived)
- [ ] The parent page shows the unofficial-tool banner and the privacy notice in both languages (derived)
- [ ] Students can be soft-deleted and restored (derived)
- [ ] A teacher can submit a day as well as a secretary (derived, from Defaults)

### Scope & Out-of-Scope

- **In scope:** one teacher and one class (multi-class-ready schema); Google sign-in for teacher and secretary; all-or-nothing CSV import; personal parent links; the secretary daily sheet; day types and states; the per-class holiday list; the activity log; CSV/PDF/DOCX monthly exports; Filipino/English UI; automatic archive and deletion 30 days later; a fake demo class.
- **Out of scope:** email updates, encryption, a sysadmin panel, multiple classes each with its own URL, parent error reporting, Saturday make-up classes, custom roles, integration with the official school system, and using real student data before the school approves.

### Ambiguities & Risks

Full detail is in the review artifact (`pasok_review.md`). The main points:

1. **Lock semantics.** Can an attendance day that was never submitted be locked? Can the teacher edit a locked day in place, or must they reopen it first ("edits locked days" vs "a reopen is logged")? What state does reopen go back to?
2. **Changing the type with absences present.** The schema forbids absence rows and the `submitted` state on no-attendance days, but nothing says what happens to existing absences when the type changes.
3. **Weekly prompt.** Do no-attendance days need a lock before the "week not yet confirmed" prompt clears?
4. **Edit window.** Which days can the secretary edit: before `starts_on`? future days, for a suspension announced in advance?
5. **When `school_days` rows are created, and how holiday-list edits reach them.**
6. **Secretary deactivation.** `class_members` has no active flag, and the invite row could be claimed again.
7. **Restored student.** Does the old link start working again?
8. **Links shown only once on a bulk import.** No recovery path if the teacher leaves partway through.
9. **Names that don't fit.** No suffix column; `middle_initial` must be exactly one character.
10. **Append-only log vs cascade deletes.** Also, student ids inside `before`/`after` JSON survive a true deletion.
11. **Language saved in localStorage.** Pages render in Filipino first and then flicker; storage may not persist in Messenger's in-app browser.
12. **Hosting.** The Supabase free tier pauses after inactivity (parent links go down and the cleanup is delayed). Vercel Hobby is non-commercial only. The scheduler choice is open.
13. **Privacy.** The secretary is a minor whose IP and device are logged. The token in the URL appears in hosting request logs.
14. **"Scope: single teacher" vs "Defaults: several teachers per class".**
15. **Export language** and yearly holiday templates (the template table has no year).

### Codebase-Aware Notes

- The workspace (`/home/james2898/projects/pasok`) is **empty and not a git repository**. Everything is net-new.
- The planned structure from the PBI is the expected layout: `app/s/[token]`, `app/teacher`, `app/secretary`, `app/api`, `lib/data`, `lib/auth`, `lib/export`, `supabase/migrations`, `supabase/seed`.
- No existing code to reuse. The libraries still to choose (PDF, DOCX, CSV parsing, i18n) are new dependencies and need the user's approval.

---

## Design decisions (grill)

*From /design-grill rounds, 2026-11-22. These override the verbatim PBI where they conflict.*

| # | Decision | Answer | Source | Spec section |
|---|---|---|---|---|
| Q1.1 | Lock an unrecorded attendance day | Not allowed; teacher has one-tap "submit and lock" | user | Data & state / AC8 |
| Q1.2 | Teacher edits on a locked day | Edit in place, each change logged, day stays locked | user | AC8 |
| Q1.3 | Type change to no-class with absences present | Delete absences (logged with before values), state → `not_recorded`, confirm dialog | user | Data & state / AC9 |
| Q1.4 | Secretary edit window | Day type/note allowed for future days; attendance only `starts_on`..today (Asia/Manila) | user | Behaviour / AC5 |
| Q1.5 | Language persistence | Cookie (replaces localStorage decision) | user | NFR / AC13 |
| Q1.6 | Hosting | Supabase free + Vercel Hobby for demo; re-decide before real class | user | Integration |
| Q2.1 | Reopen target state | `submitted` (absences kept) | user | Data & state |
| Q2.2 | No-class days and "week not yet confirmed" | Excluded from the prompt (still lockable) | user | Behaviour |
| Q2.3 | Cleanup scheduler | Supabase `pg_cron` | user | Integration / AC14 |
| Q2.4 | Remove a secretary | Delete `class_members` row and `staff_invites` row; membership checked on every request | user | Data model / AC4 |
| Q2.5 | Link recovery and status | Track whether each link was copied; bulk-regenerate uncopied links; no links file download. Teacher sees whether each link has been opened | user (with addition) | Behaviour / AC3 |
| Q2.6 | Name fields | Add optional `suffix`; `middle_initial` optional, 0–2 chars; duplicate key = last + first + middle initial + suffix | user | Data model / AC2 |
| Q3.1 | Link access tracking | `link_first_opened_at`, `link_last_opened_at`, `link_open_count` on students; reset on regenerate; no parent IP/device | user | Data model / Privacy |
| Q3.2 | Restore a student | Requires a new link | user | AC12 |
| Q3.3 | Undo archive | Allowed during the 30 days, with countdown and confirm | user | AC14 |
| Q3.4 | Export language | Exporter's UI language; PH date format, Asia/Manila | user | AC11 |
| Q3.5 | Holiday templates | Scoped to a school year; sysadmin seeds each year | user | Data model |
| Q4.1 | Uninvited Google sign-in | Rejected by Supabase "before user created" auth hook | user | AC1 |
| Q4.2 | Last-write-wins granularity | Per absence row (upsert per student) | user | Data & state |
| Q4.3 | `school_days` row creation | Lazy, on first touch; holiday type read from `holidays` until then | user | Data model / AC9 |
| Q4.4 | Activity log integrity | UPDATE always blocked; DELETE only via student true-deletion or class cleanup; one entry per student for bulk actions | user | AC10 / AC14 |
| Q4.5 | Import row matches a deactivated student | Warning suggesting restore; does not block | user | AC2 |
| Q4.6 | Privacy notice wording | "within about 30 days after the class is closed" + "we record when the link was opened" (both languages) | user | Privacy |
| A1 | Single vs several teachers | Schema allows several; v1 UI cannot add teachers (sysadmin script only) | assumption (inferred), user confirmed | Scope |
| A2 | Token in hosting request logs | Accepted; app logs never record the path; `Referrer-Policy: no-referrer` | assumption (inferred), user confirmed | NFR / AC15 |

## Open questions (grill)

| # | Question | Assumption in force | Who can answer |
|---|---|---|---|
| Q3.6 | Does logging the secretary's (16+ minor) IP and device require parental consent? | Keep logging; disclosed in the privacy notice | School / data protection officer |
| doc | Input format of the official attendance system | Generic exports | School |
| doc | Native-speaker review of the Filipino wording | Use the draft until reviewed | Native speaker |
| doc | School approval before real student data | Fake data only | School |

Questionnaire for the school: `pbi-docs/PBI-20261122-questions-school.md`.
