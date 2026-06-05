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

Open **http://localhost:5174** for the public marketing site (includes **Download Android app** from the latest APK on [momlaunchpad-app releases](https://github.com/themobileprof/momlaunchpad-app/releases)). Sign in at **http://localhost:5174/access** (not linked from the homepage) with your admin account.

## Configuration

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL. Leave empty in dev (proxied to `:8080`). Set to `https://api.momlaunchpad.com` in production. |
| `VITE_ADMIN_SIGN_IN_PATH` | Obscure ops sign-in path (default `/access`). Not exposed on the marketing homepage. |
| `VITE_APP_GITHUB_REPO` | Repo for latest APK (`themobileprof/momlaunchpad-app`). |
| `VITE_GITHUB_API_BASE_URL` | GitHub API base (default `https://api.github.com`). |

## Production build

```bash
npm run build
npm run preview
```

Serve the `dist/` folder at **`/var/www/momlaunchpad.com`** with nginx (`momlaunchpad-be/deploy/nginx/momlaunchpad.com.conf`).

## Deploy on push (GitHub Actions)

Pushing to **`main`** runs `.github/workflows/deploy.yml`:

1. `npm ci` → lint → production build (`VITE_API_BASE_URL` baked in)
2. `rsync` `dist/` to `/var/www/momlaunchpad.com` on the server — **the workflow is green when this finishes**
3. Optional smoke check via nginx (`Host: momlaunchpad.com`); a warning here does not fail the deploy

### Required GitHub secrets (same server as the API)

The deploy job uses the **`production`** environment. Add these as **repository secrets** or **production environment secrets** (environment wins if both exist):

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP or hostname |
| `SSH_USERNAME` | SSH user (e.g. `sammy`) — must be able to write to `/var/www/momlaunchpad.com` |
| `SSH_PRIVATE_KEY` | Full private key PEM, including `-----BEGIN … KEY-----` lines (paste multiline secret as-is) |

The matching **public** key must be in `~/.ssh/authorized_keys` on the server for `SSH_USERNAME`.

### Optional repository variables

| Variable | Default |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.momlaunchpad.com` |
| `VITE_ADMIN_SIGN_IN_PATH` | `/access` |
| `VITE_APP_GITHUB_REPO` | `themobileprof/momlaunchpad-app` |

PRs run **CI only** (lint + build, no deploy). Use **Actions → Deploy site → Run workflow** to redeploy manually.

Do **not** expose `/console` publicly without network restrictions; the marketing site is public at `/`.

## API

All routes call `/api/admin/*` on the MomLaunchpad backend. See [momlaunchpad-be/API.md](../momlaunchpad-be/API.md).
