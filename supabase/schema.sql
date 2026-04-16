-- ============================================================
-- NETC Fleet Maintenance Tracker — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);


-- ============================================================
-- PROFILES (extends auth.users with role + display name)
-- ============================================================
CREATE TABLE profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role  text NOT NULL DEFAULT 'driver'
          CHECK (role IN ('admin', 'dispatcher', 'mechanic', 'driver'))
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'driver');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- TRUCKS
-- ============================================================
CREATE TABLE trucks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number    text UNIQUE NOT NULL,
  vin            text UNIQUE,               -- nullable; fill in from VIN data source later
  category       text CHECK (category IN ('hd_tow', 'ld_tow', 'roadside', 'transport', 'trailer')),
  location_id    uuid REFERENCES locations(id),
  current_status text NOT NULL DEFAULT 'ready'
                   CHECK (current_status IN ('ready', 'issues', 'oos')),
  waiting_on     text,                      -- filled when issues/oos
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trucks_status   ON trucks (current_status);
CREATE INDEX idx_trucks_location ON trucks (location_id);
CREATE INDEX idx_trucks_active   ON trucks (active);


-- ============================================================
-- TRUCK NOTES
-- ============================================================
CREATE TABLE truck_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id   uuid NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  note_type  text NOT NULL CHECK (note_type IN ('driver', 'mechanic', 'work_done')),
  body       text NOT NULL,
  created_by text NOT NULL,               -- display name at time of entry
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_truck ON truck_notes (truck_id, created_at DESC);


-- ============================================================
-- STATUS HISTORY  (audit trail)
-- ============================================================
CREATE TABLE status_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id   uuid NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_truck ON status_history (truck_id, created_at DESC);


-- ============================================================
-- MAINTENANCE
-- ============================================================
CREATE TABLE maintenance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id         uuid UNIQUE NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  last_pm_date     date,
  last_pm_mileage  integer,
  next_pm_date     date,
  next_pm_mileage  integer,
  updated_at       timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- NOTIFICATION SETTINGS
-- ============================================================
CREATE TABLE notification_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_type text UNIQUE NOT NULL CHECK (status_type IN ('ready', 'issues', 'oos')),
  emails      text[] NOT NULL DEFAULT '{}'
);

-- Seed default rows (one per status type)
INSERT INTO notification_settings (status_type, emails) VALUES
  ('ready',  '{}'),
  ('issues', '{}'),
  ('oos',    '{}');


-- ============================================================
-- RPC: change_truck_status
-- Atomically updates the truck status and writes history row.
-- ============================================================
CREATE OR REPLACE FUNCTION change_truck_status(
  p_truck_id   uuid,
  p_new_status text,
  p_comment    text DEFAULT NULL,
  p_waiting_on text DEFAULT NULL,
  p_changed_by text DEFAULT 'Unknown'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_status text;
BEGIN
  SELECT current_status INTO v_old_status FROM trucks WHERE id = p_truck_id;

  UPDATE trucks
  SET current_status = p_new_status,
      waiting_on     = p_waiting_on
  WHERE id = p_truck_id;

  INSERT INTO status_history (truck_id, old_status, new_status, changed_by, comment)
  VALUES (p_truck_id, v_old_status, p_new_status, p_changed_by, p_comment);
END;
$$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Helper: get the calling user's role
CREATE OR REPLACE FUNCTION my_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- LOCATIONS — all authenticated users can read; only admin can modify
CREATE POLICY "locations_read"   ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "locations_admin"  ON locations FOR ALL    USING (my_role() = 'admin');

-- PROFILES — users can read all; only read own profile for updates
CREATE POLICY "profiles_read"    ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_own"     ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin"   ON profiles FOR ALL    USING (my_role() = 'admin');

-- TRUCKS — authenticated users can read; admin can insert/delete; dispatchers+mechanics can update status
CREATE POLICY "trucks_read"      ON trucks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "trucks_admin"     ON trucks FOR ALL    USING (my_role() = 'admin');
CREATE POLICY "trucks_update_ops" ON trucks FOR UPDATE USING (my_role() IN ('dispatcher', 'mechanic'));

-- TRUCK NOTES — all authenticated can read; drivers insert driver notes; mechanics+ insert any
CREATE POLICY "notes_read"       ON truck_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "notes_driver"     ON truck_notes FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND note_type = 'driver' AND my_role() = 'driver'
);
CREATE POLICY "notes_ops"        ON truck_notes FOR INSERT WITH CHECK (
  my_role() IN ('admin', 'dispatcher', 'mechanic')
);

-- STATUS HISTORY — all authenticated can read; only the RPC writes (SECURITY DEFINER)
CREATE POLICY "history_read"     ON status_history FOR SELECT USING (auth.role() = 'authenticated');

-- MAINTENANCE — all authenticated can read; admin + dispatcher + mechanic can modify
CREATE POLICY "maint_read"       ON maintenance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "maint_ops"        ON maintenance FOR ALL USING (my_role() IN ('admin', 'dispatcher', 'mechanic'));

-- NOTIFICATION SETTINGS — only admin
CREATE POLICY "notif_admin"      ON notification_settings FOR ALL USING (my_role() = 'admin');
