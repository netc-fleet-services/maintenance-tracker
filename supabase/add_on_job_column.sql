ALTER TABLE trucks ADD COLUMN IF NOT EXISTS on_job boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);
