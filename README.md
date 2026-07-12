# TransitOps — Smart Transport Operations Platform

A full-stack app for managing a vehicle fleet: vehicles, drivers, trips,
maintenance, fuel/expenses, and reporting, with role-based access for four
staff roles (Fleet Manager, Driver, Safety Officer, Financial Analyst).

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Recharts
- **Backend:** Node.js, Express 5, MySQL, Sequelize
- **Auth:** JWT + bcrypt (bcryptjs), 4-role RBAC enforced server-side
- **Uploads:** Multer (vehicle documents)
- **Email:** Nodemailer (falls back to console/DB logging if SMTP isn't configured)
- **Export:** CSV (json2csv) and PDF (pdfkit)
- **Scheduling:** node-cron (daily license-expiry sweep)

## Folder structure

```
transitops/
├── backend/          Express API (src/models, controllers, routes, middleware, jobs, seed)
├── frontend/          Vite + React app (src/pages, components, context, api)
├── package.json       Root convenience scripts (install:all, dev, seed)
└── README.md
```

## Prerequisites

- Node.js 18+
- A running MySQL server (MySQL 8+ recommended) — either:
  - **Local:** install MySQL Community Server (or MySQL Workbench's bundled server)
    and have it running on `127.0.0.1:3306`, or
  - **Cloud/managed:** any hosted MySQL instance (PlanetScale, RDS, etc.) — grab its
    host/port/user/password
- The database itself (`transitops` by default) does **not** need to exist ahead
  of time for the app to start — `npm run seed` creates/recreates all tables via
  Sequelize `sync({ force: true })` — but the MySQL *server* and the target
  database schema must be reachable with the credentials in `.env` (create the
  database once with `CREATE DATABASE transitops;` if your MySQL user doesn't
  have permission to create databases itself).

## 1. Install dependencies

From the repo root:

```bash
npm run install:all
```

This installs the root, `backend/`, and `frontend/` dependencies in one shot.
(Equivalent manual steps: `cd backend && npm install`, `cd frontend && npm install`.)

## 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — your MySQL
  connection details (defaults assume a local server on `127.0.0.1:3306` with
  a `root` user)
- `JWT_SECRET` — any long random string
- `SMTP_*` — optional; leave blank to simulate license-reminder emails (they're
  logged to the console and saved to the `EmailLog` table instead of sent)

`frontend/.env` can stay empty for local dev — the Vite dev server proxies
`/api` and `/uploads` to `http://localhost:5000` (see `frontend/vite.config.js`).

## 3. Seed demo data

```bash
npm run seed
```

This drops and recreates every table (`sequelize.sync({ force: true })`) then
seeds 4 roles, 4 users (one per role), 7 vehicles, 6 drivers, and trips/
maintenance/fuel/expense records covering every lifecycle state. Safe to
re-run any time you want a clean slate. All demo accounts use the password
`Password123!`:

| Role | Email |
|---|---|
| Fleet Manager | fleetmanager@transitops.demo |
| Safety Officer | safety@transitops.demo |
| Financial Analyst | finance@transitops.demo |
| Driver | driver@transitops.demo |

## 4. Run the app

From the repo root, start both servers together:

```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend: http://localhost:5173 (open this in your browser)

Or run them separately in two terminals:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

## Feature notes

- All routes except `POST /api/auth/login` require a valid JWT; the frontend
  redirects to `/login` on any 401.
- Every business rule from the spec (unique registration numbers, dispatch-pool
  eligibility, license/status checks, cargo-weight limits, maintenance/trip
  status side-effects) is enforced **server-side** in the controllers, not just
  hidden in the UI.
- CSV and PDF exports are on the Reports page; both stream through an
  authenticated `axios` request (not a plain link) since the API requires a
  Bearer token.
- Dark mode is a toggle in the sidebar, persisted to `localStorage`.
- The license-expiry reminder job runs daily via `node-cron` and can also be
  triggered on demand from the Drivers page ("Check License Reminders") for
  demoing without waiting for the schedule.

## Testing a section quickly

- **Auth/RBAC:** log in as each demo account; the sidebar links change per role.
- **Vehicles/Drivers:** create, edit, search/filter/sort, then try creating a
  duplicate registration number or license number — should 409.
- **Trips:** create a Draft trip, Dispatch it (vehicle/driver flip to "On Trip"),
  Complete or Cancel it, and confirm vehicle/driver status reverts to Available.
- **Maintenance:** open a record on an Available vehicle — it flips to "In Shop"
  and disappears from the trip-creation vehicle dropdown; Close it to restore.
- **Reports:** Export CSV/PDF from the Reports page and confirm the numbers
  match what you'd expect from the fuel/expense/trip data you've entered.
