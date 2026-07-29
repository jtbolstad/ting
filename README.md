# Ting — Community Tool Lending

A full-stack tool library management system for community makerspaces, built with Node.js, TypeScript, and React.

## Features

- 🔐 **User Authentication** — JWT-based auth with admin/member/manager roles
- 📦 **Item Catalog** — Browse and search tools by category, with approval workflow
- 📅 **Reservations** — Book items in advance with conflict detection
- ✅ **Loans** — Check-in/check-out tracking
- 📧 **Email Reminders** — Automated due date and overdue notifications
- 👨‍💼 **Admin Dashboard** — Manage items, users, loans, and organizations
- 🏢 **Multi-organization** — Multiple lending orgs in one instance
- 🎨 **Modern UI** — Responsive design with TailwindCSS

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite with Prisma ORM |
| Auth | JWT + bcrypt |
| Email | Nodemailer (configurable SMTP) |
| Process manager | PM2 (production) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Database setup

```bash
cd packages/server
pnpm run db:migrate   # apply migrations
pnpm run db:seed      # seed demo data
```

### Start dev servers

```bash
# from repo root — two terminals
pnpm run dev:server   # API on http://localhost:3001
pnpm run dev:client   # UI  on http://localhost:3000
```

### Test accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Platform admin | `admin@ting.com` | `admin123` |
| Org manager | `emma@ting.com` | `user123` |
| Member | `lars@ting.com` | `user123` |

## Project Structure

```
ting/
├── packages/
│   ├── shared/           # Shared TypeScript types
│   ├── server/           # Express API backend
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       ├── services/ # Business logic (email)
│   │       ├── jobs/     # Background jobs (reminders)
│   │       └── middleware/
│   └── client/           # React frontend
│       └── src/
│           ├── api/      # API client
│           ├── components/
│           ├── context/  # Auth + org state
│           └── pages/
├── e2e/                  # Playwright E2E tests
├── scripts/              # Dev utilities
├── planning/             # Roadmap, specs, bugs
└── ecosystem.config.js   # PM2 process config
```

## Testing

```bash
pnpm test             # Unit tests (Vitest, Node env)
pnpm test:browser     # Component tests (Vitest Browser + Playwright)
pnpm test:e2e         # E2E tests (Playwright, requires running servers)
```

Three-layer strategy:

| Layer | Files | What it tests |
|---|---|---|
| Unit | `*.test.ts` | Pure functions, utilities |
| Component | `*.browser.test.tsx` | React components in real browser via MSW |
| E2E | `e2e/*.spec.ts` | Full user journeys against real backend |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user (requires `organizationId`)
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user + memberships

### Items
- `GET    /api/items` — List/search items
- `GET    /api/items/:slug` — Get item (accepts slug or id)
- `POST   /api/items` — Create item
- `PATCH  /api/items/:slug` — Update item
- `DELETE /api/items/:slug` — Delete item
- `POST   /api/items/:slug/approve` — Approve pending item (manager+)
- `POST   /api/items/:slug/reject` — Reject pending item (manager+)

### Categories / Locations / Organizations / Users / Reservations / Loans / Reviews / Comments / Uploads

See route files in `packages/server/src/routes/` for full endpoint reference.

## Production Deployment

Ting runs on a VPS with **PM2** as the process manager. Deployment is triggered automatically on push to `main` via a GitHub Actions webhook.

### Architecture

```
GitHub push → GitHub Actions → SSH webhook → VPS
                                              ├── git pull
                                              ├── pnpm install
                                              ├── pnpm build
                                              ├── prisma migrate deploy
                                              └── pm2 reload ting
```

- App served at port 3001 (behind a reverse proxy)
- SQLite database at `/var/data/db.sqlite` (persistent volume)
- PM2 config: `ecosystem.config.js`

### Environment variables (production)

Set in `packages/server/.env` on the VPS:

```env
NODE_ENV=production
DATABASE_URL="file:/var/data/db.sqlite"
JWT_SECRET="your-secure-random-secret"
```

Optional email (SMTP) and SmartOrg integration variables — see `packages/server/.env.example`.

### Manual deploy

```bash
pnpm run build                         # build all packages
cd packages/server
npx prisma migrate deploy              # apply pending migrations
pm2 reload ting                        # zero-downtime restart
```

