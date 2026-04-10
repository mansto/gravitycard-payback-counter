<div align="center">

# 🃏 Gravity Card Payback Counter

**A sleek PWA for tracking your Gravity Card purchases by category — with budget control and user accounts.**

![PWA](https://img.shields.io/badge/PWA-ready-blueviolet?style=flat-square&logo=googlechrome)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222?style=flat-square&logo=github)

</div>

---

## ✨ Features

| | |
|---|---|
| 🎿 **Ticket Counters** | Create custom ticket categories, each with its own color and price |
| 💰 **Budget Tracking** | Set the Gravity Card price and watch your remaining balance update in real time |
| 🔐 **User Accounts** | Login with username and password — each user sees only their own data |
| 📱 **Installable PWA** | Add to home screen on iOS and Android for a native app experience |
| ☁️ **Cloud Storage** | All data stored in Cloudflare KV — reliable across browser restarts and devices |

---

## 📸 App Overview

```
┌─────────────────────────────┐
│   🔐 Login                  │  Username + password
├─────────────────────────────┤
│   💳 Budget Panel           │  Set Gravity Card price · live remaining balance in €
├─────────────────────────────┤
│   🎿 Ticket Cards           │  Per-ticket counter · increment / decrement
└─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES2020+) |
| UI | HTML5 + CSS3, single-file SPA |
| Storage | Cloudflare Workers + KV (per-user data isolation) |
| Auth | PBKDF2-SHA-256 passwords · session tokens in KV (7-day TTL) |
| PWA | Service Worker (cache-first) + Web App Manifest |
| Build | Node.js build script — injects `API_URL` at build time |
| CI/CD | GitHub Actions → GitHub Pages |
| Fonts | Google Fonts — Bebas Neue, IBM Plex Mono |

---

## 📁 Project Structure

```
├── src/
│   ├── index.html      # Application (HTML + CSS + JS), uses __API_URL__ placeholder
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service Worker
│   ├── icon-192.jpg    # App icon
│   └── icon-512.jpg    # App icon (large)
├── dist/               # Built output (gitignored) — deployed to GitHub Pages
├── tools/              # Local admin scripts (gitignored)
│   └── manage.sh       # User management: create / delete / reset-password
├── worker.js           # Cloudflare Worker (auth endpoints + KV storage)
├── wrangler.toml       # Cloudflare Workers configuration
├── build.js            # Build script: injects API_URL + copies assets to dist/
├── package.json
├── .env.example        # Template for local development
└── .github/
    └── workflows/
        └── deploy.yml  # CI/CD: build + deploy to gh-pages on push to main
```

---

## ☁️ Cloudflare Workers Setup

The app backend runs as a Cloudflare Worker with KV storage. All user accounts and app data are stored there.

### First-time setup

**1. Install Wrangler and log in**
```bash
npm install -g wrangler
wrangler login
```

**2. Create the KV namespace**
```bash
wrangler kv namespace create GRAVITY_KV
```
Copy the returned `id` into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "GRAVITY_KV"
id = "your-kv-id-here"
```

**3. Deploy the Worker**
```bash
wrangler deploy
```
Note the Worker URL printed at the end — you'll need it as the `API_URL` secret.

### Worker API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | — | Create a user account |
| `POST` | `/login` | — | Authenticate, receive session token |
| `POST` | `/logout` | session | Invalidate session |
| `POST` | `/reset-request` | — | Generate a password reset token |
| `POST` | `/reset-confirm` | — | Set a new password using a reset token |
| `GET` | `/` | session | Load the authenticated user's data |
| `PUT` | `/` | session | Save the authenticated user's data |

### KV data structure

```
users:{username}       → account (passwordHash, userId, …)
user-data:{userId}     → app data (categories, budget)
sessions:{token}       → session record (7-day TTL)
reset:{token}          → reset record (1-hour TTL)
```

---

## 🚀 Deployment (GitHub Actions)

On every push to `main`, GitHub Actions builds the app and deploys it to the `gh-pages` branch.

### Required GitHub Repository Secret

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `API_URL` | Worker URL from `wrangler deploy` |

### GitHub Pages configuration

After the first successful workflow run, go to **Settings → Pages** and set the source branch to `gh-pages`.

---

## 💻 Local Development

**1. Copy and fill in `.env`**
```bash
cp .env.example .env
# edit .env: set API_URL to your Worker URL
```

**2. Build**
```bash
npm install
npm run build
```

**3. Serve `dist/`**
```bash
npx serve dist
```

---

## 🔐 User Accounts

User registration and password management are handled via the local admin script — there is no self-service registration in the app UI.

- **Login** — session is stored in `localStorage` and lasts 7 days
- **Logout** — button in the app header; invalidates the session on the server
- **Data isolation** — each user account has its own data; no cross-user access

---

## 🎿 Tickets

Each ticket has:

- **Name** — e.g. *Wexltrails halbtags*, *Wexltrails ganztags*
- **Color** — pick from 8 accent colors
- **Ticket price** — every `+` click deducts this amount (in €) from the Gravity Card balance

---

## 💳 Budget

Enter the price of your Gravity Card. Every `+` click on any ticket deducts its price from the remaining balance. Every `−` click refunds it.

| Status | Color |
|--------|-------|
| Balance still positive (card not yet paid off) | 🔴 Red |
| Balance at zero or below (card has paid off) | 🟢 Green |
| No price set | ⚫ Gray |
