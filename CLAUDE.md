# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bikepark Tracker** (previously "Gravity Card Payback Counter") is a PWA for tracking bikepark ticket purchases per season. Users can create ticket categories (e.g., "Wexltrails halbtags"), increment counters to track usage, and monitor their Gravity Card amortization status.

- **Frontend**: Single-page app in `src/index.html` — vanilla JavaScript (ES2020+), no framework
- **Backend**: Cloudflare Worker (`worker.js`) with KV storage for multi-user auth and data persistence
- **Build**: `build.js` injects `API_URL` environment variable into the HTML placeholder `__API_URL__`
- **Deploy**: GitHub Actions deploys to GitHub Pages on push to `main`

## Commands

### Build and Deploy

```bash
# Build for local development (requires .env with API_URL set)
npm run build

# Serve locally after building
npx serve dist

# Deploy Cloudflare Worker
wrangler deploy

# View worker logs
wrangler tail
```

### Development

There are no tests or linting configured. Changes are tested manually by building and serving locally.

## Architecture

### Data Model: Multi-Season Structure

The app stores data per-season. Each season has:
- **year** (number) — season identifier
- **categories** (array) — ticket types with counters
- **budget** (object) — `{ start: number|null, spent: number }`

State in `index.html`:
- `seasons` (object) — `{ [year]: { year, categories, budget } }`
- `activeSeason` (number) — currently viewed year
- `categories`, `budgetStart`, `budgetSpent` — local view synced to/from `seasons[activeSeason]`

When switching seasons, the app calls `syncToActiveSeason()` to persist the current view, then `syncFromActiveSeason()` to load the new season's data.

### Ticket Categories

Each category (ticket type) has:
- `name` — display name
- `color` — hex color from `COLORS` palette
- `price` — cost per ticket (in €)
- `count` — number of times used
- `sum` — total spent (`price × count`)
- `reducesTheCurrentTotalOfTheGravityCardPrice` — boolean flag (default: `true`)
  - If `true`: this ticket counts toward Gravity Card amortization
  - If `false`: regular ticket, doesn't affect the Gravity Card balance

The `budgetSpent` value is calculated by summing `sum` for all categories where `reducesTheCurrentTotalOfTheGravityCardPrice` is `true`.

### Gravity Card Indicator Badge

Tickets display a badge showing whether they count toward the Gravity Card:
- **"GC"** badge (green) — ticket reduces Gravity Card balance
- **"NORMAL"** badge (red) — regular ticket, no impact on Gravity Card

This is controlled by the `reducesTheCurrentTotalOfTheGravityCardPrice` field.

### Budget Display

The budget panel shows:
- **Gravity Card price** — set via settings modal (per-season)
- **Remaining balance** — `budgetStart - budgetSpent`
- **Color coding**:
  - Red — balance still positive (card not yet amortized)
  - Green — balance ≤ 0 (card fully amortized)
  - Gray — no Gravity Card price set

The statistics panel shows the Gravity Card price and remaining balance when `budgetStart` is set.

### Storage and Sync

- **Save debouncing**: Changes trigger `save()`, which debounces with 800ms timeout before calling `flushSave()` to PUT data to the Worker API
- **Background polling**: Every 10 seconds (when tab visible and no pending saves), the app fetches fresh data from the server to sync across devices
- **Session**: Login returns a Bearer token stored in `localStorage` with 7-day TTL

Worker KV keys:
- `users:{username}` — account record (passwordHash, userId)
- `user-data:{userId}` — app data (seasons object)
- `sessions:{token}` — session record (7-day expiration)
- `reset:{token}` — password reset token (1-hour expiration)

### Build Process

`build.js` does two things:
1. Read `src/index.html`, replace `__API_URL__` placeholder with `process.env.API_URL`, write to `dist/index.html`
2. Copy static assets (`sw.js`, `manifest.json`, icons) from `src/` to `dist/`

**Critical**: `API_URL` must be set in `.env` (local) or as GitHub secret (CI). Build will fail if missing.

### Authentication Flow

- No self-service registration in the UI (removed in commit 321a8ae)
- User accounts managed via `tools/manage.sh` admin script (not in repo, gitignored)
- Login: POST `/login` → returns session token → stored in `localStorage` as `sessionToken`
- Authenticated requests: `Authorization: Bearer {token}` header
- Logout: POST `/logout` invalidates session server-side

### PWA

- `sw.js` — cache-first service worker for offline support
- `manifest.json` — Web App Manifest for install prompt
- Install banner appears if `beforeinstallprompt` event fires and user hasn't dismissed it

## Important Notes

- **Single-file architecture**: All HTML, CSS, and JavaScript live in `src/index.html` (~1300 lines)
- **Color palette**: 8 predefined colors in `COLORS` array — used for ticket category dots and buttons
- **German UI**: All user-facing text is in German
- **No framework**: No React, Vue, or build tools beyond the simple `build.js` script
- **Worker constraints**: Cloudflare Workers have CPU limits — PBKDF2 iterations reduced to 10k (commit 77dd70e) to stay within limits

## Recent Changes

- `bb8db97` — Improved color scheme for daylight contrast
- `51d8d36` — Added Gravity Card indicator badge to ticket cards
- `170ad9b`, `20b68c5`, `bf77d06` — Display Gravity Card price in statistics/season overview, add field to season modals
- `893e5a9` — Redesigned UI to focus on bikepark spending overview
- `a809c4f` — Added support for non-Gravity-Card tickets (the `reducesTheCurrentTotalOfTheGravityCardPrice` field)
- `38c0cb7` — Introduced per-season data management
- `d7a32fd` — Added background polling for real-time sync across devices

## Common Tasks

### Adding a new ticket field

1. Add the field to the category object in the `add()` function (creates new tickets)
2. Add the field to the modal HTML (ticket edit form)
3. Update `openEdit()` to populate the modal field from the category
4. Update `save()` in the modal to write the field back to the category
5. Update `render()` to display the field in the ticket card

### Changing colors

Edit the `COLORS` array near the top of the `<script>` section in `index.html`. The app uses these colors for ticket category dots and increment/decrement buttons.

### Modifying the Worker API

1. Edit `worker.js` to add/modify endpoints
2. Run `wrangler deploy` to deploy changes
3. Update `index.html` if the API contract changes (request/response format)

### Testing auth changes

Use `tools/manage.sh` (local admin script) to create test users, reset passwords, or delete accounts. The script is not in the repo; see README section "User Accounts" for details.