## Stage

Stage runs on the same VPS as production, with its own port, checkout, database and uploads directory. Nothing is shared between the two.

```
nginx (443, Let's Encrypt)
 ├─ ting.hpvel.no        → :3001   PM2 "ting"        /var/www/ting        (branch main)
 └─ stage.ting.hpvel.no  → :3002   PM2 "ting-stage"  /var/www/ting-stage  (branch stage)

/var/data/db.sqlite            prod DB     /var/data/uploads/
/var/data/stage/db.sqlite      stage DB    /var/data/stage/uploads/
```

Branch flow: `feature → stage → main`. Pushing to `stage` triggers `.github/workflows/deploy-stage.yml`; merging `stage` into `main` deploys to production. Both PM2 apps are defined in `ecosystem.config.js`, so **every `pm2` command must be scoped** — `pm2 startOrRestart ecosystem.config.js --only ting-stage` — or a deploy to one environment will restart the other.

Stage differs from production in three ways, all driven by `APP_ENV=stage`:

- an amber "STAGE" banner in the UI (`VITE_APP_ENV=stage` at build time)
- `X-Robots-Tag: noindex, nofollow` on every response, so the public subdomain stays out of search results
- `/health` reports `{ env, commit }`, which the deploy workflow asserts against before declaring success

Its `.env` deliberately has **no `SMTP_HOST`**. The email service then logs messages and records them in `EmailLog` with `status: "dev"` instead of sending, so test runs cannot mail real members.

### Refreshing stage data

```bash
# on the VPS, as the deploy user
/var/www/ting-stage/scripts/refresh-stage-db.sh
```

Snapshots the production database (via SQLite's online backup API, safe on a live DB), replaces personal data, and swaps the result into `/var/data/stage/db.sqlite`. The previous stage DB is kept as a timestamped `.bak`. Add `SYNC_UPLOADS=1` to copy item photos too.

Afterwards every user is `userN@stage.invalid` with the password `stage123` (override with `STAGE_PASSWORD`), and the first platform admin becomes `admin@stage.invalid`.

> **The refreshed data is pseudonymized, not anonymous.** Names, emails, comments and email logs are replaced, but real reservation history, loan history, organization names and item catalogues remain — enough to identify people by inference. Treat stage access as internal.

### E2E tests against stage

```bash
PLAYWRIGHT_BASE_URL=https://stage.ting.hpvel.no \
E2E_EMAIL=user1@stage.invalid E2E_PASSWORD=stage123 \
pnpm test:e2e
```

Setting `PLAYWRIGHT_BASE_URL` skips the local dev servers that `playwright.config.ts` would otherwise start.

## Syncing Production DB to Local

Pull the live SQLite database to your local dev environment:

```bash
pnpm run db:sync-from-prod
```

This runs `scripts/sync-db-from-prod.ps1`, which:

1. Reads `VPS_HOST` (and optionally `VPS_DB`, `SSH_KEY`) from `.env` or environment
2. Backs up your current `packages/server/prisma/dev.db`
3. Downloads the production DB via `scp`

Configure in your `.env` (repo root or `packages/server/.env`):

```env
VPS_HOST="deploy@your-server-ip"
VPS_DB="/var/data/db.sqlite"    # default
SSH_KEY="~/.ssh/id_rsa"         # default
```

## Database

### Migrations

```bash
cd packages/server
pnpm run db:migrate        # dev — create + apply new migration
npx prisma migrate deploy  # prod — apply pending migrations only
```

### Reset local database

```bash
cd packages/server
rm prisma/dev.db
pnpm run db:migrate
pnpm run db:seed
```

## Email Reminders

Automated reminders for items due tomorrow and overdue items.

```bash
# Run manually
cd packages/server
pnpm run reminders

# Cron (daily at 09:00)
0 9 * * * cd /var/www/ting/packages/server && pnpm run reminders
```

Configure SMTP in `packages/server/.env` — see `.env.example`.

## SmartOrg Integration

Optional membership verification via [SmartOrg](https://smartorg.no). When `SMARTORG_API_KEY` is set, users must be active members to register or log in.

```env
SMARTORG_API_URL=https://api.smartorg.no
SMARTORG_API_KEY=your-api-key
SMARTORG_ORG_ID=your-organization-id
```

## License

MIT
