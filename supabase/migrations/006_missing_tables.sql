-- ============================================================================
-- 006_missing_tables.sql
-- Creates all tables expected by the API and scraper that were never defined.
-- The API/scraper code uses NON-suffixed names (colleges, cutoffs, seat_matrix)
-- while earlier migrations only created _v2 suffixed tables.
-- ============================================================================

-- ── colleges (what API + scraper actually query) ─────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  short_name      TEXT,
  college_code    TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT NOT NULL DEFAULT 'INDIA',
  college_type    TEXT NOT NULL DEFAULT 'Government',
  course          TEXT DEFAULT 'MBBS',
  source          TEXT DEFAULT 'manual',
  website         TEXT,
  email           TEXT,
  phone           TEXT,
  hospital_name   TEXT,
  hospital_beds   INTEGER,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_type ON colleges(college_type);
CREATE INDEX IF NOT EXISTS idx_colleges_country ON colleges(country);
CREATE INDEX IF NOT EXISTS idx_colleges_course ON colleges(course);

-- ── cutoffs (what API + scraper actually query) ──────────────────────────────
CREATE TABLE IF NOT EXISTS cutoffs (
  id                BIGSERIAL PRIMARY KEY,
  college_name      TEXT NOT NULL,
  state             TEXT,
  category          TEXT DEFAULT 'General',
  aiq_rank          INTEGER,
  aiq_score         NUMERIC(6,2),
  state_rank_range  TEXT,
  state_score_range TEXT,
  year              INTEGER NOT NULL DEFAULT 2024,
  round_name        TEXT,
  body_code         TEXT,
  quota_code        TEXT,
  course_name       TEXT DEFAULT 'MBBS',
  source            TEXT DEFAULT 'manual',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cutoffs_college ON cutoffs(college_name);
CREATE INDEX IF NOT EXISTS idx_cutoffs_state ON cutoffs(state);
CREATE INDEX IF NOT EXISTS idx_cutoffs_year ON cutoffs(year);
CREATE INDEX IF NOT EXISTS idx_cutoffs_category ON cutoffs(category);

-- ── seat_matrix (what API + scraper actually query) ──────────────────────────
CREATE TABLE IF NOT EXISTS seat_matrix (
  id              BIGSERIAL PRIMARY KEY,
  college_name    TEXT NOT NULL,
  state           TEXT,
  college_kind    TEXT,
  total_seats     INTEGER DEFAULT 0,
  all_india       INTEGER,
  goi             INTEGER,
  remaining_seats INTEGER,
  pwd             INTEGER,
  sainik          INTEGER,
  ff              INTEGER,
  gs              INTEGER,
  open_seats      INTEGER,
  nri_seats       INTEGER,
  year            INTEGER NOT NULL DEFAULT 2024,
  source          TEXT DEFAULT 'manual',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seat_matrix_college ON seat_matrix(college_name);
CREATE INDEX IF NOT EXISTS idx_seat_matrix_state ON seat_matrix(state);
CREATE INDEX IF NOT EXISTS idx_seat_matrix_year ON seat_matrix(year);

-- ── applications (counselling tracks per user) ───────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'Draft',
  external_id     TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);

-- ── saved_colleges (user bookmarks) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_colleges (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL,
  college_id      BIGINT REFERENCES colleges(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_unique ON saved_colleges(user_id, college_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_colleges(user_id);

-- ── profiles (user profile data) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY,
  full_name       TEXT,
  phone           TEXT,
  email           TEXT,
  avatar_url      TEXT,
  neet_rank       INTEGER,
  neet_score      NUMERIC(6,2),
  category        TEXT DEFAULT 'General',
  state           TEXT,
  package_id      TEXT,
  role            TEXT DEFAULT 'student',
  referral_code   TEXT,
  referred_by     TEXT,
  onboarding_done BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── notifications (user notifications) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL,
  title           TEXT NOT NULL DEFAULT '',
  body            TEXT DEFAULT '',
  type            TEXT DEFAULT 'info',
  read            BOOLEAN DEFAULT false,
  data            JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ── user_documents (uploaded files) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL,
  doc_type        TEXT NOT NULL DEFAULT 'other',
  file_name       TEXT,
  file_url        TEXT,
  status          TEXT DEFAULT 'Pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_docs_user ON user_documents(user_id);

-- ── packages (counselling packages for display) ─────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  price           NUMERIC(10,2) DEFAULT 0,
  price_label     TEXT DEFAULT '₹0',
  description     TEXT,
  features        JSONB,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── state_competition (competition map data per state) ──────────────────────
CREATE TABLE IF NOT EXISTS state_competition (
  id                    BIGSERIAL PRIMARY KEY,
  state_key             TEXT NOT NULL,
  state_name            TEXT NOT NULL,
  competition_score     NUMERIC(5,1) NOT NULL DEFAULT 50,
  difficulty            TEXT DEFAULT 'Moderate',
  total_colleges        INTEGER DEFAULT 0,
  govt_colleges         INTEGER DEFAULT 0,
  private_colleges      INTEGER DEFAULT 0,
  total_seats           INTEGER DEFAULT 0,
  aiq_seats             INTEGER DEFAULT 0,
  state_quota_seats     INTEGER DEFAULT 0,
  avg_closing_rank      INTEGER,
  avg_cutoff            NUMERIC(6,2),
  admission_probability NUMERIC(4,3),
  demand_index          NUMERIC(5,1),
  supply_index          NUMERIC(5,1),
  insight               TEXT,
  top_colleges          JSONB,
  cutoff_trend          JSONB,
  seat_split            JSONB,
  year                  INTEGER NOT NULL DEFAULT 2024,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_comp_year ON state_competition(year);
CREATE INDEX IF NOT EXISTS idx_state_comp_score ON state_competition(competition_score);

-- ── Seed state_competition with all Indian states & UTs ─────────────────────
INSERT INTO state_competition (state_key, state_name, competition_score, difficulty, total_colleges, govt_colleges, private_colleges, total_seats, aiq_seats, state_quota_seats, avg_closing_rank, avg_cutoff, year) VALUES
  ('ANDHRA_PRADESH',       'Andhra Pradesh',       72.5, 'High',       34,  11,  23,  6200,   930,  4340,  38000, 540, 2024),
  ('ARUNACHAL_PRADESH',    'Arunachal Pradesh',     28.0, 'Low',         1,   1,   0,   100,    15,    85, 350000, 280, 2024),
  ('ASSAM',                'Assam',                 55.0, 'Moderate',    7,   6,   1,   950,   143,   665, 120000, 420, 2024),
  ('BIHAR',                'Bihar',                 68.0, 'High',       16,  10,   6,  2150,   323,  1505,  55000, 510, 2024),
  ('CHHATTISGARH',         'Chhattisgarh',          52.0, 'Moderate',    8,   5,   3,   950,   143,   665, 130000, 400, 2024),
  ('GOA',                  'Goa',                   45.0, 'Moderate',    2,   1,   1,   290,    44,   203, 160000, 380, 2024),
  ('GUJARAT',              'Gujarat',               75.0, 'High',       32,  17,  15,  5300,   795,  3710,  35000, 550, 2024),
  ('HARYANA',              'Haryana',               70.0, 'High',       12,   4,   8,  1700,   255,  1190,  42000, 530, 2024),
  ('HIMACHAL_PRADESH',     'Himachal Pradesh',      48.0, 'Moderate',    5,   4,   1,   600,    90,   420, 150000, 390, 2024),
  ('JHARKHAND',            'Jharkhand',             58.0, 'Moderate',    7,   4,   3,   800,   120,   560, 100000, 440, 2024),
  ('KARNATAKA',            'Karnataka',             88.0, 'Extreme',    60,  19,  41, 10200,  1530,  7140,  12000, 620, 2024),
  ('KERALA',               'Kerala',                78.0, 'Very High',  33,  10,  23,  4300,   645,  3010,  25000, 570, 2024),
  ('MADHYA_PRADESH',       'Madhya Pradesh',        73.0, 'High',       22,  13,   9,  3100,   465,  2170,  36000, 545, 2024),
  ('MAHARASHTRA',          'Maharashtra',           85.0, 'Very High',  55,  22,  33,  8500,  1275,  5950,  15000, 600, 2024),
  ('MANIPUR',              'Manipur',               30.0, 'Low',         2,   2,   0,   250,    38,   175, 320000, 290, 2024),
  ('MEGHALAYA',            'Meghalaya',             32.0, 'Low',         1,   1,   0,   100,    15,    70, 300000, 300, 2024),
  ('MIZORAM',              'Mizoram',               25.0, 'Low',         1,   1,   0,   100,    15,    70, 380000, 260, 2024),
  ('NAGALAND',             'Nagaland',              27.0, 'Low',         1,   1,   0,   100,    15,    70, 360000, 270, 2024),
  ('ODISHA',               'Odisha',                62.0, 'High',       11,   5,   6,  1550,   233,  1085,  75000, 470, 2024),
  ('PUNJAB',               'Punjab',                65.0, 'High',       11,   4,   7,  1400,   210,   980,  65000, 490, 2024),
  ('RAJASTHAN',            'Rajasthan',             80.0, 'Very High',  25,  14,  11,  3800,   570,  2660,  22000, 580, 2024),
  ('SIKKIM',               'Sikkim',                30.0, 'Low',         1,   1,   0,   100,    15,    70, 330000, 285, 2024),
  ('TAMIL_NADU',           'Tamil Nadu',            90.0, 'Extreme',    72,  28,  44, 12500,  1875,  8750,  10000, 630, 2024),
  ('TELANGANA',            'Telangana',             82.0, 'Very High',  38,  10,  28,  6500,   975,  4550,  18000, 590, 2024),
  ('TRIPURA',              'Tripura',               35.0, 'Low',         2,   2,   0,   200,    30,   140, 280000, 310, 2024),
  ('UTTAR_PRADESH',        'Uttar Pradesh',         92.0, 'Extreme',    65,  30,  35, 11000,  1650,  7700,   8000, 640, 2024),
  ('UTTARAKHAND',          'Uttarakhand',           55.0, 'Moderate',    6,   4,   2,   750,   113,   525, 115000, 425, 2024),
  ('WEST_BENGAL',          'West Bengal',           70.0, 'High',       21,  12,   9,  2800,   420,  1960,  45000, 520, 2024),
  ('ANDAMAN_AND_NICOBAR',  'Andaman & Nicobar',     20.0, 'Low',         1,   1,   0,   100,    15,    70, 400000, 250, 2024),
  ('CHANDIGARH',           'Chandigarh',            60.0, 'High',        2,   2,   0,   250,    38,   175, 85000,  450, 2024),
  ('DADRA_AND_NAGAR_HAVELI','Dadra & Nagar Haveli', 22.0, 'Low',         0,   0,   0,     0,     0,     0, NULL,   NULL, 2024),
  ('DELHI',                'Delhi',                 85.0, 'Very High',  10,   7,   3,  1500,   225,  1050,  16000, 605, 2024),
  ('JAMMU_AND_KASHMIR',    'Jammu & Kashmir',       50.0, 'Moderate',    5,   4,   1,   600,    90,   420, 140000, 395, 2024),
  ('LADAKH',               'Ladakh',                20.0, 'Low',         0,   0,   0,     0,     0,     0, NULL,   NULL, 2024),
  ('LAKSHADWEEP',          'Lakshadweep',           20.0, 'Low',         0,   0,   0,     0,     0,     0, NULL,   NULL, 2024),
  ('PUDUCHERRY',           'Puducherry',            65.0, 'High',        8,   3,   5,  1350,   203,   945,  60000, 495, 2024)
ON CONFLICT DO NOTHING;

-- ── Row-Level Security (RLS) policies ───────────────────────────────────────
-- Enable RLS on user-specific tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Public read on reference tables
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_competition ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT on reference data tables
DROP POLICY IF EXISTS "Public read colleges" ON colleges;
CREATE POLICY "Public read colleges" ON colleges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read cutoffs" ON cutoffs;
CREATE POLICY "Public read cutoffs" ON cutoffs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read seat_matrix" ON seat_matrix;
CREATE POLICY "Public read seat_matrix" ON seat_matrix FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read state_competition" ON state_competition;
CREATE POLICY "Public read state_competition" ON state_competition FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read packages" ON packages;
CREATE POLICY "Public read packages" ON packages FOR SELECT USING (true);

-- Allow service role full access on all tables (for scraper and API)
DROP POLICY IF EXISTS "Service full access colleges" ON colleges;
CREATE POLICY "Service full access colleges" ON colleges FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service full access cutoffs" ON cutoffs;
CREATE POLICY "Service full access cutoffs" ON cutoffs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service full access seat_matrix" ON seat_matrix;
CREATE POLICY "Service full access seat_matrix" ON seat_matrix FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service full access state_competition" ON state_competition;
CREATE POLICY "Service full access state_competition" ON state_competition FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service full access packages" ON packages;
CREATE POLICY "Service full access packages" ON packages FOR ALL USING (true) WITH CHECK (true);

-- User-specific table policies  
DROP POLICY IF EXISTS "Users manage own applications" ON applications;
CREATE POLICY "Users manage own applications" ON applications FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own saved" ON saved_colleges;
CREATE POLICY "Users manage own saved" ON saved_colleges FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own documents" ON user_documents;
CREATE POLICY "Users manage own documents" ON user_documents FOR ALL USING (true) WITH CHECK (true);

-- ── Seed default packages ───────────────────────────────────────────────────
INSERT INTO packages (name, slug, price, price_label, description, sort_order) VALUES
  ('Free Plan', 'free', 0, 'Free', 'Basic access to college finder and seat matrix', 1),
  ('NEET UG Counselling', 'neet-ug', 900, '₹900', 'Full NEET UG counselling support with rank predictor and expert guidance', 2),
  ('NEET PG Counselling', 'neet-pg', 6999, '₹6,999', 'Complete PG counselling with speciality-wise analysis', 3),
  ('Premium Bundle', 'premium', 1100, '₹1,100', 'All-in-one package: UG + PG counselling, priority support, document review', 4)
ON CONFLICT (slug) DO NOTHING;
