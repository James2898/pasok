import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

describe("Phase 0 Foundation — Schema, RLS, Activity Log Trigger & Seed", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite({
      extensions: {
        pgcrypto,
      },
    });

    const migrationPath = path.resolve(
      __dirname,
      "../supabase/migrations/20261122000001_phase0_foundation.sql"
    );
    const seedPath = path.resolve(__dirname, "../supabase/seed/seed.sql");

    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    const seedSql = fs.readFileSync(seedPath, "utf8");

    await db.exec(migrationSql);
    await db.exec(seedSql);
  });

  afterAll(async () => {
    await db.close();
  });

  it("applies migration and seed cleanly (fake class, 10 fake students, 16 holiday templates)", async () => {
    const classesRes = await db.query<{ count: string }>(
      "SELECT count(*) FROM public.classes;"
    );
    expect(Number(classesRes.rows[0].count)).toBe(1);

    const studentsRes = await db.query<{ count: string }>(
      "SELECT count(*) FROM public.students WHERE class_id = '11111111-1111-4111-8111-111111111111';"
    );
    expect(Number(studentsRes.rows[0].count)).toBe(10);

    const templatesRes = await db.query<{ count: string }>(
      "SELECT count(*) FROM public.holiday_templates WHERE school_year = '2026-2027';"
    );
    expect(Number(templatesRes.rows[0].count)).toBe(16);

    const classHolidaysRes = await db.query<{ count: string }>(
      "SELECT count(*) FROM public.holidays WHERE class_id = '11111111-1111-4111-8111-111111111111';"
    );
    expect(Number(classHolidaysRes.rows[0].count)).toBe(16);
  });

  it("enforces RLS and privilege revocation: anon and authenticated cannot read or write tables directly", async () => {
    const tables = [
      "classes",
      "users",
      "class_members",
      "staff_invites",
      "students",
      "school_days",
      "absences",
      "holiday_templates",
      "holidays",
      "activity_log",
    ];

    for (const role of ["anon", "authenticated"]) {
      for (const table of tables) {
        await expect(
          db.exec(`
            SET LOCAL ROLE ${role};
            SELECT * FROM public.${table};
          `)
        ).rejects.toThrow(/permission denied/i);
      }
    }

    // Even if SELECT were granted to anon/authenticated, FORCE ROW LEVEL SECURITY
    // with zero policies for anon/authenticated returns 0 rows:
    const rlsFlags = await db.query<{
      relname: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      ORDER BY relname;
    `);

    expect(rlsFlags.rows.length).toBe(tables.length);
    for (const row of rlsFlags.rows) {
      expect(row.relrowsecurity).toBe(true);
      expect(row.relforcerowsecurity).toBe(true);
    }
  });

  it("allows service_role to read and write all tables", async () => {
    const res = await db.exec(`
      SET LOCAL ROLE service_role;
      SELECT count(*) AS cnt FROM public.students;
    `);
    const rows = res[1].rows as Array<{ cnt: string }>;
    expect(Number(rows[0].cnt)).toBe(10);
  });

  it("rejects UPDATE and direct DELETE on activity_log, but permits cascade DELETE from student true-deletion", async () => {
    // Insert a temporary student and an activity_log entry linked to that student
    const tempStudentId = "33333333-3333-4333-8333-333333333399";
    await db.exec(`
      INSERT INTO public.students (id, class_id, last_name, first_name, link_token_hash)
      VALUES (
        '${tempStudentId}',
        '11111111-1111-4111-8111-111111111111',
        'Temp',
        'Student',
        'temp-hash-3399'
      );

      INSERT INTO public.activity_log (
        class_id,
        student_id,
        actor_user_id,
        actor_email,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        after
      )
      VALUES (
        '11111111-1111-4111-8111-111111111111',
        '${tempStudentId}',
        '22222222-2222-4222-8222-222222222201',
        'teacher.demo@example.edu.ph',
        'Gng. Elena Santos (Demo)',
        'teacher',
        'student.created',
        'student',
        '${tempStudentId}',
        '{"student_id": "${tempStudentId}"}'::jsonb
      );
    `);

    // 1. UPDATE on activity_log must be rejected
    await expect(
      db.exec(`
        UPDATE public.activity_log
        SET action = 'tampered'
        WHERE student_id = '${tempStudentId}';
      `)
    ).rejects.toThrow(/activity_log is append-only: UPDATE is not permitted/i);

    // 2. Direct DELETE on activity_log must be rejected
    await expect(
      db.exec(`
        DELETE FROM public.activity_log
        WHERE student_id = '${tempStudentId}';
      `)
    ).rejects.toThrow(/activity_log is append-only: direct DELETE is not permitted/i);

    // 2b. Even a DELETE triggered inside another table's trigger (pg_trigger_depth() > 1)
    //     must be rejected while the parent student and class still exist
    await db.exec(`
      CREATE OR REPLACE FUNCTION public.test_rogue_log_delete()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        DELETE FROM public.activity_log WHERE student_id = '${tempStudentId}';
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER rogue_delete_trigger
        AFTER UPDATE ON public.holidays
        FOR EACH STATEMENT
        EXECUTE FUNCTION public.test_rogue_log_delete();
    `);

    await expect(
      db.exec(`
        UPDATE public.holidays
        SET name = name
        WHERE class_id = '11111111-1111-4111-8111-111111111111';
      `)
    ).rejects.toThrow(/activity_log is append-only: direct DELETE is not permitted/i);

    await db.exec(`
      DROP TRIGGER rogue_delete_trigger ON public.holidays;
      DROP FUNCTION public.test_rogue_log_delete();
    `);

    // 3. True deletion of the student cascades and deletes that student's activity_log rows
    await db.exec(`
      DELETE FROM public.students WHERE id = '${tempStudentId}';
    `);

    const remainingLogs = await db.query<{ count: string }>(
      `SELECT count(*) FROM public.activity_log WHERE student_id = '${tempStudentId}';`
    );
    expect(Number(remainingLogs.rows[0].count)).toBe(0);
  });

  it("enforces same-class composite FKs on absences and blocks absences on no-attendance days", async () => {
    // Create a second class and a student in that second class
    const otherClassId = "99999999-9999-4999-8999-999999999999";
    const otherStudentId = "88888888-8888-4888-8888-888888888888";
    const dayInClass1 = "77777777-7777-4777-8777-777777777701";
    const holidayDayInClass1 = "77777777-7777-4777-8777-777777777702";

    await db.exec(`
      INSERT INTO public.classes (id, name, school_year, starts_on, ends_on)
      VALUES ('${otherClassId}', 'Other Class', '2026-2027', '2026-06-08', '2027-03-31');

      INSERT INTO public.students (id, class_id, last_name, first_name, link_token_hash)
      VALUES ('${otherStudentId}', '${otherClassId}', 'Cross', 'Class', 'other-class-hash');

      INSERT INTO public.school_days (id, class_id, school_date, day_type, state)
      VALUES
        ('${dayInClass1}', '11111111-1111-4111-8111-111111111111', '2026-06-15', 'whole_day', 'not_recorded'),
        ('${holidayDayInClass1}', '11111111-1111-4111-8111-111111111111', '2026-06-12', 'holiday', 'not_recorded');
    `);

    // Cross-class absence must be rejected by composite FK
    await expect(
      db.exec(`
        INSERT INTO public.absences (class_id, school_day_id, student_id, reason)
        VALUES (
          '11111111-1111-4111-8111-111111111111',
          '${dayInClass1}',
          '${otherStudentId}',
          'sick'
        );
      `)
    ).rejects.toThrow(/absences_student_class_fkey/i);

    // Absence on a no-attendance day ('holiday') must be rejected
    await expect(
      db.exec(`
        INSERT INTO public.absences (class_id, school_day_id, student_id, reason)
        VALUES (
          '11111111-1111-4111-8111-111111111111',
          '${holidayDayInClass1}',
          '33333333-3333-4333-8333-333333333301',
          'sick'
        );
      `)
    ).rejects.toThrow(/Cannot record absences on a no-attendance school day/i);

    // Clean up temporary rows
    await db.exec(`
      DELETE FROM public.school_days WHERE id IN ('${dayInClass1}', '${holidayDayInClass1}');
      DELETE FROM public.classes WHERE id = '${otherClassId}';
    `);
  });

  it("enforces school_days state-machine constraints (Grill Q1.1, Q2.1)", async () => {
    // Locking an unsubmitted whole_day must fail (Q1.1: cannot lock unrecorded attendance day)
    await expect(
      db.exec(`
        INSERT INTO public.school_days (
          class_id, school_date, day_type, state, locked_by, locked_at
        )
        VALUES (
          '11111111-1111-4111-8111-111111111111',
          '2026-06-16',
          'whole_day',
          'locked',
          '22222222-2222-4222-8222-222222222201',
          now()
        );
      `)
    ).rejects.toThrow(/school_days_state_timestamps_check/i);

    // Submitting a no-attendance day ('suspended_weather') must fail
    await expect(
      db.exec(`
        INSERT INTO public.school_days (
          class_id, school_date, day_type, state, submitted_by, submitted_at
        )
        VALUES (
          '11111111-1111-4111-8111-111111111111',
          '2026-06-17',
          'suspended_weather',
          'submitted',
          '22222222-2222-4222-8222-222222222202',
          now()
        );
      `)
    ).rejects.toThrow(/school_days_no_class_state_check/i);
  });

  it("executes run_daily_class_maintenance() to archive past classes and delete 30-day archived classes", async () => {
    const expiredArchiveClassId = "66666666-6666-4666-8666-666666666601";
    await db.exec(`
      INSERT INTO public.classes (id, name, school_year, starts_on, ends_on, archived_at)
      VALUES (
        '${expiredArchiveClassId}',
        'Old Archived Class',
        '2025-2026',
        '2025-06-01',
        '2026-03-31',
        now() - interval '31 days'
      );

      INSERT INTO public.activity_log (class_id, actor_role, action)
      VALUES ('${expiredArchiveClassId}', 'system', 'class.archived');
    `);

    const maintRes = await db.query<{ result: { deleted_count: number } }>(
      "SELECT public.run_daily_class_maintenance() AS result;"
    );
    expect(maintRes.rows[0].result.deleted_count).toBe(1);

    const checkDeleted = await db.query<{ count: string }>(
      `SELECT count(*) FROM public.classes WHERE id = '${expiredArchiveClassId}';`
    );
    expect(Number(checkDeleted.rows[0].count)).toBe(0);
  });
});
