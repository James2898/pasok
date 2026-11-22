# Pasok v0.3: Review and Build Plan

The document is strong. Scope is tight, the decisions come with reasons, the acceptance criteria can be tested, and privacy is thought through. Most of what follows is about **state-machine edge cases** the document doesn't settle yet. Those need answers before the schema and the server endpoints can be written.

---

## 1. Contradictions

| # | Where | Conflict | Suggested resolution |
|---|---|---|---|
| C1 | Roles vs States | The Teacher role says "edits locked days **and** reopens", but States says a locked day is frozen and "a reopen is logged". It's unclear whether a teacher edits in place or must reopen first. | The teacher can edit a locked day in place. Each edit is logged and the day stays locked. Reopen is only for handing the day back to the secretary. |
| C2 | Day types vs schema | A day can be `submitted` with absences, and then someone changes its type to `suspended_weather`. The schema says no-attendance days "can't be submitted and have no absence rows". | When the type changes to no-attendance: delete the absences (logged with their before values) and set the state back to `not_recorded`. Show a confirm dialog first. |
| C3 | Scope vs Defaults | v1 scope says "Single teacher". Defaults say "several teachers per class". | The schema allows several. The v1 UI has no way to add a teacher; that stays a sysadmin script. |
| C4 | Privacy notice vs `classes.archived_at` | The notice says "one month after the school year ends". A teacher can archive early, which starts deletion earlier. Supabase pausing (R1) can delay it. | Change the wording to "within about 30 days after the class is closed". |
| C5 | Demo step 8 vs features | "Teacher locks the **week**", but the features only describe locking one day. | Add a bulk "Lock week" action. Each day still gets its own log entry. |
| C6 | Activity log "append-only" vs cascade deletes | Entries can be deleted when a student or class is deleted, but an append-only rule usually blocks every DELETE. Also, `before`/`after` JSON can mention a student id without `student_id` being set, so those entries survive a true deletion. | Use a trigger that blocks UPDATE always and blocks DELETE unless it comes from a cascade or a flagged session. Always set `student_id` on single-student actions. Bulk actions write one entry per student. |

## 2. Gaps (undefined behaviour)

1. **Locking a `not_recorded` attendance day.** Is this allowed? If yes, it confirms "everyone present" without anyone submitting, which breaks the "no false reassurance" rule. *Suggest: block it, or require submit-then-lock in one teacher action.*
2. **What reopen goes back to:** `submitted` or `not_recorded`? *Suggest `submitted`.*
3. **No-attendance days and the "week not yet confirmed" prompt.** As written, the teacher has to lock every holiday and suspension, or the prompt never goes away. *Suggest: those days don't count toward the prompt.*
4. **Parent display for a no-attendance day in `not_recorded` state.** Show the type (for example "Suspended: weather, unconfirmed"), not "Not yet recorded". The doc implies this but never says it.
5. **Which days the secretary can edit.** Can they edit days before `starts_on`, or future days? *Suggest: attendance from `starts_on` to today only. Day type and note can also be set for future days, so a suspension announced the night before can be entered.*
6. **What "today" means.** Vercel runs in UTC, so every "today" must be computed in Asia/Manila.
7. **When `school_days` rows are created, and how holidays sync.** If rows are created ahead of time, later edits to the holiday list won't reach them. *Suggest: create rows only when first touched. If no row exists, read the type from `holidays`.*
8. **Deactivating a secretary.** The schema has no `active` flag on `class_members`, and `users.active` applies to every class. A leftover `staff_invites` row could let them claim access again. *Suggest: deleting the membership also deletes the invite, and existing sessions are re-checked on each request.*
9. **Restoring a student.** Does the old link start working again? *Suggest: restoring forces a link regeneration.*
10. **Undoing an early archive.** If the teacher archives early by mistake, can they undo it within the 30 days?
11. **Uninvited Google sign-in.** Supabase creates an `auth.users` row before the app can refuse access. *Suggest: a Supabase "before user created" auth hook that rejects emails with no invite, so no row is ever created.*
12. **Seeing links only once on a 40-student import.** If the teacher leaves the page partway through, every uncopied link has to be regenerated one by one. There's no stated way to get the links out besides copying them one at a time.
13. **Names that don't fit the import rules.** There's no suffix column (Jr., III), and `middle_initial` must be exactly one character, which fails for none-vs-"Ma." cases. A suffix column also fixes the duplicate-name open question.
14. **Importing a name that matches a deactivated student.** The importer accepts it as a new student. Should it suggest a restore instead?
15. **Granularity of "last save wins".** Saving the whole day at once overwrites the other person's changes to other students. *Suggest: save each absence row separately (upsert per row), so only a true same-student conflict loses.*
16. **Range of the parent month view.** Limit navigation to `starts_on` through `ends_on`.
17. **Export language and time zone.** Pick Filipino or English, and use Asia/Manila timestamps.
18. **Holiday templates by year.** `holiday_date` is unique but has no year. Philippine holidays change every year by proclamation, and Eid dates move, so the seed needs refreshing each year.

