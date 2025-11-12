# CollegeAttend – Production Attendance PWA

CollegeAttend delivers a mobile-first, offline-capable attendance workflow for SCEE and SCIT. The mono-repo contains:

- `apps/frontend` – React + TypeScript + Vite PWA with Dexie offline queueing, React Query sync, and WhatsApp notification tooling.
- `apps/backend` – Express + Prisma + PostgreSQL API with JWT auth, RBAC, and attendance reporting.
- `packages/artifacts` – build scripts for quotation PDFs and the walkthrough mp4.
- `packages/e2e` – Playwright end-to-end smoke covering offline capture, sync, reporting, and notifications.
- `packages/ml` – LightGBM absenteeism pipeline scaffold for the advanced quotation tier.

> **Staging note:** Bring up the stack locally via Docker Compose (`docker-compose up --build`) and, if you need a shareable URL, expose the frontend with `npx localtunnel --port 4173` (or any tunnel service of choice). The generated walkthrough video in `/artifact` demonstrates the staging flow end-to-end.

## Quick start

```bash
yarn install                                   # install dependencies
yarn dev:frontend                              # (frontend) Vite dev server at http://localhost:5173
yarn start:backend                             # (backend) ts-node-dev API on http://localhost:4000
yarn test                                      # run backend + frontend unit tests
docker-compose up --build                      # production-like stack (frontend :4173, backend :4100)
```

Additional commands:

- `yarn workspace backend prisma migrate deploy` – apply migrations against the configured DATABASE_URL.
- `yarn workspace backend prisma db seed` – reseed tenants, users, schedule, and sample attendance.
- `yarn workspace frontend build` / `yarn workspace backend build` – production builds.
- `yarn workspace e2e test` – Playwright offline-first flow (requires `yarn workspace frontend build` first).

## Seed credentials

| Role      | Campus | Email                               | Password             |
|-----------|--------|-------------------------------------|----------------------|
| Admin     | SCEE   | `admin.scee@collegeattend.in`       | `CollegeAttend@123`  |
| Admin     | SCIT   | `admin.scit@collegeattend.in`       | `CollegeAttend@123`  |
| Faculty   | SCEE   | `saiteja@scee.edu.in`               | `CollegeAttend@123`  |
| Faculty   | SCIT   | `anusha.priya@scit.edu.in`          | `CollegeAttend@123`  |
| Student   | SCEE   | `scee2101@scee.edu.in`              | `CollegeAttend@123`  |
| Student   | SCIT   | `scit2201@scit.edu.in`              | `CollegeAttend@123`  |

Tenants: `scee`, `scit`. The frontend tenant selector persists between sessions and scopes Dexie stores.

## Offline-first teacher workflow

1. Faculty attendance loads the active schedule entry and cached roster (Dexie `rosterCache`).
2. Status toggles enqueue records into `queuedAttendance`; `Save session (offline)` commits them when offline.
3. Background sync registers (`SyncManager`) and manual sync (`Sync Monitor`) posts to `/attendance/bulk`.
4. `Notify Parents` modal prepares WhatsApp click-to-chat links for absences and predicted high-risk alerts, with CSV export and batch open support.
5. Sync status badges appear per student row and aggregated metrics appear in `Sync Monitor`.

## Testing & CI

- `yarn test` – backend Vitest (mocked Prisma) + frontend Vitest (`@testing-library`) suites.
- `yarn workspace e2e test` – Playwright scenario: login → offline save → notify → sync → export.
- GitHub Actions (`.github/workflows/ci.yml`) runs unit tests, generates quotation PDFs & walkthrough video, executes Playwright, and validates Docker builds on every push/PR.

## Docker & deployment

- `docker-compose up --build` – brings up Postgres, API (`localhost:4100`), and nginx-served PWA (`localhost:4173`).
- `apps/backend/Dockerfile` – multi-stage Node/Prisma build.
- `apps/frontend/Dockerfile` – Vite builder → nginx runner (with API reverse proxy).

For live demos, run Docker Compose, then expose `4173` through a tunnel (e.g. `npx localtunnel --port 4173`) and share the provided URL.

## Artefacts & documentation

- `artifact/Quotation_Standard.pdf` & `artifact/Quotation_Advanced.pdf` – generated via `yarn workspace artifacts generate:quotes`.
- `artifact/CollegeAttend_Staging_<date>.mp4` – silent walkthrough video produced by `yarn workspace artifacts generate:walkthrough` (requires `pip install -r packages/artifacts/requirements.txt`).
- `artifact/ml/` – LightGBM model + metrics via `python packages/ml/train.py` (after installing `packages/ml/requirements.txt`).
- `docs/openapi.yaml` – OpenAPI 3.1 spec (also served at `/api/v1/openapi.json`).
- `docs/ml-pipeline.md` – deployment notes for the prediction module.
- `docs/acceptance-checklist.md` – management sign-off list.

## Advanced analytics pipeline

The ML blueprint under `packages/ml` trains a LightGBM model on historical attendance to emit risk probabilities per student/session. Outputs (`artifact/ml`) are intended for future ingestion by the API (e.g. `/api/v1/insights/risk`) and drive the `riskLevel` field shown in the faculty roster.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r packages/ml/requirements.txt
python packages/ml/train.py
```

## Useful links

- Frontend PWA manifest: `apps/frontend/public/manifest.json`
- Service worker (Workbox injectManifest): `apps/frontend/src/service-worker.ts`
- Dexie DB schema: `apps/frontend/src/data/db.ts`
- Prisma schema & migrations: `apps/backend/prisma/schema.prisma`
- API routes: `apps/backend/src/routes`
- Background sync bridge: `apps/frontend/src/providers/ServiceWorkerBridge.tsx`

## Support

Submit issues or feature requests via your private Git repository. For operational incidents, follow the escalation ladder defined in the advanced quotation (premium support available at ₹15,000/month for 20 hours). PRs run the same CI workflow described above.


