# Claude Code — Add Theme Picker (Mode × Accent)

## MODE: AUTONOMOUS

Same rules as before. No yes/no questions. Execute, verify in production, report.

---

## FEATURE

Users can pick their own theme. Two dimensions:

- **Mode:** Light / Dark (already exists — just plug it into the new picker)
- **Accent:** Navy (default) / Blue / Green / Purple / Rose / Orange

Stored in **localStorage** (not Supabase — per-browser is fine).

Two entry points:
- **Header** — compact picker (icon → dropdown) next to the language/logout area, for fast swap
- **Settings page** — full preferences panel with larger previews

---

## 1. ACCENT COLOR TOKENS

Add these color triplets to `tailwind.config.ts` and as CSS variables in `app/globals.css`. Each accent defines `--brand-primary`, `--brand-primary-600`, `--brand-accent`, `--brand-accent-hover`.

```css
/* Accent: Navy (default - corporate) */
[data-accent="navy"] {
  --brand-primary:      #0a2540;
  --brand-primary-600:  #12315a;
  --brand-accent:       #1d4ed8;
  --brand-accent-hover: #1e40af;
}
[data-accent="navy"].dark {
  --brand-primary:      #0a1929;
  --brand-accent:       #3b82f6;
}

/* Accent: Blue */
[data-accent="blue"] {
  --brand-primary:      #1e3a8a;
  --brand-primary-600:  #1e40af;
  --brand-accent:       #3b82f6;
  --brand-accent-hover: #2563eb;
}
[data-accent="blue"].dark {
  --brand-primary:      #1e293b;
  --brand-accent:       #60a5fa;
}

/* Accent: Green */
[data-accent="green"] {
  --brand-primary:      #064e3b;
  --brand-primary-600:  #065f46;
  --brand-accent:       #10b981;
  --brand-accent-hover: #059669;
}
[data-accent="green"].dark {
  --brand-primary:      #022c22;
  --brand-accent:       #34d399;
}

/* Accent: Purple */
[data-accent="purple"] {
  --brand-primary:      #4c1d95;
  --brand-primary-600:  #5b21b6;
  --brand-accent:       #8b5cf6;
  --brand-accent-hover: #7c3aed;
}
[data-accent="purple"].dark {
  --brand-primary:      #2e1065;
  --brand-accent:       #a78bfa;
}

/* Accent: Rose */
[data-accent="rose"] {
  --brand-primary:      #881337;
  --brand-primary-600:  #9f1239;
  --brand-accent:       #f43f5e;
  --brand-accent-hover: #e11d48;
}
[data-accent="rose"].dark {
  --brand-primary:      #4c0519;
  --brand-accent:       #fb7185;
}

/* Accent: Orange */
[data-accent="orange"] {
  --brand-primary:      #7c2d12;
  --brand-primary-600:  #9a3412;
  --brand-accent:       #f97316;
  --brand-accent-hover: #ea580c;
}
[data-accent="orange"].dark {
  --brand-primary:      #431407;
  --brand-accent:       #fb923c;
}
```

**CRITICAL:** Do NOT change the `--success` / `--error` / `--warning` / `--info` semantic tokens when accent changes. Running/Resolved/OK states stay green regardless of user's accent choice. Only `--brand-*` changes.

---

## 2. THEME PROVIDER

Create (or extend) `lib/theme/ThemeProvider.tsx` with a context holding:

```tsx
type Mode = 'light' | 'dark';
type Accent = 'navy' | 'blue' | 'green' | 'purple' | 'rose' | 'orange';

type ThemeContext = {
  mode: Mode;
  accent: Accent;
  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
};
```

Implementation:
- On mount, read `alarabi_theme_mode` and `alarabi_theme_accent` from `localStorage`. Defaults: `mode = 'light'`, `accent = 'navy'`.
- When `mode` changes: toggle `class="dark"` on `<html>`, write to localStorage.
- When `accent` changes: set `data-accent="<value>"` attribute on `<html>`, write to localStorage.
- **Important:** apply both on first render (avoid flash of wrong theme). Use an inline `<script>` in `app/layout.tsx` head that reads localStorage and sets the class/attr synchronously before React hydrates. Pattern:

```tsx
// In app/layout.tsx <head>
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
      try {
        var mode = localStorage.getItem('alarabi_theme_mode') || 'light';
        var accent = localStorage.getItem('alarabi_theme_accent') || 'navy';
        if (mode === 'dark') document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-accent', accent);
      } catch(e) {}
    })();`,
  }}
