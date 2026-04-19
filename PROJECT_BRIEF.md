# Al Arabi Plastic Factory — Maintenance Tracker

## PROJECT BRIEF v2 (current production state)

**Company:** Al Arabi Plastic Factory (المصنع العربي للبلاستيك)
**Location:** Sabhan Industrial, Block 8, St 105, Bldg 170, Kuwait
**Website:** arabiplastic.com
**Logo URL:** <https://img1.wsimg.com/isteam/ip/c1812088-d5b4-4d7c-b39c-afa691bded3c/White%404x.png>
**Parent:** AlKhudairi Group · Est. 1983
**Phone:** +965 2439 0000 · **Email:** info@arabiplastic.com

> This is the authoritative brief for the system as it exists today in production.
> See `CHANGELOG.md` for what changed since the original v1 brief.

---

## 1. WHAT IT IS

A production-grade maintenance tracking system for Al Arabi Plastic Factory, managing **141 machines across 14 categories** and **109 operators + technicians + admin**. Supervisor Viswanathan (badge 203) has full visibility; 6 technicians handle resolution; operators log and monitor.

### Tech Stack (as deployed)

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript 5
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Database:** Supabase (PostgreSQL + Realtime + RLS)
- **Charts:** Recharts
- **PDF export:** jsPDF (branded reports)
- **PWA:** Installable on phones (manifest + service worker)
- **Deployment:** Vercel (web) + GitHub (source)
- **Auth:** Badge ID login (no passwords — operator enters their factory badge number)

### Features confirmed live in production

- **Bilingual** — English + Arabic with full RTL support
- **Dark mode** — CSS variable-based theming
- **Realtime subscriptions** — KPI cards and sidebar badges update live via Supabase channels
- **PDF export** — Branded report downloads
- **CSV export** — All report tables

### Brand

| Element | Value |
|---|---|
| Primary Navy | `#0a2540` (deep navy — main header, sidebar) |
| Primary 600 | `#12315a` (slightly lighter navy) |
| Accent Blue | `#1d4ed8` (royal blue — primary CTAs, links) |
| Accent Hover | `#1e40af` (CTA hover) |
| Success | `#16a34a` |
| Error | `#dc2626` |
| Warning | `#b45309` |
| Info | `#1d4ed8` |
| Background | `#fafaf8` (warm off-white) |
| Surface | `#ffffff` |
| Text | `#1a1a18` |
| Font | IBM Plex Sans + IBM Plex Mono (for IDs/timestamps) |
| Logo | Hosted locally at `/public/logo.png` (white version from arabiplastic.com) |

### User Theme Preferences

Users can customize their view via the theme picker (header icon or Settings page):

- **Mode:** Light or Dark
- **Accent:** Navy (default/corporate), Blue, Green, Purple, Rose, Orange

Stored in browser `localStorage` per device. Corporate default (Navy) applies to
new users and anonymous sessions. Semantic colors (success green, error red,
warning amber) are accent-independent and never change.

### Motion

Four subtle animations communicate state, never decorate:

1. **Live pulse** — 6px green dot next to realtime-backed KPIs (Running/Down/Open Issues) on the dashboard. Breathes 2s infinite.
2. **Status flick** — machine status badge scales once (1 -> 1.08 -> 1) when status changes via realtime. Fires only on state change.
3. **Nav slide** — sidebar active indicator (2px left border) slides in on route change. 250ms.
4. **Page fade-up** — content fades in from 8px offset on every route change. 350ms.

All four respect `prefers-reduced-motion`.

Login screen uses an animated line-art factory scene (extruder + flexo printer silhouettes) that draws itself in on load, with two slowly rising "film bubble" loops for ambience.

**Currency:** KWD (Kuwaiti Dinar) throughout — spare parts values, cost reporting.

---

## 2. ROLES & ACCESS

Three roles: `admin`, `technician`, `operator`. Defined in `operators.role` with `CHECK (role IN ('operator', 'admin', 'technician'))`. Access enforced via Supabase RLS policies.

| Capability | Operator (90) | Technician (6) | Admin (1) |
|---|:-:|:-:|:-:|
| Dashboard | ✓ | ✓ | ✓ |
| Machines (view) | ✓ | ✓ | ✓ |
| Log new issue | ✓ | ✓ | ✓ |
| Resolve issue | — | ✓ | ✓ |
| Consume spare parts on an issue | — | ✓ | ✓ |
| Assign issue to someone | — | — | ✓ |
| Spares inventory (manage) | — | — | ✓ |
| Reports | — | — | ✓ |
| Operators page | — | — | ✓ |
| Audit Log | — | — | ✓ |
| Edit machines / add operators | — | — | ✓ |

