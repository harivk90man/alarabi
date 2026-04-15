-- Al Arabi Plastic Factory — Maintenance Tracker
-- Migration 001: Schema, Triggers, RLS

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT,
  category_id UUID REFERENCES categories(id),
  manufacturer TEXT,
  status TEXT DEFAULT 'Running' CHECK (status IN ('Running', 'Down', 'Maintenance', 'Minor Issue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator' CHECK (role IN ('operator', 'admin', 'technician')),
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number TEXT NOT NULL UNIQUE,
  machine_id TEXT REFERENCES machines(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breakdown', 'minor', 'preventive')),
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL
    END
  ) STORED,
  downtime BOOLEAN DEFAULT false,
  reported_by TEXT REFERENCES operators(id),
  assigned_to TEXT REFERENCES operators(id),
  resolution TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issue_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT REFERENCES operators(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate issue number
CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM issues;
  NEW.issue_number := 'ISS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_issue_number ON issues;
CREATE TRIGGER trigger_issue_number
BEFORE INSERT ON issues
FOR EACH ROW EXECUTE FUNCTION generate_issue_number();

-- Auto-update machine status based on open issues
CREATE OR REPLACE FUNCTION update_machine_status()
RETURNS TRIGGER AS $$
DECLARE
  target_machine_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_machine_id := OLD.machine_id;
  ELSE
    target_machine_id := NEW.machine_id;
  END IF;

  UPDATE machines SET status = (
    CASE
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = target_machine_id AND status != 'resolved' AND type = 'breakdown') THEN 'Down'
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = target_machine_id AND status != 'resolved' AND type = 'preventive') THEN 'Maintenance'
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = target_machine_id AND status != 'resolved' AND type = 'minor') THEN 'Minor Issue'
      ELSE 'Running'
    END
  ), updated_at = now()
  WHERE id = target_machine_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_machine_status ON issues;
CREATE TRIGGER trigger_update_machine_status
AFTER INSERT OR UPDATE OR DELETE ON issues
FOR EACH ROW EXECUTE FUNCTION update_machine_status();

-- Auto-deduct spare parts when used
CREATE OR REPLACE FUNCTION deduct_spare_parts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spare_parts
  SET quantity = GREATEST(0, quantity - NEW.quantity_used),
      updated_at = now()
  WHERE id = NEW.part_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_parts ON issue_parts;
CREATE TRIGGER trigger_deduct_parts
AFTER INSERT ON issue_parts
FOR EACH ROW EXECUTE FUNCTION deduct_spare_parts();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_machines_updated_at ON machines;
CREATE TRIGGER trigger_machines_updated_at
BEFORE UPDATE ON machines
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_issues_updated_at ON issues;
CREATE TRIGGER trigger_issues_updated_at
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- NOTE: Since we're using badge-ID-based login (not Supabase Auth),
-- we use anon key with service role for DB access.
-- RLS is permissive for anon role (app handles auth in code).
-- For production, switch to Supabase Auth JWT-based policies.

CREATE POLICY "allow_all_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_machines" ON machines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operators" ON operators FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_issues" ON issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_spare_parts" ON spare_parts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_issue_parts" ON issue_parts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_log" ON audit_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