/>
```

This prevents the flash. Don't skip it.

---

## 3. HEADER PICKER — COMPACT

Component: `components/layout/ThemePicker.tsx` (header variant).

- Single icon button (palette icon, `lucide-react` has `Palette`) in the header near the logout button
- Clicking it opens a popover with two compact sections:

```
┌─ Theme ─────────────┐
│ Mode                │
│  [☀ Light] [🌙 Dark]│
│                     │
│ Accent              │
│  ● ● ● ● ● ●        │  ← 6 colored swatches (click to pick)
│                     │
│  See all → (link to │
│   Settings page)    │
└─────────────────────┘
```

- Swatches are 28×28px circles, current selection has a ring around it (`ring-2 ring-offset-2`)
- Swatch colors use each accent's `--brand-accent` hex (the lighter one, not the primary)
- Keyboard accessible — Tab navigates, Enter selects
- Popover closes on selection

Use `shadcn/ui` Popover + Button primitives. No custom popover logic.

---

## 4. SETTINGS PAGE — FULL PICKER

Update or create `app/settings/page.tsx`. Add a "Appearance" card at the top with larger, labeled controls:

```
┌─ Appearance ────────────────────────────┐
│ Mode                                    │
│  ┌─────────┐  ┌─────────┐              │
│  │  ☀      │  │  🌙     │               │
│  │ Light   │  │ Dark    │              │
│  └─────────┘  └─────────┘              │
│                                         │
│ Accent Color                            │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│  │ ● │ │ ● │ │ ● │ │ ● │ │ ● │ │ ● │   │
│  │Navy│ │Blu│ │Grn│ │Pur│ │Ros│ │Org│   │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘   │
│                                         │
│ Preview                                 │
│  ┌───────────────────────────────────┐ │
│  │ [Mock header in selected colors]  │ │
│  │ [Mock button in selected accent]  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Mode cards are 120×80px, radio-like selection
- Accent swatches are 56×56px circles with name label below
- Selection = ring + subtle check mark
- Live preview panel at the bottom showing a mini header + primary button so user sees the theme before committing

The Settings page should also have other sections (Language, Logout) if they don't already exist — leave those alone if present, don't break them.

---

## 5. i18n KEYS

Add to both `lib/i18n/en.json` and `lib/i18n/ar.json`:

```json
{
  "theme": {
    "title": "Theme",
    "appearance": "Appearance",
    "mode": "Mode",
    "modeLight": "Light",
    "modeDark": "Dark",
    "accent": "Accent Color",
    "accentNavy": "Navy",
    "accentBlue": "Blue",
    "accentGreen": "Green",
    "accentPurple": "Purple",
    "accentRose": "Rose",
    "accentOrange": "Orange",
    "preview": "Preview",
    "seeAll": "See all settings"
  }
}
```

Arabic translations — use your best judgment, flag any uncertainty in the summary.

---

## 6. ARABIC / RTL

Verify both pickers work in RTL mode:
- Header popover opens on the correct side (left-aligned when `dir="rtl"`)
- Swatches flow right-to-left in Arabic (use `flex-row-reverse` conditionally, or just rely on `dir` attribute doing the work)

---

## 7. PROJECT_BRIEF.md UPDATE

Append to the "Brand" section in `PROJECT_BRIEF.md`:

```md
### User Theme Preferences

Users can customize their view via the theme picker (header icon or Settings page):

- **Mode:** Light or Dark
- **Accent:** Navy (default/corporate), Blue, Green, Purple, Rose, Orange

Stored in browser `localStorage` per device. Corporate default (Navy) applies to
new users and anonymous sessions. Semantic colors (success green, error red,
warning amber) are accent-independent and never change.
```

Add to `CHANGELOG.md` under "v2":

```
- Added user theme picker: Light/Dark mode × 6 accent colors
- Theme stored in localStorage per browser
- Accessible from header (compact) and Settings page (full with preview)
```

---

## VERIFICATION (must pass)

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Then test in dev:

```bash
npm run dev &
sleep 10

# Prove the picker is in the bundle
grep -r "Palette" components/layout/ | head -3
grep -r "data-accent" app/globals.css

# Kill server
pkill -f "next dev"
```

Smoke test manually (open browser):
- Log in
- Click palette icon in header → popover opens
- Toggle Dark mode → whole app goes dark, no flash on next page load
- Pick Green accent → header/buttons turn green, Running badges stay green (semantic)
- Navigate to /settings → Appearance section shows same current selection
- Change accent in Settings → header reflects immediately
- Log out, log back in → theme persists (from localStorage)
- Hard refresh (Ctrl+Shift+R) → no flash of wrong theme

---

## COMMIT & PUSH

```bash
git add -A
git commit -m "Add user theme picker (Light/Dark × 6 accent colors)

- ThemeProvider reads/writes localStorage for mode + accent
- Header: compact popover with palette icon
- Settings page: full Appearance card with live preview
- 6 accents: Navy (default), Blue, Green, Purple, Rose, Orange
- Semantic colors (success/error/warning) independent of accent
- Anti-FOUC inline script prevents flash on initial load
- i18n keys added for both en and ar
- PROJECT_BRIEF and CHANGELOG updated"
git push origin main
```

Wait ~2 min for Vercel, then verify production:

```bash
curl -sL "https://alarabi-maintenance-tracker.vercel.app/?t=$(date +%s)" > /tmp/prod.html
echo "Palette icon in bundle: $(grep -c 'Palette\|data-accent' /tmp/prod.html)"
```

---

## FINAL OUTPUT

```
✓ Files changed: N
✓ Build: PASS/FAIL
✓ Vercel deploy: <url>
✓ Header picker renders: PASS/FAIL
✓ Settings page Appearance section: PASS/FAIL
✓ Accent persists after logout/login: PASS/FAIL
✓ No FOUC on hard refresh: PASS/FAIL
⚠ Uncertain Arabic translations:
  - <list>
```

Go.