# APF Maintenance Tracker

**Al Arabi Plastic Factory — Maintenance Tracking System**

A production-ready maintenance tracking application for Al Arabi Plastic Factory, Kuwait. Built for factory floor use with 130+ machines and 109 operators.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Realtime)
- **Charts:** Recharts
- **PWA:** Installable on mobile devices from browser

## Features

- **Dashboard:** Live KPI cards, category health, open issues, low stock alerts
- **Machines:** 130+ machines with real-time status, search/filter, detail panel
- **Issues:** Full CRUD — log breakdowns, minor issues, preventive maintenance
- **Spare Parts:** Inventory management with auto-deduction via DB triggers
- **Reports:** Period-based analytics, downtime charts, operator performance
- **Operators:** Grid view with resolved/open issue counts
- **Audit Log:** Complete action history
- **PWA:** Install on phone, works on factory floor mobile browsers

## Setup

### 1. Clone and install
```bash
git clone <repo>
cd alarabi-maintenance-tracker
npm install
```

### 2. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database setup
Run SQL migrations in Supabase SQL editor (in order):
1. `supabase/migrations/001_schema.sql` — Tables, triggers, RLS
2. `supabase/migrations/002_seed.sql` — All 130+ machines, 109 operators, 15 spare parts

### 4. Run development server
```bash
npm run dev
```

### 5. Login
Enter badge ID `203` to sign in as admin (VISWANATHAN).

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Access Levels

| Role | Badge | Access |
|------|-------|--------|
| Admin/Supervisor | 203 | Full access — all pages |
| Operator | Any other | Dashboard, My Issues, Machines |

---

**Al Arabi Plastic Factory · Sabhan Industrial, Kuwait · Est. 1983**  
A subsidiary of AlKhudairi Group
