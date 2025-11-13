# OAM ML Pipeline

This micro-package contains a reproducible LightGBM training script for the Attendance Prediction add-on described in the advanced quotation.

## Prerequisites

- Python 3.11+
- Recommended virtual environment (``python -m venv .venv``)

```bash
pip install -r requirements.txt
```

## Training

The sample dataset under ``data/sample_attendance.csv`` contains anonymised attendance events for multiple tenants and subjects. The target column ``risk_label`` marks historical sessions that should be treated as high-risk for absenteeism.

Run the trainer:

```bash
python train.py
```

Outputs land in ``artifact/ml`` at the repository root:

- ``lightgbm_attendance.txt`` – serialized booster for inference
- ``scaler.json`` – z-score scaler parameters for real-time pipelines
- ``metrics.json`` – ROC AUC and Precision@0.5 snapshot
- ``feature_importance.json`` – gain-based feature importances

These artefacts are consumed by the deployment workflow described in ``docs/ml-pipeline.md``.







