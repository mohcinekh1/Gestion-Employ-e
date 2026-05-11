-- Exécution manuelle dans phpMyAdmin si le bootstrap Spring n’a pas tourné avec le bon code.
-- Base : hr_manager — table : users

USE hr_manager;

-- 1) Rétablir le mot de passe « admin » → Admin123!
UPDATE users
SET password_hash = '$2a$10$K6/SnHCiC.lJHZOXSsdd6eCa3um8/Nj/DlZbXtHaRqj8Rm0s49aI6',
    email         = 'admin@hrmanager.local'
WHERE username = 'admin';

-- 2) Ajouter admin@gmail.com seulement s’il manque encore
INSERT INTO users (username, email, password_hash, role, enabled, employee_id, last_login_at, created_at)
SELECT
  'admin@gmail.com',
  'admin@gmail.com',
  '$2a$10$8XecUOnspnAjwT3rOKsaVuQExAtuOYhM5StYdkPc9DvaaNRE8kVxe',
  'ADMIN',
  1,
  NULL,
  NULL,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin@gmail.com');
