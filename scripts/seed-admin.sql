-- =============================================================================
-- SEED FIRST ADMIN USER
-- =============================================================================
-- 
-- STEPS:
-- 1. Go to your app's login page and sign up is NOT available (by design).
--    Instead, create a user via the Supabase Dashboard:
--      Authentication > Users > Add User > Enter your email and a password
--
-- 2. Then run this SQL in Supabase SQL Editor (replace the email below):
--
-- =============================================================================

INSERT INTO admin_profiles (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'),
  'YOUR_EMAIL_HERE',
  'YOUR_NAME_HERE',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
