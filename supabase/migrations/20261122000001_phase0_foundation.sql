-- =============================================================================
-- Pasok v1 — Phase 0 Foundation Migration
-- Full schema, constraints, indexes, deny-all RLS, activity_log guard trigger,
-- updated_at triggers, and daily maintenance function (with optional pg_cron).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure standard Supabase roles exist when running in local/test Postgres (e.g. PGlite)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Fixed lists (enums)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('teacher', 'secretary');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_type') THEN
    CREATE TYPE public.day_type AS ENUM (
      'whole_day',
      'early_dismissal',
      'half_day',
      'suspended_weather',
      'suspended_other',
      'holiday',
      'school_event',
      'other_no_class'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_state') THEN
    CREATE TYPE public.day_state AS ENUM ('not_recorded', 'submitted', 'locked');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'absence_reason') THEN
    CREATE TYPE public.absence_reason AS ENUM (
      'sick',
      'family_matter',
      'excused',
      'school_activity',
      'not_stated'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Utility functions (updated_at)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Tables
-- -----------------------------------------------------------------------------

-- 4.1 classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_year text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  archived_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT classes_name_len_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  CONSTRAINT classes_school_year_format_check CHECK (school_year ~ '^\d{4}-\d{4}$'),
  CONSTRAINT classes_dates_order_check CHECK (ends_on > starts_on)
);

-- 4.2 users
-- Note: In hosted Supabase, users.id matches auth.users.id. We attach the FK to
-- auth.users(id) ON DELETE CASCADE dynamically when the auth.users table exists.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase_check CHECK (email = lower(btrim(email)) AND char_length(email) > 3),
  CONSTRAINT users_display_name_len_check CHECK (display_name IS NULL OR char_length(display_name) <= 100)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_id_auth_users_fkey'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_auth_users_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4.3 class_members
CREATE TABLE IF NOT EXISTS public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_members_class_user_unique UNIQUE (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS class_members_class_id_idx ON public.class_members (class_id);
CREATE INDEX IF NOT EXISTS class_members_user_id_idx ON public.class_members (user_id);

-- 4.4 staff_invites
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.member_role NOT NULL,
  invited_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz NULL,
  CONSTRAINT staff_invites_class_email_unique UNIQUE (class_id, email),
  CONSTRAINT staff_invites_email_lowercase_check CHECK (email = lower(btrim(email)) AND char_length(email) > 3)
);

CREATE INDEX IF NOT EXISTS staff_invites_class_id_idx ON public.staff_invites (class_id);
CREATE INDEX IF NOT EXISTS staff_invites_email_idx ON public.staff_invites (email);
CREATE INDEX IF NOT EXISTS staff_invites_invited_by_idx ON public.staff_invites (invited_by);

