-- Add shop_manager role
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Widen the role CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'shop_manager', 'dispatcher', 'mechanic', 'driver'));

-- 2. Allow shop_manager to insert/update/delete trucks (same as admin)
DROP POLICY IF EXISTS "trucks_admin" ON trucks;
CREATE POLICY "trucks_admin" ON trucks FOR ALL
  USING (my_role() IN ('admin', 'shop_manager'));

-- To assign shop_manager to a user (replace with real email):
-- UPDATE profiles SET role = 'shop_manager' WHERE email = 'manager@example.com';