## 3. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Supabase free tier pauses a project after about 7 days without activity** (summer break, long holidays). While paused, the parent links are down and the deletion job doesn't run. | Pro plan, a keep-alive ping, or accept it and note it. Check before the demo. |
| R2 | Vercel Hobby is limited to non-commercial use, and cron jobs run at most once a day. | Once a day is enough. Running the job with `pg_cron` inside the database avoids the dependency entirely. |
| R3 | The token is in the URL path, so it shows up in Vercel request logs and in browser history. | Accepted under the "link is the secret" decision. Don't log the path in app logs, and use `Referrer-Policy: no-referrer`. |
| R4 | The secretary is a **minor (16+)**, and their IP and device are logged. | Raise this with the school as part of the Data Privacy Act conversation. |
| R5 | A mistaken day type is shown to parents immediately (by design). | Logged and fixable. Ask for confirmation before saving a suspension type. |
| R6 | Language saved in localStorage: the server can't read it, so pages first render in Filipino and then flicker. Messenger's in-app browser may also clear storage. | **Stack challenge:** save the choice in a cookie instead. It works on each device the same way, has no flicker, and the server renders the right language. |
| R7 | Generating PDF and DOCX inside Vercel functions: bundle size and cold starts. | Use a pure-JS library (for example `pdf-lib` or `@react-pdf/renderer`, plus `docx`). That means new dependencies, which need your approval. |
| R8 | RLS with every request going through the service key means RLS enforces nothing. All permission checks live in server code. | Default deny-all RLS on all tables, plus required membership checks in `lib/auth` on every endpoint, with tests for each role. |

## 4. Stack verdict

**Keep Next.js (App Router) + TypeScript + Tailwind + Supabase + Vercel.** Only two changes are proposed: a cookie instead of localStorage for the language (R6), and `pg_cron` for the cleanup scheduler, which answers that open question. Supabase pausing (R1) is a hosting decision, not a reason to switch stacks.

## 5. Phased build plan

| Phase | Deliverable | Acceptance criteria covered | How it's tested |
|---|---|---|---|
| 0. Foundation | Repo, env sample, i18n skeleton (cookie), Manila time helpers, the full schema + RLS + log trigger in migrations, seed with a fake class and holidays | 13 (skeleton), 15 (no names in logs) | Migration test; RLS denies anon/auth; log rejects UPDATE |
| 1. Auth and roles | Google sign-in, invite claim, auth hook that rejects uninvited emails, `lib/auth` role guards, script for the sysadmin to add a teacher | 1, 4 | Invited, uninvited and wrong-email accounts tested by hand; unit tests on the guards |
| 2. Class list | CSV template + AI prompt, all-or-nothing preview, duplicate detection, one-time link reveal + Messenger message, regenerate, deactivate/restore | 2, 3, 12 | Unit tests on the parser; fixture files with errors save nothing |
| 3. Secretary sheet and day states | Daily sheet, reasons, notes, day types, submit, lock, lock week, reopen, teacher edit, no-attendance rules, "week not confirmed" prompt | 5, 8, 9 | State-machine unit tests (every transition, including C2 and gap 1); phone-width check |
| 4. Parent view | `/s/[token]` month view, generic title, no third-party loads, no-referrer, banner + privacy notice in both languages | 6, 7, 12, 15 | Token tests (valid, regenerated, deactivated); grep the HTML for names; check headers |
| 5. Activity log | Logging on every write in `lib/data`, actor snapshot, IP/user agent, teacher log screen | 10 | Each action produces exactly one entry with before/after values |
| 6. Exports and holidays | CSV/PDF/DOCX by month for one student or all, labelled when unconfirmed; editing the class holiday list | 9, 11 | Compare output against fixtures |
| 7. Retention and polish | Auto-archive + deletion 30 days later via `pg_cron`, full i18n pass, mobile pass, run the demo script | 13, 14, 16 | Time-shifted test of the cleanup; walk through all 11 demo steps |

The order matches the document's build order. The only changes are that the full schema and i18n move into Phase 0, so later phases don't need follow-up migrations.