-- 4.5 students (includes Q2.5, Q2.6, Q3.1 grill decisions)
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_initial text NULL,
  suffix text NULL,
  link_token_hash text NOT NULL UNIQUE,
  link_copied_at timestamptz NULL,
  link_first_opened_at timestamptz NULL,
  link_last_opened_at timestamptz NULL,
  link_open_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Composite unique key for same-class composite FK from absences
  CONSTRAINT students_id_class_unique UNIQUE (id, class_id),
  CONSTRAINT students_last_name_len_check CHECK (char_length(btrim(last_name)) BETWEEN 1 AND 100),
  CONSTRAINT students_first_name_len_check CHECK (char_length(btrim(first_name)) BETWEEN 1 AND 100),
  CONSTRAINT students_middle_initial_len_check CHECK (middle_initial IS NULL OR char_length(btrim(middle_initial)) BETWEEN 0 AND 2),
  CONSTRAINT students_suffix_len_check CHECK (suffix IS NULL OR char_length(btrim(suffix)) BETWEEN 0 AND 20),
  CONSTRAINT students_link_token_hash_not_blank_check CHECK (char_length(btrim(link_token_hash)) > 0),
  CONSTRAINT students_link_open_count_non_negative_check CHECK (link_open_count >= 0),
  CONSTRAINT students_deactivated_consistency_check CHECK (
    (active = true AND deactivated_at IS NULL)
    OR (active = false AND deactivated_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS students_class_id_idx ON public.students (class_id);

DROP TRIGGER IF EXISTS students_set_updated_at ON public.students;
CREATE TRIGGER students_set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.6 school_days
CREATE TABLE IF NOT EXISTS public.school_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_date date NOT NULL,
  day_type public.day_type NOT NULL DEFAULT 'whole_day',
  note text NULL,
  state public.day_state NOT NULL DEFAULT 'not_recorded',
  submitted_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NULL,
  locked_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  locked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_days_class_date_unique UNIQUE (class_id, school_date),
  -- Composite unique key for same-class composite FK from absences
  CONSTRAINT school_days_id_class_unique UNIQUE (id, class_id),
  CONSTRAINT school_days_note_len_check CHECK (note IS NULL OR char_length(btrim(note)) BETWEEN 1 AND 150),
  -- No-attendance day types cannot be 'submitted' (can only be 'not_recorded' or 'locked')
  CONSTRAINT school_days_no_class_state_check CHECK (
    day_type IN ('whole_day', 'early_dismissal', 'half_day')
    OR state <> 'submitted'
  ),
  -- State vs timestamp consistency (Grill Q1.1, Q1.3, Q2.1, Phase 0 #2):
  -- - When state = 'not_recorded': submitted_* and locked_* must be NULL
  -- - When state = 'submitted': submitted_at is required and locked_* must be NULL
  -- - When state = 'locked': locked_at is required; for attendance-taking days, submitted_at is also required (Q1.1)
  CONSTRAINT school_days_state_timestamps_check CHECK (
    (
      state = 'not_recorded'
      AND submitted_by IS NULL
      AND submitted_at IS NULL
      AND locked_by IS NULL
      AND locked_at IS NULL
    )
    OR (
      state = 'submitted'
      AND submitted_at IS NOT NULL
      AND locked_by IS NULL
      AND locked_at IS NULL
    )
    OR (
      state = 'locked'
      AND locked_at IS NOT NULL
      AND (
        day_type NOT IN ('whole_day', 'early_dismissal', 'half_day')
        OR submitted_at IS NOT NULL
      )
    )
  )
);

CREATE INDEX IF NOT EXISTS school_days_class_id_idx ON public.school_days (class_id);
CREATE INDEX IF NOT EXISTS school_days_submitted_by_idx ON public.school_days (submitted_by);
CREATE INDEX IF NOT EXISTS school_days_locked_by_idx ON public.school_days (locked_by);

DROP TRIGGER IF EXISTS school_days_set_updated_at ON public.school_days;
CREATE TRIGGER school_days_set_updated_at
  BEFORE UPDATE ON public.school_days
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.7 absences
CREATE TABLE IF NOT EXISTS public.absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_day_id uuid NOT NULL,
  student_id uuid NOT NULL,
  reason public.absence_reason NOT NULL DEFAULT 'not_stated',
  note text NULL,
  marked_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT absences_day_student_unique UNIQUE (school_day_id, student_id),
  CONSTRAINT absences_note_len_check CHECK (note IS NULL OR char_length(btrim(note)) BETWEEN 1 AND 150),
  -- Composite FKs guarantee school_day and student belong to the same class_id
  CONSTRAINT absences_school_day_class_fkey
    FOREIGN KEY (school_day_id, class_id)
    REFERENCES public.school_days(id, class_id)
    ON DELETE CASCADE,
  CONSTRAINT absences_student_class_fkey
    FOREIGN KEY (student_id, class_id)
    REFERENCES public.students(id, class_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS absences_class_id_idx ON public.absences (class_id);
CREATE INDEX IF NOT EXISTS absences_school_day_id_idx ON public.absences (school_day_id);
CREATE INDEX IF NOT EXISTS absences_student_id_idx ON public.absences (student_id);
CREATE INDEX IF NOT EXISTS absences_marked_by_idx ON public.absences (marked_by);

DROP TRIGGER IF EXISTS absences_set_updated_at ON public.absences;
CREATE TRIGGER absences_set_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Guard trigger: prevent inserting/updating absences on no-attendance days
CREATE OR REPLACE FUNCTION public.check_absence_day_takes_attendance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_day_type public.day_type;
BEGIN
  SELECT day_type INTO v_day_type
  FROM public.school_days
  WHERE id = NEW.school_day_id;

  IF v_day_type NOT IN ('whole_day', 'early_dismissal', 'half_day') THEN
    RAISE EXCEPTION 'Cannot record absences on a no-attendance school day (day_type = %)', v_day_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS absences_check_day_type ON public.absences;
CREATE TRIGGER absences_check_day_type
  BEFORE INSERT OR UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.check_absence_day_takes_attendance();

-- 4.8 holiday_templates (scoped to school_year per Grill Q3.5)
CREATE TABLE IF NOT EXISTS public.holiday_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year text NOT NULL,
  holiday_date date NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT holiday_templates_year_date_unique UNIQUE (school_year, holiday_date),
  CONSTRAINT holiday_templates_school_year_format_check CHECK (school_year ~ '^\d{4}-\d{4}$'),
  CONSTRAINT holiday_templates_name_len_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 100)
);

-- 4.9 holidays (per-class editable copy)
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT holidays_class_date_unique UNIQUE (class_id, holiday_date),
  CONSTRAINT holidays_name_len_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  CONSTRAINT holidays_source_check CHECK (source IN ('template', 'teacher'))
);

CREATE INDEX IF NOT EXISTS holidays_class_id_idx ON public.holidays (class_id);

