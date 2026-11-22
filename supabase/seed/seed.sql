-- =============================================================================
-- Pasok v1 — Phase 0 Seed
-- 1. Philippine holiday templates for school year 2026-2027 (Grill Q3.5)
-- 2. Fake demo class: "Grade 11 – Mabini (Demo)" (2026-06-08 to 2027-03-31)
-- 3. Per-class holiday copy for the fake demo class
-- 4. 10 fake senior high school students with deterministic SHA-256 token hashes
--    (NEVER real student data)
--
-- Plaintext test tokens for local development / parent view verification:
--   Student 01 (Dela Cruz, Juan A.)           -> demo-token-student-01-pasok-2026
--   Student 02 (Santos, Maria Clara B.)       -> demo-token-student-02-pasok-2026
--   Student 03 (Reyes, Jose Miguel C. Jr.)    -> demo-token-student-03-pasok-2026
--   Student 04 (Bautista, Angela Mae)         -> demo-token-student-04-pasok-2026
--   Student 05 (Mendoza, Carlo Gabriel D.)    -> demo-token-student-05-pasok-2026
--   Student 06 (Villanueva, Sofia Lorraine E.)-> demo-token-student-06-pasok-2026
--   Student 07 (Ramos, Mark Anthony Ma.)      -> demo-token-student-07-pasok-2026
--   Student 08 (Aquino, Bea Katrina F.)       -> demo-token-student-08-pasok-2026
--   Student 09 (Garcia, Rafael Luis G. III)   -> demo-token-student-09-pasok-2026
--   Student 10 (Flores, Hannah Grace H.)      -> demo-token-student-10-pasok-2026
--
-- Note for Demo Step 2 ("The teacher signs in with Google and sees an empty class"):
-- To reset the demo class roster to empty before running the CSV import demo:
--   DELETE FROM public.students WHERE class_id = '11111111-1111-4111-8111-111111111111';
-- =============================================================================

-- 1. Philippine Holiday Templates for SY 2026-2027
INSERT INTO public.holiday_templates (school_year, holiday_date, name)
VALUES
  ('2026-2027', '2026-06-12', 'Independence Day (Araw ng Kalayaan)'),
  ('2026-2027', '2026-08-21', 'Ninoy Aquino Day'),
  ('2026-2027', '2026-08-31', 'National Heroes Day (Araw ng mga Bayani)'),
  ('2026-2027', '2026-11-01', 'All Saints'' Day'),
  ('2026-2027', '2026-11-02', 'All Souls'' Day'),
  ('2026-2027', '2026-11-30', 'Bonifacio Day'),
  ('2026-2027', '2026-12-08', 'Feast of the Immaculate Conception'),
  ('2026-2027', '2026-12-24', 'Christmas Eve (Special Non-Working Day)'),
  ('2026-2027', '2026-12-25', 'Christmas Day (Araw ng Pasko)'),
  ('2026-2027', '2026-12-30', 'Rizal Day'),
  ('2026-2027', '2026-12-31', 'Last Day of the Year'),
  ('2026-2027', '2027-01-01', 'New Year''s Day (Bagong Taon)'),
  ('2026-2027', '2027-02-06', 'Chinese New Year'),
  ('2026-2027', '2027-02-25', 'EDSA People Power Revolution Anniversary'),
  ('2026-2027', '2027-03-25', 'Maundy Thursday (Huwebes Santo)'),
  ('2026-2027', '2027-03-26', 'Good Friday (Biyernes Santo)')
ON CONFLICT (school_year, holiday_date) DO UPDATE
  SET name = EXCLUDED.name;

-- 2. Fake Demo Class (SY 2026-2027)
INSERT INTO public.classes (id, name, school_year, starts_on, ends_on)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Grade 11 – Mabini (Demo)',
  '2026-2027',
  '2026-06-08',
  '2027-03-31'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Copy Holiday Templates into the Fake Demo Class
INSERT INTO public.holidays (class_id, holiday_date, name, source)
SELECT
  '11111111-1111-4111-8111-111111111111'::uuid,
  ht.holiday_date,
  ht.name,
  'template'
FROM public.holiday_templates ht
WHERE ht.school_year = '2026-2027'
ON CONFLICT (class_id, holiday_date) DO NOTHING;

-- 4. Fake Demo Users (Teacher + Secretary) & Memberships
INSERT INTO public.users (id, email, display_name, active)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'teacher.demo@example.edu.ph', 'Gng. Elena Santos (Demo)', true),
  ('22222222-2222-4222-8222-222222222202', 'secretary.demo@example.edu.ph', 'Juan Dela Cruz (Secretary Demo)', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.class_members (class_id, user_id, role)
VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222201', 'teacher'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222202', 'secretary')
ON CONFLICT (class_id, user_id) DO NOTHING;

-- 5. 10 Fake Demo Students (includes optional middle_initial 0-2 chars & suffix per Q2.6)
INSERT INTO public.students (
  id,
  class_id,
  last_name,
  first_name,
  middle_initial,
  suffix,
  link_token_hash
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    'Dela Cruz',
    'Juan',
    'A',
    NULL,
    encode(digest('demo-token-student-01-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    'Santos',
    'Maria Clara',
    'B',
    NULL,
    encode(digest('demo-token-student-02-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111111',
    'Reyes',
    'Jose Miguel',
    'C',
    'Jr.',
    encode(digest('demo-token-student-03-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    '11111111-1111-4111-8111-111111111111',
    'Bautista',
    'Angela Mae',
    NULL,
    NULL,
    encode(digest('demo-token-student-04-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    '11111111-1111-4111-8111-111111111111',
    'Mendoza',
    'Carlo Gabriel',
    'D',
    NULL,
    encode(digest('demo-token-student-05-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    '11111111-1111-4111-8111-111111111111',
    'Villanueva',
    'Sofia Lorraine',
    'E',
    NULL,
    encode(digest('demo-token-student-06-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333307',
    '11111111-1111-4111-8111-111111111111',
    'Ramos',
    'Mark Anthony',
    'Ma',
    NULL,
    encode(digest('demo-token-student-07-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333308',
    '11111111-1111-4111-8111-111111111111',
    'Aquino',
    'Bea Katrina',
    'F',
    NULL,
    encode(digest('demo-token-student-08-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333309',
    '11111111-1111-4111-8111-111111111111',
    'Garcia',
    'Rafael Luis',
    'G',
    'III',
    encode(digest('demo-token-student-09-pasok-2026', 'sha256'), 'hex')
  ),
  (
    '33333333-3333-4333-8333-333333333310',
    '11111111-1111-4111-8111-111111111111',
    'Flores',
    'Hannah Grace',
    'H',
    NULL,
    encode(digest('demo-token-student-10-pasok-2026', 'sha256'), 'hex')
  )
ON CONFLICT (id) DO NOTHING;
