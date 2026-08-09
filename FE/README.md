# parking-fe

Frontend for the Parking Building Management System. Next.js (App Router) + TypeScript, TanStack React Query for server state, Zustand for client/auth state, MSW for API mocking during local development.

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

### Environment

By default the app runs against MSW mocks with no extra configuration — no `.env` file is required to get started.

To point the app at a real backend instead of mocks, set:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```

`src/lib/api.ts` prefixes all requests with this base (falling back to `/api`, served by MSW, when unset). MSW is only initialized in `src/components/providers.tsx` when `NEXT_PUBLIC_API_BASE` is **not** set — so setting the env var switches the whole app from mocked to live data with no code changes.

Auth: login is by **username** (not email); the JWT is attached automatically to every request by the `apiFetch` wrapper, which also unwraps the backend's `{success, message, data}` envelope and normalizes Spring Boot error responses.

### Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start the local dev server |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint .` | ESLint (flat config, `eslint.config.mjs`) |
| `npm run type-check` | `tsc --noEmit` | TypeScript type checking with no emit |

Before pushing, all three of `lint`, `type-check`, and `build` should complete cleanly with zero errors/warnings.

## Project structure

- `src/app/` — Next.js App Router routes. Each route is a thin page component wrapping a feature component from `src/components/`, typically inside `ProtectedLayout` (auth + role-gating) from `src/components/layout/`.
- `src/components/` — feature components, organized by domain (e.g. `active-sessions/`, `exit-payment/`, `reports/`, `admin/`).
- `src/hooks/` — React Query hooks, one file per domain, each wrapping `api.get/post/put/patch` from `src/lib/api.ts`. See `API_INTEGRATION.md` for the full inventory and endpoint mapping.
- `src/lib/` — `api.ts` (fetch wrapper), `beApi.ts` (backend DTO shapes/mappers), `roles.ts` (role-based route access), `utils.ts`, `constants.ts`.
- `src/store/` — Zustand stores (e.g. `auth.ts`).
- `src/mocks/` — MSW request handlers used in local/mocked mode.

### Roles & routing

This app serves **Admin / Manager / Staff** (internal operations). The `Driver` role is served by a separate app; a driver landing on this app is redirected to `/login`. Route access per role is defined in `src/lib/roles.ts` (`ROUTE_ROLES` + `canAccess`), enforced by `ProtectedLayout`.

One exception: `/profile` (`src/app/profile/`) is a standalone, non-`ProtectedLayout` route for the driver-profile form (`GET`/`PUT /driver/profile`). It only requires an authenticated session (any role) rather than an internal-console role, since it's meant to be reachable independent of the Admin/Manager/Staff console.

## Design system

Visual language for the Parking Building Management System dashboards.

**Tech:** React (Next.js) + TypeScript, Tailwind CSS v4, shadcn/ui, responsive (desktop/tablet/mobile), Vietnamese-language labels throughout.

### Visual style
- Professional & clean — modern SaaS admin panel aesthetic.
- High contrast — legible in bright parking facility environments.
- Status-driven — heavy color coding for slot/session/incident states.
- Data-dense — information-rich layouts for operational efficiency.

### Color palette

**Primary:** Primary Blue `#3B82F6` (actions, links, primary buttons); Dark Blue `#1E40AF` (hover/emphasis).

**Status:** Available (green) `#10B981`, Occupied (red) `#EF4444`, Reserved (yellow) `#F59E0B`, Maintenance (gray) `#6B7280`.

**Neutral:** Background `#F9FAFB`, Card `#FFFFFF`, Border `#E5E7EB`, Text Primary `#111827`, Text Secondary `#6B7280`.

**Semantic:** Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`, Info `#3B82F6`.

### Typography
Font family: Inter or system UI stack. Vietnamese diacritics must render correctly everywhere.

- H1: 2rem / 700, H2: 1.5rem / 600, H3: 1.25rem / 600, H4: 1rem / 600
- Body: 0.875rem / 400, Small: 0.75rem / 400

### Spacing scale
xs `0.25rem`, sm `0.5rem`, md `1rem`, lg `1.5rem`, xl `2rem`, 2xl `3rem`.

### Border radius
Small `0.375rem` (buttons, badges), Medium `0.5rem` (cards, inputs), Large `0.75rem` (modals, large cards).

### Shadows
Small `0 1px 2px 0 rgb(0 0 0 / 0.05)`, Medium `0 4px 6px -1px rgb(0 0 0 / 0.1)`, Large `0 10px 15px -3px rgb(0 0 0 / 0.1)`.

### Components

- **Buttons** — Primary (blue bg/white text, small radius, darker-blue hover+shadow); Secondary (white bg, border, hover light gray); Danger (error red, destructive actions); Icon (square, minimal padding, light hover bg).
- **Status badges** — pill-shaped, 12px text, color-coded per status (available/occupied/reserved/maintenance) as above.
- **Cards** — white background, medium radius, medium shadow, `lg` padding, 1px border.
- **Data tables** — striped rows, hover highlight, sticky header, sortable columns, pagination, search/filter bar.
- **Forms** — inputs: 1px border, medium radius, `0.5rem 0.75rem` padding, blue focus ring, red border on error. Labels: 500 weight, `0.5rem` bottom margin, red asterisk for required. Selects: same styling as inputs + chevron.
- **Modals** — semi-transparent dark overlay; white card, large radius; max width 600px (medium) / 800px (large); close button top-right; actions bottom-right (Cancel + Confirm).
- **Navigation** — Sidebar: fixed left, dark bg `#1F2937`, white text, active item = primary blue bg, icons + labels, collapsible on mobile. Top bar: white bg, small shadow, user profile right, breadcrumbs left, 64px height.
- **Slot map** — grid of square cards (60px desktop / 40px mobile), color-coded by status, centered slot name, hover enlarges + tooltip, click opens detail modal.
- **Stats cards** — white card, colored-circle icon left, large bold number, small gray label, optional trend indicator.
- **Toasts** — top-right, auto-dismiss 5s, color-coded by type, icon left, close button.

### Layout pattern

```
┌─────────────────────────────────────┐
│ Top Bar (breadcrumbs, user)        │
├──────┬──────────────────────────────┤
│      │ Stats Cards Row              │
│ Side │ (4 cards: total, available,  │
│ Nav  │  occupied, revenue)          │
│      ├──────────────────────────────┤
│      │ Main Content Area            │
│      │ (Slot Map / Table / Form)    │
│      │                              │
└──────┴──────────────────────────────┘
```

Responsive breakpoints: Mobile `<640px` (sidebar collapses to hamburger), Tablet `640–1024px` (sidebar visible), Desktop `>1024px` (full layout).

### Accessibility
WCAG 2.1 AA. Keyboard navigation, visible focus indicators, ARIA labels, 4.5:1 text contrast minimum, full Vietnamese-language support.

### Interactions
Transitions ~200ms ease-in-out. Loading: skeleton screens or spinners. Hover: subtle background/shadow change. Active: slightly darker color. Disabled: 50% opacity, no pointer events.

### Icons
Lucide React (or Heroicons). Sizes 16px (small) / 20px (default) / 24px (large), 2px stroke width, color inherited or semantic.

Sample implementations should use shadcn/ui + Tailwind CSS v4 utility classes consistent with the tokens above.
