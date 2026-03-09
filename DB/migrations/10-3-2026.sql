-- ================================
-- remove the auth_id column from staff table
-- ================================

-- Drop the old FK-based primary key constraint
ALTER TABLE staff 
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN id DROP DEFAULT; -- first remove to re-add properly

-- Actually the clean way:
ALTER TABLE staff
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add optional auth_id column
ALTER TABLE staff
  ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update the view to use auth_id for email lookup
DROP VIEW staff_with_email;
CREATE VIEW staff_with_email AS
SELECT
  s.id,
  s.auth_id,
  s.username,
  s.full_name,
  s.role,
  s.phone,
  s.avatar_url,
  s.is_active,
  s.created_at,
  s.updated_at,
  u.email
FROM staff s
LEFT JOIN auth.users u ON s.auth_id = u.id; -- LEFT JOIN since auth_id is optional