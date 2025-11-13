## Attendance Prediction Pipeline (Advanced Plan)

The advanced deployment tier includes a LightGBM-based absenteeism predictor refreshed on a rolling cadence.

### Data sources

- `attendance` table (labels & historical presence)
- `schedule_entry` table (session metadata)
- `enrollment` table (student ↔ subject membership)
- Optional CSV imports via the seed tool for legacy semesters

### Feature engineering

1. **Rolling absence ratio** – previous 5 sessions per student/subject.
2. **Recent absence streak** – consecutive absences ahead of the current session.
3. **Session index** – class count within the semester, normalised per student.
4. **Subject popularity** – cohort-level absence rate for the class.
5. **Day-of-week encoding** – sine/cosine cyclical features for timetable patterns.

See `packages/ml/train.py` for the reference implementation and feature generation helpers.

### Model training

- Algorithm: LightGBM binary classifier (`binary` objective, AUC metric).
- Train/test split: 80/20 stratified by tenant + subject.
- Early stopping with up to 200 boosting rounds.
- Artefacts stored in `artifact/ml` for downstream deployment.

### Evaluation

- ROC AUC (global)
- Precision @ 0.5 decision threshold
- Gain-based feature importance JSON emitted for dashboards.

### Deployment workflow

1. Nightly GitHub Actions job runs `python packages/ml/train.py` against the latest warehouse snapshot.
2. Model artefacts versioned in object storage (`oam-ml-artifacts/{date}/`).
3. Backend exposes `/api/v1/insights/risk` (future work) to serve predictions aggregated by session.
4. Frontend `FacultyAttendancePage` surfaces the `riskLevel` hints for same-day classes and allows proactive WhatsApp alerts.

### Monitoring

- Metrics pushed to Prometheus using `metrics.json` (AUC) for drift alerts.
- Optional Grafana dashboard displays risk-distribution across tenants and subjects.
- Retraining cadence configurable per tenant (default: weekly; falls back to monthly if volume is limited).







