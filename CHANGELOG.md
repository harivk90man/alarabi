# CHANGELOG — PROJECT_BRIEF

## v2 (current) — replaces v1

This version reflects what's actually in production as of April 2026. The v1 brief was the initial spec; many things evolved during development that were never fed back into the doc.

### Added (real, live in production)

- **Three-role RBAC** — `admin` / `technician` / `operator`. v1 only defined admin + operator access levels (technician was in the CHECK constraint but had no defined permissions).
- **6 active technicians** — badges 237, 493, 582, 624, 666, 671. All can resolve issues and consume spare parts but cannot manage inventory/operators/reports/audit.
- **12 inactive operators** — technicians added by mistake, soft-deleted via `is_active = false`. Rows preserved for FK integrity on historical issues.
- **`maintenance_categories` table** — 52 codes with severity levels, referenced by `issues.maintenance_category_id`. Did not exist in v1.
- **Bilingual English + Arabic** with full RTL support. Confirmed live.
- **Dark mode** — CSS variable-based theming with header toggle. Confirmed live.
- **Realtime subscriptions** — KPI cards and sidebar badges update live via Supabase channels. Confirmed live.
- **PDF export** — branded report downloads via jsPDF. Confirmed live.
- **CSV export** — all report tables.

### Changed

- **Machine count** — v1 said "130+". Actual = **141** across 14 categories.
- **Spare parts** — v1 had 15 seeded parts (`SP001`–`SP015`). v2 has the real **2,837-part inventory** (~163,795 KWD total value) with part numbers in `S-XX-XXX` format.
- **`spare_parts` schema** — added three columns:
  - `description` TEXT (nullable) — full part description
  - `unit` TEXT (default `'PIECE'`) — PIECE / MTR / SET / PACKET / CARTON / ROLL / DRUM / KG / GRM
  - `stock_category` TEXT (nullable) — one of 73 fine-grained categories (e.g., "Bearings", "Timing/Teeth Belts")
- **Currency** — explicitly documented as **KWD** (v1 examples used `$` without specifying).
- **Operator count** — 109 remains correct as the total row count; breakdown is now 1 admin + 6 technicians + 90 operators + 12 inactive.

### Known data issues (carried from source)

- **1 duplicate code** — `S-81 335` appeared twice in source Excel (COOLING FAN vs OIL SEAL). Imported as `S-81-335` and `S-81-335-ALT1`. Admin to resolve.
- **9 synthetic names** — rows `S-82-009` through `S-82-018` had blank descriptions in source. Placeholder names assigned. Admin to fill in.
- **1,202 parts with `unit_cost = 0`** — out-of-stock parts have no derivable cost. Will be filled in as restock prices are known.

### Migrations added after v1

- `003_spare_parts_real.sql` — replaces 15 seed parts with 2,837 real parts (applied April 2026)
- `00X_maintenance_categories.sql` — creates and seeds the maintenance_categories table (exact filename varies; check your `supabase/migrations/` folder)
- `00X_technician_role.sql` — promotes 6 specific operators to technician role (exact filename varies)

### Not yet built (future work)

Same as v1 — IoT integration, photo attachments, push notifications, shift management, production tracking, maintenance scheduling calendar, QR code scanning. Excel export is now the only export format missing (PDF + CSV are done).

---

## v1 (original) — historical

Original spec from before the app was built. Kept for reference only. Key inaccuracies:
- Defined only 2 access levels (admin / operator); treated technician as a DB-level placeholder
- Listed 130+ machines; actual 141
- Seeded 15 placeholder spare parts; actual 2,837
- Did not mention bilingual, dark mode, realtime, or PDF export
- Did not define the `maintenance_categories` table