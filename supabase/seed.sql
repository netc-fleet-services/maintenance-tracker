-- ============================================================
-- NETC Fleet Maintenance Tracker — Seed Data (Development)
-- Run AFTER schema.sql.
-- ============================================================

-- LOCATIONS
INSERT INTO locations (id, name) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Dallas'),
  ('11111111-0000-0000-0000-000000000002', 'Houston'),
  ('11111111-0000-0000-0000-000000000003', 'San Antonio'),
  ('11111111-0000-0000-0000-000000000004', 'Austin'),
  ('11111111-0000-0000-0000-000000000005', 'Fort Worth');


-- TRUCKS
INSERT INTO trucks (id, unit_number, vin, location_id, current_status, active) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'T-101', '1NKWLB0X8FJ123401', '11111111-0000-0000-0000-000000000001', 'ready',  true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'T-102', '1NKWLB0X8FJ123402', '11111111-0000-0000-0000-000000000002', 'ready',  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'T-103', '1NKWLB0X8FJ123403', '11111111-0000-0000-0000-000000000001', 'ready',  true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'T-104', '1NKWLB0X8FJ123404', '11111111-0000-0000-0000-000000000003', 'issues', true),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'T-105', '1NKWLB0X8FJ123405', '11111111-0000-0000-0000-000000000004', 'issues', true),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'T-106', '1NKWLB0X8FJ123406', '11111111-0000-0000-0000-000000000002', 'oos',    true),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'T-107', '1NKWLB0X8FJ123407', '11111111-0000-0000-0000-000000000003', 'ready',  true),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'T-108', '1NKWLB0X8FJ123408', '11111111-0000-0000-0000-000000000004', 'ready',  true),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'T-109', '1NKWLB0X8FJ123409', '11111111-0000-0000-0000-000000000005', 'issues', true),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'T-110', '1NKWLB0X8FJ123410', '11111111-0000-0000-0000-000000000001', 'oos',    true);


-- TRUCK NOTES
INSERT INTO truck_notes (truck_id, note_type, body, created_by, created_at) VALUES
  -- T-104 (known issues)
  ('aaaaaaaa-0000-0000-0000-000000000004', 'driver',   'Brake warning light on, pedal feels soft', 'D. Adams', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'mechanic', 'Inspected — front brake pads at 10%, rotors scored. Ordered parts.', 'R. Johnson', now() - interval '2 days'),
  -- T-105 (known issues)
  ('aaaaaaaa-0000-0000-0000-000000000005', 'driver',   'Wheel lift operating slow, took about 3 minutes to raise', 'M. Torres', now() - interval '4 days'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'mechanic', 'Found hydraulic line leak at the main cylinder. Ordered replacement hose.', 'K. Williams', now() - interval '3 days'),
  -- T-106 (OOS)
  ('aaaaaaaa-0000-0000-0000-000000000006', 'driver',   'Truck would not start this morning, no crank', 'J. Brown', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'mechanic', 'Alternator failed, no charge reaching battery. Scheduled vendor pickup.', 'R. Johnson', now() - interval '1 day'),
  -- T-101 (last work)
  ('aaaaaaaa-0000-0000-0000-000000000001', 'work_done', 'PM service completed — oil, filters, belts, fluid check.', 'K. Williams', now() - interval '14 days'),
  -- T-102 (last work)
  ('aaaaaaaa-0000-0000-0000-000000000002', 'work_done', 'Oil change and multi-point inspection completed.', 'R. Johnson', now() - interval '18 days'),
  -- T-109 (known issues)
  ('aaaaaaaa-0000-0000-0000-000000000009', 'driver',   'Check engine light came on during morning run', 'S. Garcia', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'mechanic', 'Pulled codes — P0420 catalyst efficiency. Running diagnostic.', 'K. Williams', now() - interval '12 hours'),
  -- T-110 (OOS)
  ('aaaaaaaa-0000-0000-0000-000000000010', 'driver',   'Rear-end collision in the yard. Truck undriveable.', 'B. Martinez', now() - interval '5 days'),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'mechanic', 'Frame damage confirmed. Sent to collision center for assessment.', 'R. Johnson', now() - interval '4 days');


-- STATUS HISTORY
INSERT INTO status_history (truck_id, old_status, new_status, changed_by, comment, created_at) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000004', 'ready',  'issues', 'R. Johnson', 'Brake issue confirmed by mechanic', now() - interval '2 days'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'ready',  'issues', 'K. Williams', 'Hydraulic leak — needs part', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'ready',  'oos',    'R. Johnson', 'Alternator failure, vendor called', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'ready',  'issues', 'K. Williams', 'CEL — diagnostic in progress', now() - interval '12 hours'),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'ready',  'oos',    'R. Johnson', 'Accident damage, at body shop', now() - interval '4 days');


-- MAINTENANCE
INSERT INTO maintenance (truck_id, last_pm_date, last_pm_mileage, next_pm_date, next_pm_mileage) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-01-15', 148200, '2026-07-15', 163200),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2025-12-10', 201400, '2026-05-10', 216400),
  ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', 95600,  '2026-09-01', 110600),
  ('aaaaaaaa-0000-0000-0000-000000000004', '2025-11-20', 178300, '2026-04-18', 193300),
  ('aaaaaaaa-0000-0000-0000-000000000005', '2026-02-14', 132100, '2026-06-01', 147100),
  ('aaaaaaaa-0000-0000-0000-000000000006', '2025-12-01', 220500, '2026-05-15', 235500),
  ('aaaaaaaa-0000-0000-0000-000000000007', '2026-02-20', 88400,  '2026-08-20', 103400),
  ('aaaaaaaa-0000-0000-0000-000000000008', '2026-01-05', 165700, '2026-05-05', 180700),
  ('aaaaaaaa-0000-0000-0000-000000000009', '2026-01-22', 244100, '2026-07-10', 259100),
  ('aaaaaaaa-0000-0000-0000-000000000010', '2026-02-28', 310200, '2026-08-01', 325200);