-- 4.10 activity_log (append-only, Grill Q4.4)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id uuid NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NULL REFERENCES public.students(id) ON DELETE CASCADE,
  actor_user_id uuid NULL,
  actor_email text NULL,
  actor_name text NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_type text NULL,
  target_id uuid NULL,
  before jsonb NULL,
  after jsonb NULL,
  ip inet NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_log_actor_role_check CHECK (actor_role IN ('teacher', 'secretary', 'system')),
  CONSTRAINT activity_log_action_len_check CHECK (char_length(btrim(action)) BETWEEN 1 AND 100),
  CONSTRAINT activity_log_target_type_len_check CHECK (target_type IS NULL OR char_length(btrim(target_type)) <= 50),
  CONSTRAINT activity_log_user_agent_len_check CHECK (user_agent IS NULL OR char_length(user_agent) <= 500)
);

CREATE INDEX IF NOT EXISTS activity_log_class_id_created_at_idx
  ON public.activity_log (class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_student_id_idx
  ON public.activity_log (student_id);

-- -----------------------------------------------------------------------------
-- 5. Activity log immutability trigger (Grill Q4.4 & Phase 0 #1)
-- -----------------------------------------------------------------------------
-- UPDATE is always rejected.
-- DELETE is allowed ONLY when:
--   1. Fired via ON DELETE CASCADE from a parent row in public.classes or
--      public.students (verified by pg_trigger_depth() > 1 AND confirming the
--      referenced class_id or student_id no longer exists in its parent table), OR
--   2. Explicitly authorized in a maintenance transaction via
--      set_config('pasok.allow_log_delete', 'on', true).
CREATE OR REPLACE FUNCTION public.guard_activity_log_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent_deleted boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'activity_log is append-only: UPDATE is not permitted'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF coalesce(current_setting('pasok.allow_log_delete', true), '') = 'on' THEN
      RETURN OLD;
    END IF;

    IF pg_trigger_depth() > 1 THEN
      IF OLD.student_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.students WHERE id = OLD.student_id
      ) THEN
        v_parent_deleted := true;
      ELSIF OLD.class_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.classes WHERE id = OLD.class_id
      ) THEN
        v_parent_deleted := true;
      END IF;

      IF v_parent_deleted THEN
        RETURN OLD;
      END IF;
    END IF;

    RAISE EXCEPTION 'activity_log is append-only: direct DELETE is not permitted (only cascade delete from student/class cleanup)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS activity_log_immutability_guard ON public.activity_log;
CREATE TRIGGER activity_log_immutability_guard
  BEFORE UPDATE OR DELETE ON public.activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_activity_log_immutability();

-- -----------------------------------------------------------------------------
-- 6. Daily class maintenance: auto-archive on ends_on & 30-day hard delete
--    (Grill Q2.3, Q3.3 & Phase 0 #5)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_daily_class_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manila_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
  v_archived_count integer := 0;
  v_deleted_count integer := 0;
BEGIN
  -- 1. Auto-archive active classes whose ends_on has passed in Asia/Manila
  WITH archived AS (
    UPDATE public.classes
    SET archived_at = now()
    WHERE archived_at IS NULL
      AND ends_on < v_manila_today
    RETURNING id
  )
  SELECT count(*) INTO v_archived_count FROM archived;

  -- 2. Permanently delete classes archived 30 or more days ago (cascades to all
  --    class-owned tables including activity_log)
  PERFORM set_config('pasok.allow_log_delete', 'on', true);

  WITH deleted AS (
    DELETE FROM public.classes
    WHERE archived_at IS NOT NULL
      AND archived_at <= now() - interval '30 days'
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'manila_today', v_manila_today,
    'archived_count', v_archived_count,
    'deleted_count', v_deleted_count
  );
END;
$$;

-- Schedule via pg_cron when available on the Postgres instance (e.g. Supabase)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      PERFORM cron.schedule(
        'pasok-daily-class-maintenance',
        '5 16 * * *', -- 16:05 UTC = 00:05 Asia/Manila daily
        'SELECT public.run_daily_class_maintenance();'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore if current user lacks permission or pg_cron is not preloaded
        RAISE NOTICE 'Skipping pg_cron schedule registration: %', SQLERRM;
    END;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Row-Level Security (deny-all for anon and authenticated)
-- -----------------------------------------------------------------------------
-- All tables enable and force RLS with zero policies for anon/authenticated,
-- and table privileges are revoked from PUBLIC, anon, and authenticated.
-- Only service_role (used exclusively on the server via lib/data) can access rows.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'classes',
    'users',
    'class_members',
    'staff_invites',
    'students',
    'school_days',
    'absences',
    'holiday_templates',
    'holidays',
    'activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated;', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role;', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.activity_log_id_seq TO service_role;
REVOKE ALL ON SEQUENCE public.activity_log_id_seq FROM PUBLIC, anon, authenticated;
