# Task: Update Spare Parts module to match new Supabase schema

## Context

The `spare_parts` table in Supabase has been updated with real APF inventory data (2,837 parts, replacing the 15 placeholder seeds). The schema has three NEW columns that the frontend must now handle:

| Column | Type | Notes |
|---|---|---|
| `description` | TEXT (nullable) | Full part description — often longer and more detailed than `name` |
| `unit` | TEXT (default 'PIECE') | Unit of measure: PIECE, MTR, SET, PACKET, CARTON, ROLL, DRUM, KG, GRM |
| `stock_category` | TEXT (nullable) | Fine-grained category (73 values) — e.g. "Bearings", "Timing/Teeth Belts", "Surgical Blades & Strips" |

Existing columns unchanged: `id`, `part_number`, `name`, `category`, `quantity`, `min_quantity`, `unit_cost`, `location`, `created_at`, `updated_at`.

`part_number` format changed from `SP001` to `S-XX-XXX` (e.g., `S-10-001` for BEARING 608ZN). Cost is in **KWD** (Kuwaiti Dinar).

## What to change

### 1. Update the TypeScript type

In `types/` (wherever `SparePart` is defined), update the type:

```ts
export type SparePart = {
  id: string;
  part_number: string;
  name: string;
  description: string | null;
  category: string | null;            // Electrical | Mechanical | Pneumatic | Sensor | Consumable
  stock_category: string | null;       // fine-grained (73 values)
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  unit: string;                        // PIECE | MTR | SET | PACKET | CARTON | ROLL | DRUM | KG | GRM
  location: string | null;
  created_at: string;
  updated_at: string;
};
```

Regenerate the Supabase types file too if it's auto-generated:
```bash
npx supabase gen types typescript --project-id <your-ref> --schema public > types/database.ts
```

### 2. Update `app/spares/page.tsx` — the spare parts inventory page

**Column changes in the table:**
- Show `part_number` (e.g., "S-10-001") — keep monospace font for IDs
- Show `name` (truncate to ~60 chars with ellipsis; show full on hover via `title` attr)
- Add `unit` column — display alongside quantity: `14 PIECE`, `38 MTR`
- Add `category` badge column — color-coded by type (see below)
- Keep `unit_cost` column but relabel header to **"Unit Cost (KWD)"**
- Keep stock status indicator (OK / LOW / CRITICAL based on `quantity` vs `min_quantity`)

**Filters (add above the table):**
- **Category filter** (dropdown): All / Electrical / Mechanical / Pneumatic / Sensor / Consumable
- **Stock status filter** (dropdown): All / In Stock / Low Stock / Out of Stock / Critical
- **Search box**: match against `part_number`, `name`, AND `description` (case-insensitive)
- Keep filters in URL params (`?category=Electrical&status=low`) so they survive refresh

**Category badge colors** (align with existing brand):
- Electrical → blue (#1d4ed8 bg tint)
- Mechanical → slate/gray
- Pneumatic → sky blue
- Sensor → amber
- Consumable → green

**Pagination:**
- 2,837 rows will slow the page down if rendered all at once. Use Supabase's `.range()` for pagination — 50 rows per page, with prev/next controls. Or use virtualization (`@tanstack/react-virtual`) if you prefer infinite scroll.

**Detail view / edit modal:**
- Show `description` in full (it's the useful field, often more informative than `name`)
- Show `stock_category` as a sub-label under `category`
- Allow editing all fields; `unit_cost` should accept decimals (4 decimal places)

### 3. Update `components/issues/IssueForm.tsx` (or wherever parts are picked for an issue)

- The parts picker dropdown should now show `part_number — name` (e.g., `S-10-001 — BEARING 608ZN`).
- Add a search input at the top of the parts dropdown — with 2,837 parts, scrolling isn't viable. Use a combobox (shadcn/ui has a `Command` component for this) that searches on `part_number`, `name`, and `description`.
- When a part is selected, show its current `quantity` + `unit` next to the quantity input (so the user knows "you have 14 PIECE in stock").
- Validate: don't let `quantity_used` exceed current `quantity`.

### 4. Update `app/dashboard/page.tsx` — Low stock alerts widget

- Already driven by `quantity <= min_quantity`. Update the card to show:
  - Count of parts currently below threshold
  - Top 5 worst offenders: `part_number — name — {quantity}/{min_quantity} {unit}`
  - Click-through to `/spares?status=low` (or critical)

### 5. Update `app/reports/page.tsx` — Spare Parts Usage report

- Group by `category` AND `stock_category` with drill-down
- Total KWD value column: `SUM(quantity_used * unit_cost)` across all issues in the period
- Top 10 most-consumed parts in the selected period

### 6. Update `lib/supabase/queries.ts` (or wherever DB queries live)

Add / update these query helpers:

```ts
// Paginated list with filters
export async function getSpareParts({
  category, status, search, page = 0, pageSize = 50
}: {
  category?: string;
  status?: 'in_stock' | 'low' | 'critical' | 'out';
  search?: string;
  page?: number;
  pageSize?: number;
}) { /* ... */ }

// For the issue form combobox
export async function searchSpareParts(query: string, limit = 20) { /* ... */ }

// Dashboard KPI
export async function getLowStockParts(limit = 5) { /* ... */ }
```

### 7. Small thing — one data quality flag in the UI

There is ONE part with the code `S-81-335-ALT1` — this is a duplicate from the source Excel (two different parts sharing the same code: COOLING FAN and OIL SEAL). Surface this somewhere subtle in the spares page so the admin can fix it — e.g. a small "⚠ duplicate code, please rename" badge on any row whose `part_number` ends in `-ALT1`, `-ALT2`, etc.

Also: 9 parts have synthetic names like `Air Dryer Filter Elements (S-82-009)` — these are rows where the source Excel had blank descriptions. They're easy to find with `WHERE name LIKE '% (S-%)'`. No UI change needed, but the admin will naturally see them and fill in real names over time.

## Testing checklist

- [ ] Spares page loads without console errors
- [ ] Filters combine correctly (category + status + search work together)
- [ ] Pagination navigates without refetching filters from scratch
- [ ] Issue form combobox finds "BEARING 6200" when typing "6200"
- [ ] Issue form combobox finds "S-10-002" when typing the code
- [ ] Selecting a part in the issue form and clicking Resolve correctly decrements stock
- [ ] Low stock widget on dashboard links to the filtered spares page
- [ ] Opening the repo on mobile (PWA) — table is still usable (horizontal scroll or card layout fallback)
- [ ] Admin (badge 203) can edit parts; operators cannot (RLS should already handle this)

## Don't do

- Don't touch `001_schema.sql` or `002_seed.sql` — the schema migration `003_spare_parts_real.sql` is already applied in production.
- Don't regenerate the seed data — the real data is now in production Supabase.
- Don't remove the `name` column; it's kept as a short display form of `description`.
- Don't change the `category` values — they map to the 5 enum-like values already used in the app.

## Starting command

```bash
cd /path/to/alarabi
claude
> Read CLAUDE_CODE_SPARES_UPDATE.md and PROJECT_BRIEF.md.
> Then update the spare parts module to match the new schema.
> Start with the TypeScript types, then the spares page, then the issue form combobox.
> Run `npm run dev` and `npm run build` before declaring done.
```