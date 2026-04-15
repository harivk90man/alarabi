# CLAUDE CODE PROMPT — COPY & PASTE THIS ENTIRE BLOCK INTO CLAUDE CODE

---

You are a senior full-stack architect. Build a complete production-ready maintenance tracking application for Al Arabi Plastic Factory, Kuwait.

Read the file `PROJECT_BRIEF.md` in this directory — it contains the complete specification including:
- Database schema (7 tables with triggers, RLS policies)
- All 130+ machines with exact IDs and models
- All 109 operators with badge IDs
- 15 starter spare parts
- UI screens, API endpoints, folder structure, business rules

## MY PROJECT DETAILS

- **Working Folder:** C:\Hari\Alarabi
- **Supabase Project:** factory-ops-tracker
- **Supabase URL:** https://ncftgfhbhklzuuyltqlw.supabase.co
- **Supabase Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZnRnZmhiaGtsenV1eWx0cWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjQ3MjIsImV4cCI6MjA5MTgwMDcyMn0.hJCjtmdk36ucQvxbzezoXI39SQKLzuduXGGr4DwVYho
- **GitHub:** Create a new repo called `alarabi-maintenance-tracker` on my GitHub account, initialize git in this folder, and push
- **Vercel:** I will connect manually after GitHub repo is ready

## WHAT TO BUILD

### Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Mobile:** PWA (Progressive Web App — installable on phones from browser)
- **Charts:** recharts
- **Icons:** lucide-react
- **Dates:** date-fns
- **Fonts:** IBM Plex Sans + IBM Plex Mono (Google Fonts)

### Brand Identity
- **Company:** Al Arabi Plastic Factory (المصنع العربي للبلاستيك)
- **Logo URL:** https://img1.wsimg.com/isteam/ip/c1812088-d5b4-4d7c-b39c-afa691bded3c/White%404x.png
- **Location:** Sabhan Industrial, Block 8, St 105, Bldg 170, Kuwait
- **Phone:** +965 2439 0000 | **Email:** info@arabiplastic.com
- **Parent:** AlKhudairi Group | Est. 1983
- **Primary Green:** #0d7a3e | **Header BG:** #0d3320 | **Accent border:** #16a34a
- **Error:** #dc2626 | **Warning:** #b45309 | **Info:** #1d4ed8
- **Background:** #fafaf8 | **Surface:** #ffffff | **Text:** #1a1a18

## BUILD STEPS — FOLLOW THIS EXACT ORDER

### Step 1 — Initialize Project in C:\Hari\Alarabi
```
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs recharts lucide-react date-fns
npx shadcn@latest init
```
- Create `.env.local` with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Configure Tailwind with the Al Arabi brand colors
- Set up shadcn/ui with green theme

### Step 2 — Supabase Database Setup
Create SQL migration files and run them against my Supabase project:

**Tables to create:**
1. `categories` — 14 machine categories (Extruder, Flexo Printer, Bag Cutting, Roll Machine, Chiller, Air Compressor, Air Dryer, Cooling Tower, Water Cooler, Mixer, AirHydra Press, Punching Press, Slitting, Recycling)
2. `machines` — All 130+ machines with text primary key (Ex01, FP03, CS12, etc.)
3. `operators` — All 109 operators with text primary key (badge number)
4. `issues` — Issue tracking with auto-generated issue_number (ISS-0001)
5. `spare_parts` — 15 starter parts with inventory tracking
6. `issue_parts` — Junction table linking issues to parts used
7. `audit_log` — Every action logged

**Triggers to create:**
- Auto-update machine status when issue is created/updated (breakdown→Down, preventive→Maintenance, minor→Minor Issue, no open issues→Running)
- Auto-deduct spare parts quantity when issue_parts record is created
- Auto-generate sequential issue numbers (ISS-0001, ISS-0002, ...)

**RLS Policies:**
- Admin (operator role='admin', ID 203) has full access to everything
- Operators can view/create their own issues only
- Machines and spare parts are readable by all authenticated users

**CRITICAL: Seed ALL data from PROJECT_BRIEF.md:**
- ALL 130+ machines — every single one, no shortcuts
- ALL 109 operators — every single one with correct badge ID
- ALL 15 spare parts
- ALL 14 categories

### Step 3 — Auth System
- Simple login: operator enters badge number (e.g., 203)
- Look up operator in the operators table
- For MVP, use a lightweight session approach — these are factory floor workers, not tech users
- No email/password needed — just badge ID
- Store current user in React context/state
- Admin check: operator.role === 'admin' (only ID 203 - VISWANATHAN)
- Protect routes: redirect to login if not authenticated

### Step 4 — Layout Components
Build the shell that wraps all pages:

