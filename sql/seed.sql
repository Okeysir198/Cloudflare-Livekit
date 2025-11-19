-- Seed data for LiveKit Voice Agent
-- Creates initial admin and demo users
--
-- Default passwords:
-- admin / admin123
-- demo / demo123
--
-- IMPORTANT: Change these passwords in production!
-- To generate new password hashes, run:
-- node -e "const bcrypt = require('bcrypt-edge'); bcrypt.hash('yourpassword', 10).then(console.log)"

INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  role,
  display_name,
  is_active,
  is_verified,
  max_conversations,
  max_messages_per_conversation,
  permissions
) VALUES
(
  'admin-001',
  'admin',
  'admin@example.com',
  '$2a$10$rKzWzF.nN5qFqXqL8jqGV.X8qH7J5oYFqXqL8jqGV.X8qH7J5oYFqe',
  'admin',
  'Administrator',
  1,
  1,
  -1,
  -1,
  '{"can_export": true, "can_delete_any": true, "can_view_all": true, "can_manage_users": true}'
),
(
  'demo-001',
  'demo',
  'demo@example.com',
  '$2a$10$rKzWzF.nN5qFqXqL8jqGV.X8qH7J5oYFqXqL8jqGV.X8qH7J5oYFqe',
  'demo',
  'Demo User',
  1,
  1,
  10,
  100,
  '{"can_export": false, "can_delete_any": false, "can_view_all": false, "can_manage_users": false}'
);

-- Note: The password hashes above are placeholders
-- You MUST generate real bcrypt hashes before deploying to production
--
-- To generate password hashes:
-- 1. Install bcrypt-edge: npm install bcrypt-edge
-- 2. Run: node scripts/generate-hash.js <password>
-- 3. Replace the password_hash values above
