# MomLaunchpad Admin

Internal operations dashboard for managing MomLaunchpad backend configuration — **not** part of the user-facing mobile app.

## Features

- **Dashboard** — user stats, chat topic analytics, voice call history, quota usage
- **Plans** — create/update/deactivate subscription plans; assign features with quotas
- **Features** — CRUD for feature flags (`chat`, `calendar`, `voice_calls`, etc.)
- **Languages** — enable/disable and mark languages as experimental
- **Settings** — edit system settings (e.g. AI assistant name)
- **Users** — look up by UUID: change plan, check/reset quota, grant feature overrides (with optional expiry), referral reward history
- **Community** — moderation reports, post status, expert badges, catalog (interests, badge types, events, countries)
- **Referrals** — leaderboard of users with pending points; grant rewards

## Prerequisites

1. Backend running at `http://localhost:8080` (`make dev` in `momlaunchpad-be`)
2. An admin user in PostgreSQL:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-admin@example.com';
```

## Quick start

```bash
cd momlaunchpad-admin
cp .env.example .env   # optional — dev uses Vite proxy
npm install
npm run dev
```

Open **http://localhost:5174** and sign in with your admin account.

## Configuration

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL. Leave empty in dev (proxied to `:8080`). Set to `https://api.momlaunchpad.com` in production. |

## Production build

```bash
npm run build
npm run preview
```

Serve the `dist/` folder behind your internal network or VPN. Do **not** expose this dashboard publicly without additional auth (SSO, IP allowlist, etc.).

## API

All routes call `/api/admin/*` on the MomLaunchpad backend. See [momlaunchpad-be/API.md](../momlaunchpad-be/API.md).
