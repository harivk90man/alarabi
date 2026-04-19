-- ── 004: Replace technician list ────────────────────────────────────────────
-- Can't DELETE old technicians if issues reference them via assigned_to FK.
-- Instead deactivate them, then upsert the 6 correct ones.

-- Deactivate all old technician entries
UPDATE operators SET is_active = false WHERE role = 'technician';

-- Upsert correct technicians (insert or reactivate if id already exists)
INSERT INTO operators (id, name, role, is_active) VALUES
  ('493', 'Rey',     'technician', true),
  ('582', 'Anil',    'technician', true),
  ('624', 'Jilbert', 'technician', true),
  ('666', 'Abdulla', 'technician', true),
  ('237', 'Ever',    'technician', true),
  ('671', 'Douvan',  'technician', true)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  role      = 'technician',
  is_active = true;