**Admin:** Viswanathan (badge `203`)

**Active technicians (6):**

| Badge | Name |
|---|---|
| 237 | EVER |
| 493 | REY |
| 582 | ANIL |
| 624 JILBERT |
| 666 | ABDULLA |
| 671 | DOUVAN |

**Operators (90 active):** All remaining badges with `role = 'operator' AND is_active = true`. See full list in `supabase/migrations/002_seed.sql`.

**Inactive (12):** Technicians added by mistake and soft-deleted via `is_active = false`. They still exist in the DB for referential integrity (past issues they were assigned to), but they can't log in and don't appear in dropdowns. Do not hard-delete.

---

## 3. DATABASE SCHEMA (Supabase PostgreSQL)

### Tables (9)

#### categories
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL UNIQUE,        -- Ex, FP, CS, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### machines
```sql
CREATE TABLE machines (
  id TEXT PRIMARY KEY,                 -- Ex01, FP03, CS12, etc.
  name TEXT NOT NULL,
  model TEXT,
  category_id UUID REFERENCES categories(id),
  manufacturer TEXT,
  status TEXT DEFAULT 'Running'
    CHECK (status IN ('Running', 'Down', 'Maintenance', 'Minor Issue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### operators
```sql
CREATE TABLE operators (
  id TEXT PRIMARY KEY,                 -- Factory badge number
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator'
    CHECK (role IN ('operator', 'admin', 'technician')),
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,      -- false = soft-deleted
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### maintenance_categories
Added after v1. Holds the 52 maintenance category codes used to classify issues (e.g., mechanical failure, electrical fault, PM schedule, etc.). Referenced by `issues.maintenance_category_id`.

```sql
CREATE TABLE maintenance_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### issues
```sql
CREATE TABLE issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number TEXT NOT NULL UNIQUE,   -- ISS-0001, auto-generated
  machine_id TEXT REFERENCES machines(id) NOT NULL,
  maintenance_category_id UUID REFERENCES maintenance_categories(id),
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
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### spare_parts  (updated schema)
```sql
CREATE TABLE spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,    -- Format: S-XX-XXX (e.g., S-10-001)
  name TEXT NOT NULL,                  -- Short display name (≤100 chars)
  description TEXT,                    -- Full description from source inventory
  category TEXT,                       -- Electrical | Mechanical | Pneumatic | Sensor | Consumable
  stock_category TEXT,                 -- Fine-grained (73 values) e.g. "Bearings", "Timing/Teeth Belts"
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,   -- KWD
  unit TEXT DEFAULT 'PIECE',           -- PIECE | MTR | SET | PACKET | CARTON | ROLL | DRUM | KG | GRM
  location TEXT,                       -- Storage location
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_spare_parts_category ON spare_parts(category);
CREATE INDEX idx_spare_parts_stock_category ON spare_parts(stock_category);
CREATE INDEX idx_spare_parts_part_number ON spare_parts(part_number);
```

#### issue_parts (junction)
```sql
CREATE TABLE issue_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### audit_log
```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT REFERENCES operators(id),
  action TEXT NOT NULL,                -- ISSUE_CREATED, ISSUE_RESOLVED, PART_USED, etc.
  entity_type TEXT,                    -- issue, machine, spare_part, operator
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Triggers (unchanged from v1)

- **`update_machine_status`** — auto-derives `machines.status` from open issues on that machine (breakdown → Down, preventive → Maintenance, minor → Minor Issue, none → Running)
- **`deduct_spare_parts`** — on insert to `issue_parts`, decrement `spare_parts.quantity` (floored at 0)
- **`generate_issue_number`** — assigns sequential ISS-XXXX before insert

### Row Level Security

Policies enforce role-based access. Key rules:
- **Admin** has full access to all tables.
- **Technician** can SELECT all issues, UPDATE issues (resolve/status), INSERT issue_parts. Read-only on spare_parts, operators, audit_log.
- **Operator** can SELECT only their own issues (reported_by OR assigned_to match), INSERT new issues with `reported_by = self`. No access to spares/reports/audit.
- **Inactive users** (`is_active = false`) blocked at the auth layer — they cannot authenticate.

---

## 4. MACHINES — 141 UNITS ACROSS 14 CATEGORIES

Full list in `supabase/migrations/002_seed.sql`. Category breakdown:

| Code | Category | Count |
|---|---|---:|
| Ex | Extruder | 33 |
| FP | Flexo Printer | 14 |
| CS | Bag Cutting | 32 |
| RM | Roll Sheet | 6 |
| CH | Chiller | 4 |
| AC | Air Compressor | 7 |
| AD | Air Dryer | 4 |
| CT | Cooling Tower | 3 |
| WC | Water Air Cooler | 10 |
| MX | Material Mixer | 11 |
| AP | AirHydra Press | 4 |
| MP | Punching Press | 10 |
| SM | Slitting | 2 |
| PR | Recycling | 1 |

Total: **141** (v1 brief said 130+; actual production count is 141).

---

## 5. SPARE PARTS — 2,837 REAL PARTS

Imported from `Spare_parts.xls` via migration `003_spare_parts_real.sql` (replaced the 15 seed parts).

### Inventory summary

| Metric | Value |
|---|---:|
| Total SKUs | 2,837 |
| In stock | 1,635 |
| Out of stock | 1,202 |
| Total items on hand | 13,545 |
| Total inventory value | **163,795 KWD** |

### Category distribution

| Category | SKUs | Items |
|---|---:|---:|
| Mechanical | 1,674 | 7,720 |
| Electrical | 743 | 2,689 |
| Sensor | 191 | 1,137 |
| Pneumatic | 137 | 1,754 |
| Consumable | 92 | 245 |

### Part-number format

All parts use `S-XX-XXX` where `XX` = 2-digit category prefix, `XXX` = sequence within category. Example: `S-10-001` = BEARING 608ZN.

**73 stock categories** (fine-grained). Map stored as `stock_category` TEXT column. Examples:
- `S-10-*` → Bearings (837 parts)
- `S-45-*` → Timing/Teeth Belts (124 parts)
- `S-50-*` → Surgical Blades & Strips (92 parts, all Consumable)
- `S-76-*` → Punching Molds & Air Cylinders (75 parts, Pneumatic)

Full 73-category map in `README_spare_parts_migration.md`.

### Known data-quality issues (from source Excel)

1. **One duplicate code** — `S-81 335` appears twice in source (COOLING FAN and OIL SEAL). Imported as `S-81-335` and `S-81-335-ALT1`. Admin to resolve in UI.
2. **9 rows with synthetic names** — `S-82-009` through `S-82-018` had blank descriptions. Given placeholder names like `Air Dryer Filter Elements (S-82-009)`. Admin to fill in real descriptions.
3. **1,202 parts with `unit_cost = 0`** — parts currently out of stock have no derivable unit cost. Admin to fill in as restock prices become known.

---

## 6. UI SCREENS

### Admin screens (badge 203 — Viswanathan)

1. **Login** — Badge ID input, branded header
2. **Dashboard** — 6 live KPI cards (Running / Down / Maintenance / Minor / Open issues / Downtime), category health bars, top 10 open issues, low-stock alerts. Updates via Supabase Realtime.
3. **Machines** — Searchable list of 141, detail panel with full issue history, quick "Log Issue" button
4. **Issues** — Full CRUD with filters (status, type, machine, date range, maintenance category, severity)
5. **Spares** — 2,837 parts inventory. Filters: category (5), stock_category (73), stock status (OK/LOW/CRITICAL/OUT). Search across part_number, name, description. Paginated 50/page.
6. **Reports** — Period selector (daily/weekly/monthly/quarterly/yearly), downtime ranking, operator performance, issue type distribution, spare parts usage. CSV + branded PDF export.
7. **Operators** — Grid view, issue stats per operator, role badges
8. **Audit Log** — Chronological action history with JSONB details

### Technician screens (6 active badges)

1. **Login, Dashboard, Machines** — same as operator
2. **Issues** — see all open issues, can assign to self, can resolve
3. **Resolve issue** — add resolution text, mark parts consumed (triggers auto-deduction)
4. **My Issues** — active work queue

### Operator screens (90 active badges)

1. **Login, Dashboard** — personal KPI view
2. **Machines** — read-only, can open "Log Issue" form
3. **My Issues** — issues they reported or were assigned; cannot resolve (technician does that)

### Mobile (PWA)

All screens responsive. Installable via browser "Add to home screen." Works on factory floor mobile browsers.

### Bilingual / RTL

Full English + Arabic. Language toggle in header. RTL layout flips sidebar, tables, forms. Font remains IBM Plex for English, appropriate Arabic fallback (Noto Sans Arabic or system).

### Dark mode

CSS variable-based theming. Toggle in header. Persists per-user via localStorage.

---

## 7. BUSINESS RULES

1. **Multiple open issues per machine allowed** — e.g., a minor issue can coexist with a breakdown.
2. **Machine status auto-derived** from open issues (breakdown → Down, preventive → Maintenance, minor → Minor Issue, none → Running).
3. **Spare parts auto-deduct** when issue_parts rows inserted.
4. **Every action audit-logged** with JSONB `details` payload (old/new values for updates, linked entities for creates).
5. **Downtime auto-calculated** as `end_time - start_time`, stored as `duration_minutes`.
6. **Issue numbers auto-generated** (ISS-0001, ISS-0002, …).
7. **Operators see only their own issues** (RLS enforced).
8. **Admin has full access** including export.
9. **Technicians can resolve any issue** but not manage inventory/operators.
10. **Inactive accounts cannot log in** and don't appear in dropdowns — but historical FK references to them are preserved.

---

## 8. FOLDER STRUCTURE (actual)

```
alarabi/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       — Login
│   ├── dashboard/page.tsx
│   ├── machines/page.tsx  [id]/page.tsx
│   ├── issues/page.tsx  new/page.tsx  [id]/page.tsx
│   ├── spares/page.tsx
│   ├── reports/page.tsx
│   ├── operators/page.tsx
│   └── audit/page.tsx
├── components/
│   ├── ui/                            — shadcn/ui primitives
│   ├── layout/                        — Header, Sidebar, Footer
│   ├── dashboard/                     — KpiCards, CategoryHealth, OpenIssues
│   ├── machines/                      — MachineTable, MachineDetail
│   ├── issues/                        — IssueCard, IssueForm, ResolveDialog
│   └── reports/                       — DowntimeChart, OperatorPerformance
├── lib/
│   ├── supabase/                      — client.ts, auth.ts, queries.ts
│   ├── i18n/                          — en.json, ar.json, provider
│   ├── theme/                         — dark mode provider
│   ├── types.ts
│   └── utils.ts
├── types/                             — generated Supabase types
├── supabase/migrations/
│   ├── 001_schema.sql
│   ├── 002_seed.sql
│   ├── 003_spare_parts_real.sql       — 2,837 parts (replaces seed)
│   ├── 00X_maintenance_categories.sql — 52 maintenance codes
│   └── 00X_technician_role.sql        — 6 active technicians
├── public/
│   ├── manifest.json                  — PWA manifest
│   ├── sw.js                          — service worker
│   └── icons/
├── PROJECT_BRIEF.md                   — this file
├── CHANGELOG.md
├── CLAUDE_CODE_PROMPT.md
├── README.md
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 9. DEPLOYMENT

Production on Vercel, DB on Supabase. Env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Free-tier Supabase (500 MB limit, currently well under).

---

## 10. FUTURE (NOT BUILT)

- IoT sensor integration for auto fault detection
- Photo attachments on issues
- Push notifications for assigned issues
- Shift management (morning/evening/night)
- Production output tracking per machine
- Maintenance scheduling calendar
- QR code scanning for machine identification
- Export reports to Excel (PDF + CSV already done)

---

## 11. INSTRUCTIONS FOR CLAUDE CODE

When making changes:

1. **Read this file first** — it's authoritative. The old v1 brief had many inaccuracies (130 machines, 15 parts, 2 roles, no bilingual, etc.). Do not use old Claude Code summaries as source of truth.
2. **Database is the source of truth for data** — if you need to know what's really there (operator count, spare part count, machine categories), query Supabase directly rather than assuming from any doc.
3. **Never hard-delete** — set `is_active = false` or equivalent soft-delete. Preserves audit trail and FKs.
4. **Currency is KWD**, not USD.
5. **Respect RLS** — never bypass in app code; if you need admin-only access, verify the logged-in operator's role first.
6. **Part numbers are `S-XX-XXX`**, NOT `SPXXX`. The SP format was seed data only.
7. **Inactive operators** (the 12 mis-added technicians) stay in the DB. Don't write migrations to delete them.