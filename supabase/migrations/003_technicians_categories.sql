-- ── 003: Technicians, Maintenance Categories, Severity ─────────────────────

-- 1. Maintenance work-order categories
CREATE TABLE IF NOT EXISTS maintenance_categories (
  code        VARCHAR(3) PRIMARY KEY,
  description TEXT NOT NULL,
  discipline  VARCHAR(20) NOT NULL DEFAULT 'general'
    CHECK (discipline IN ('mechanical','electrical','pneumatic','hydraulic','facilities','general'))
);

-- 2. Add severity + category to issues
ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS severity VARCHAR(10) DEFAULT 'minor'
    CHECK (severity IN ('minor', 'major', 'severe')),
  ADD COLUMN IF NOT EXISTS maintenance_category_code VARCHAR(3)
    REFERENCES maintenance_categories(code) ON DELETE SET NULL;

-- 3. Seed maintenance categories
INSERT INTO maintenance_categories (code, description, discipline) VALUES
  ('00', 'Routine machine preventative maintenance check',              'mechanical'),
  ('01', 'Machine preventive maintenance check & lubrication',          'mechanical'),
  ('02', 'Schedule machine full preventive maintenance',                'mechanical'),
  ('03', 'Machine preventive maintenance unscheduled',                  'mechanical'),
  ('11', 'Minor machine mechanical adjustment',                         'mechanical'),
  ('12', 'Minor machines mechanical repair',                            'mechanical'),
  ('13', 'Mechanical machine repair',                                   'mechanical'),
  ('14', 'Machine minor breakdown mechanical repair',                   'mechanical'),
  ('15', 'Machine major breakdown and mechanical repair',               'mechanical'),
  ('16', 'Machine extended breakdown and mechanical repair',            'mechanical'),
  ('17', 'Mechanical fabrication and installation work',                'mechanical'),
  ('18', 'Mechanical routine maintenance and Dia clean',                'mechanical'),
  ('19', 'Machine breakdown – machine shop parts repair & fabrication', 'mechanical'),
  ('20', 'Electrical check and testing',                                'electrical'),
  ('21', 'Minor machine electrical adjustment or fault reset',          'electrical'),
  ('22', 'Minor electrical repair',                                     'electrical'),
  ('23', 'Machine electrical repair',                                   'electrical'),
  ('24', 'Machine minor breakdown electrical repair',                   'electrical'),
  ('25', 'Machine extended breakdown & electrical repair',              'electrical'),
  ('26', 'Corona treatment repair',                                     'electrical'),
  ('27', 'Heating system repair',                                       'electrical'),
  ('28', 'Office general electrical work & maintenance',                'electrical'),
  ('30', 'Machine pneumatic check and test',                            'pneumatic'),
  ('31', 'Minor machine pneumatic check and adjustment',                'pneumatic'),
  ('32', 'Minor pneumatic repair',                                      'pneumatic'),
  ('33', 'Major machine pneumatic repair',                              'pneumatic'),
  ('34', 'Machine pneumatic breakdown & repair',                        'pneumatic'),
  ('35', 'Machine pneumatic extended breakdown & repair',               'pneumatic'),
  ('36', 'Routine Teflon change',                                       'pneumatic'),
  ('41', 'Minor hydraulic adjustment',                                  'hydraulic'),
  ('42', 'Minor hydraulics repair',                                     'hydraulic'),
  ('43', 'Major hydraulic repair',                                      'hydraulic'),
  ('44', 'Machine hydraulic breakdown & repair',                        'hydraulic'),
  ('45', 'Machine extended hydraulic breakdown & repair',               'hydraulic'),
  ('46', 'Compressor general maintenance',                              'hydraulic'),
  ('50', 'Personnel accommodation electrical repair',                   'facilities'),
  ('51', 'Personnel accommodation A/C repair and maintenance',          'facilities'),
  ('52', 'Personnel accommodation plumbing maintenance',                'facilities')
ON CONFLICT (code) DO NOTHING;

-- 4. Add technicians (upsert by id)
INSERT INTO operators (id, name, role, is_active) VALUES
  ('91',  'Sanjeewa',  'technician', true),
  ('31',  'Sunimal',   'technician', true),
  ('220', 'Hassan',    'technician', true),
  ('328', 'Karthik',   'technician', true),
  ('432', 'Kamran',    'technician', true),
  ('435', 'Jamil',     'technician', true),
  ('451', 'Masoud',    'technician', true),
  ('478', 'Rajith',    'technician', true),
  ('479', 'Ashanul',   'technician', true),
  ('495', 'Romel',     'technician', true),
  ('501', 'Lasantha',  'technician', true),
  ('502', 'Eric',      'technician', true),
  ('522', 'Fernando',  'technician', true),
  ('607', 'Feliciano', 'technician', true),
  ('631', 'Priyantha', 'technician', true),
  ('641', 'Jaime',     'technician', true),
  ('645', 'Tharaka',   'technician', true),
  ('692', 'Renato',    'technician', true)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  role      = 'technician',
  is_active = true;