**Header (sticky top):**
- Dark green (#0d3320) background with #16a34a bottom border (3px)
- Al Arabi logo (from URL above) on the left
- Divider line, then "Maintenance Tracker" title + subtitle "{X} machines · {Y} operators"
- Right side: user name, role badge (SUPERVISOR/OPERATOR), badge ID, logout button

**Sidebar (left nav):**
- Admin tabs: Dashboard, Machines, Issues, Spare Parts, Reports, Operators, Audit Log
- Operator tabs: Dashboard, My Issues, Machines
- Active tab highlighted with green accent (#0d7a3e) background
- Icons from lucide-react

**Footer (bottom of every page):**
- Dark green (#0d3320) background with #16a34a top border (3px)
- Left: Al Arabi logo + company name + Arabic name (المصنع العربي للبلاستيك) + Est. 1983
- Center: Address + phone + email
- Right: "A subsidiary of AlKhudairi Group" + "© 2026 Al Arabi Plastic Factory. Internal Use Only."

### Step 5 — Dashboard Page (/dashboard)
**KPI Cards row:**
- Running (green) — count of machines with status 'Running'
- Down (red) — count with status 'Down'
- Maintenance (amber) — count with status 'Maintenance'
- Minor Issues (blue) — count with status 'Minor Issue'
- Open Issues (purple) — count of issues with status 'open'
- Downtime 7d (red) — total breakdown minutes in last 7 days, displayed as Xh Ym

**Category Health section:**
- For each of the 14 categories, show a progress bar (% operational)
- Green bar if 100%, amber if >80%, red if lower
- Show "X% operational · Y down" text

**Two columns at bottom:**
- Left: Open Issues (latest 5) — machine ID, description, type badge, timestamp
- Right: Low Stock Alerts — spare parts where qty <= min_qty

### Step 6 — Machines Page (/machines)
- Search input (searches across ID, name, model, manufacturer)
- Category dropdown filter (All + 14 categories)
- Sortable table: ID (monospace), Name, Model, Category, Manufacturer, Status
- Status column: colored dot (green/red/amber/blue) with pulse animation for "Down"
- Click any row → slide-in detail panel showing:
  - Machine ID, name, model, category, manufacturer, status badge
  - Recent issues list (last 8)
- "Log Issue" button → opens issue creation modal (pre-selects machine)

### Step 7 — Issues Page (/issues)
- Tab filters: All | Open | In Progress | Resolved
- Issue cards showing: issue number (ISS-XXXX), machine ID, type badge (breakdown=red, minor=amber, preventive=blue), status badge (open=red, resolved=green), description, timestamps (start/end), duration, reported by name, assigned to name, downtime flag, spare parts used, resolution notes
- "Mark Resolved" button on open issues → inline input for resolution notes → saves and auto-calculates duration
- "Log Issue" floating button → modal form:
  - Machine dropdown (searchable)
  - Issue type: 3 toggle buttons (Breakdown / Minor Issue / Preventive)
  - Description textarea
  - Assign to: operator dropdown
  - Spare parts: add multiple parts with quantities (select part + qty + add button, shows list below)
  - Submit → creates issue + deducts parts + updates machine status + creates audit log entry

### Step 8 — Spare Parts Page (/spares) — Admin only
- Table: Part #, Name, Category, Stock (bold, color-coded), Min Qty, Total Used, Unit Cost, Status badge (OK=green, LOW=amber, CRITICAL=red)
- "Add Part" button → inline form row
- Clicking stock number → quick edit popup to adjust quantity

### Step 9 — Reports Page (/reports) — Admin only
- Period selector: Daily | Weekly | Monthly | Quarterly | Yearly buttons
- Summary cards: Total Issues, Breakdowns, Minor Issues, Preventive for selected period
- Issue Type Distribution: stacked horizontal bar (red/amber/blue) with legend and percentages
- Top Downtime Machines: horizontal bar chart (recharts) — machine IDs ranked by total downtime
- Operator Performance: table — name, issues resolved, avg resolution time
- Spare Parts Usage: grid of cards showing most-used parts with quantities

### Step 10 — Operators Page (/operators) — Admin only
- Search input
- Grid of cards: operator name, badge ID (monospace), role badge, resolved count (green), open count (red if >0)

### Step 11 — Audit Log Page (/audit) — Admin only
- Chronological list (newest first)
- Each entry: action type, entity details, operator who performed it, timestamp (monospace)

### Step 12 — My Issues Page (/my-issues) — Operator view
- Same as Issues page but filtered to: assigned_to = current_user OR reported_by = current_user
- Can resolve own assigned issues

### Step 13 — PWA Setup
- Create `public/manifest.json`: name "APF Maintenance Tracker", short_name "APF Maint", theme_color "#0d3320", background_color "#fafaf8"
- Create service worker for basic caching
- Add PWA meta tags to layout
- Generate app icons (use a simple green "APF" text icon)
- This makes the web app installable on phones — operators add to home screen

### Step 14 — Git & Deploy
- `git init` in C:\Hari\Alarabi
- Create `.gitignore` (include node_modules, .env.local, .next)
- Create README.md with project description
- Initial commit with all files
- Create GitHub repo `alarabi-maintenance-tracker` and push
- Provide instructions for Vercel deployment

## CRITICAL REQUIREMENTS — DO NOT SKIP

1. **Seed ALL 130+ machines** from PROJECT_BRIEF.md — every single one. No placeholders, no "add more later."
2. **Seed ALL 109 operators** — every badge ID and name exactly as listed.
3. **Machine status is AUTO-DERIVED** from open issues via DB trigger — never set manually by the app.
4. **Spare parts AUTO-DEDUCT** when used in an issue — via DB trigger.
5. **Every action AUDIT LOGGED** — issue create/resolve, part usage, status changes.
6. **Issue numbers AUTO-GENERATE** as ISS-0001, ISS-0002, etc. — via DB trigger.
7. **Downtime AUTO-CALCULATED** from end_time - start_time.
8. **Admin (ID 203 VISWANATHAN) sees everything.** Operators see only their own issues.
9. **Responsive design** — must work on desktop AND mobile browsers.
10. **Footer with Al Arabi branding** on every single page.
11. **No dummy data in production** — only real seed data from the brief.

## START BUILDING NOW

Begin with Step 1. Work through each step sequentially. Show me progress after each major step. Ask me for my Supabase anon key when you need it (I'll get it from the API Keys section). Build everything — this is going to a real factory floor.
