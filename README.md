# DigitalSignage

DigitalSignage is a full-stack digital signage system for managing and displaying media content.

The project has two applications:

- apiAdonis: AdonisJS API (TypeScript) for authentication, media management, HTML notices, and player defaults.
- react_frontend: React dashboard and player UI.

## Current Architecture

- Backend: AdonisJS 6, Lucid ORM, SQLite (default), token-based auth.
- Frontend: React 19 + React Router + MUI.
- Storage: media and generated HTML files are served from apiAdonis/public/media.
- Database: apiAdonis/tmp/db.sqlite3 (by default).

## Repository Structure

- apiAdonis: backend app, routes, controllers, models, migrations, tests.
- react_frontend: web app for login, dashboard, admin dashboard, users, profile, and player.
- README.md: this file.

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)

## 1) Backend Setup (apiAdonis)

1. Open a terminal in apiAdonis.
2. Install dependencies:

```bash
npm install
```

3. Create a .env file in apiAdonis with at least the required variables:

You can generate APP_KEY with:

```bash
node ace generate:key
```

```env
NODE_ENV=development
PORT=3333
HOST=0.0.0.0
APP_KEY=replace-with-a-secure-random-string
LOG_LEVEL=info

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
```

4. Run migrations:

```bash
node ace migration:run
```

5. Start backend in development mode:

```bash
npm run dev
```

Backend default URL: http://localhost:3333

## 2) Frontend Setup (react_frontend)

1. Open a second terminal in react_frontend.
2. Install dependencies:

```bash
npm install
```

3. Start frontend:

```bash
npm start
```

Frontend default URL: http://localhost:3000

The frontend API client automatically points to:

- http://<current-hostname>:3333

So if you open the frontend from another machine on LAN, it will call the backend on that same machine hostname/IP.

## Running Both Apps

Use two terminals:

Terminal 1:

```bash
cd apiAdonis
npm run dev
```

Terminal 2:

```bash
cd react_frontend
npm start
```

## Main Frontend Routes

- /login
- /dashboard
- /admin/dashboard
- /perfil
- /usuarios
- /player

Notes:

- /player is public for signage playback.
- Dashboard and admin routes require authentication.

## Main API Routes

Authentication:

- POST /sessions
- GET /sessions/me
- DELETE /sessions

Users and passwords:

- POST /users (admin)
- GET /users (admin)
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id (admin)
- POST /change-password/:id
- PUT /change-password/admin/:id (admin)

Media player:

- POST /player
- GET /player (public)
- GET /player/:id (public)
- PUT /player/:id
- DELETE /player/:id

HTML notices:

- POST /html
- POST /html/deadline
- POST /html/duplicate/:id
- GET /html (public)
- GET /html/:id (public)
- PUT /html/:id
- DELETE /html/:id

Manifest/defaults:

- POST /defaults
- GET /manifest (public)

Admin utility:

- GET /admin/state (admin)

Public media:

- GET /media/:filename

For full request/response examples, see apiAdonis/API_ROUTES.md.

## Backend Scripts (apiAdonis)

```bash
npm run dev        # Development server with HMR
npm run start      # Start server (non-HMR)
npm run build      # Build for production
npm run test       # Run tests
npm run lint       # Lint
npm run format     # Prettier
npm run typecheck  # TypeScript checks
```

## Frontend Scripts (react_frontend)

```bash
npm start          # Development server
npm run build      # Production build
npm test           # Tests
```

## Deployment

The project supports deployment with **Vercel** (frontend) and **Fly.io** (backend).

### Frontend — Vercel

1. Import the repository on [Vercel](https://vercel.com).
2. Set the root directory to `react_frontend`.
3. Add the environment variable `REACT_APP_API_URL` pointing to your Fly.io backend URL (e.g. `https://digitalsignage-api.fly.dev`).
4. Vercel auto-detects React and deploys on every push to `main`.

The `vercel.json` in `react_frontend/` handles SPA rewrites.

### Backend — Fly.io

1. Install [flyctl](https://fly.io/docs/flyctl/install/).
2. From the `apiAdonis/` folder:

```bash
fly launch          # first-time setup (creates app + volume)
fly deploy          # subsequent deploys
```

3. Set secrets:

```bash
fly secrets set APP_KEY="your-key" FRONTEND_URL="https://your-app.vercel.app"
```

4. Run migrations on the remote machine:

```bash
fly ssh console -C "node ace migration:run --force"
```

The `fly.toml` in `apiAdonis/` configures the app (region `gru`, persistent volume for SQLite + media files, health check on `/manifest`).

### Useful Fly.io commands

| Action             | Command            |
| ------------------ | ------------------ |
| View deploy status | `fly status`       |
| Live logs          | `fly logs`         |
| SSH into machine   | `fly ssh console`  |
| List secrets       | `fly secrets list` |
| Manual redeploy    | `fly deploy`       |

> **Note:** SQLite requires a single machine. Keep `fly scale count 1`.

## Troubleshooting

Port already in use:

```bash
lsof -nP -iTCP:3333 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Then stop the process using that port or change PORT in apiAdonis/.env.

Database issues:

- Confirm migrations were executed.
- If needed for local reset, delete apiAdonis/tmp/db.sqlite3 and rerun migrations.

Auth redirect to login:

- The frontend clears session and redirects when API returns 401.

## Status

This README reflects the current folder structure, scripts, and routing of this repository as of 2026-03-30.
