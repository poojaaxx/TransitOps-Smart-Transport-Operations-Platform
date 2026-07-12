# TransitOps — Smart Transport Operations Platform

A full-stack MERN app for managing a vehicle fleet: vehicles, drivers, trips,
maintenance, fuel/expenses, and reporting, with role-based access for four
staff roles (Fleet Manager, Driver, Safety Officer, Financial Analyst).

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Recharts
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
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
- A MongoDB instance — either:
  - **Local:** install MongoDB Community Server and have `mongod` running on `127.0.0.1:27017`, or
  - **Atlas:** a free cluster at https://www.mongodb.com/atlas — grab its connection string

> This project was scaffolded in an environment with no local MongoDB and no
> Docker available, so the backend has been syntax-checked but not run
> end-to-end. Set `MONGO_URI` (see below) and it should connect on the first try —
> if you hit an issue, check the server console output first.

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

- `MONGO_URI` — local (`mongodb://127.0.0.1:27017/transitops`) or your Atlas connection string
- `JWT_SECRET` — any long random string
- `SMTP_*` — optional; leave blank to simulate license-reminder emails (they're
  logged to the console and saved to the `EmailLog` collection instead of sent)

`frontend/.env` can stay empty for local dev — the Vite dev server proxies
`/api` and `/uploads` to `http://localhost:5000` (see `frontend/vite.config.js`).

## 3. Seed demo data

```bash
npm run seed
```

Seeds 4 users (one per role), 7 vehicles, 6 drivers, and trips/maintenance/fuel/
expense records covering every lifecycle state. All demo accounts use the
password `Password123!`:

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
