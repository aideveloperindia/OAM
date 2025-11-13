- [ ] Landing page copy matches provided hero headline, subhead, CTAs, and footer links.
- [ ] PWA installs successfully on Chrome (Android + Desktop) with offline fallback page.
- [ ] Faculty can capture attendance while offline; queue displays pending/synced counts.
- [ ] Dexie IndexedDB stores roster cache, queued attendance, and sync events per tenant.
- [ ] Background sync triggers automatic retries when connectivity returns.
- [ ] Notify Parents modal prepares WhatsApp links for absences and predicted high-risk alerts; CSV export works.
- [ ] Sync Monitor manual sync merges records with `/attendance/bulk` and records results.
- [ ] Student dashboard shows overall percentage, subject summaries, and upcoming sessions.
- [ ] Admin reports render aggregated data with CSV export, enforcing RBAC (admin only).
- [ ] Privacy and Help routes available from footer; outline consent and support steps.
- [ ] OpenAPI spec available at `/api/v1/openapi.json`; matches documented endpoints.
- [ ] Docker Compose stack (`docker-compose up --build`) serves frontend on port 4173 and backend on port 4100.
- [ ] GitHub Actions pipeline runs unit tests, Playwright e2e suite, and Docker builds.
- [ ] Quotation PDFs (standard & advanced) generated in `/artifact` and print correctly.
- [ ] Walkthrough video (`OAM_Staging_<date>.mp4`) accessible in `/artifact`.
- [ ] ML pipeline artefacts (`artifact/ml`) generated via `python packages/ml/train.py`.
- [ ] README includes staging instructions, credentials, and command cheatsheet.







