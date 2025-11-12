from __future__ import annotations

import json
from pathlib import Path
from typing import Tuple

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / 'data'
ARTIFACT_DIR = ROOT_DIR / 'artifact' / 'ml'
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

DATA_PATH = DATA_DIR / 'sample_attendance.csv'


def load_dataset() -> pd.DataFrame:
  df = pd.read_csv(DATA_PATH, parse_dates=['date'])
  df.sort_values(['student_id', 'date'], inplace=True)
  df['is_absent'] = (df['attendance_status'] == 'ABSENT').astype(int)
  return df


def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
  df = df.copy()

  df['session_index'] = df.groupby('student_id').cumcount()

  df['past_absent_ratio'] = (
      df.groupby('student_id')['is_absent']
      .transform(lambda s: s.shift().rolling(window=5, min_periods=1).mean())
      .fillna(0.0)
  )

  def compute_streak(attendance: pd.Series) -> np.ndarray:
      streaks: list[int] = []
      streak = 0
      for value in attendance.shift(fill_value=0):
          if value:
              streak += 1
          else:
              streak = 0
          streaks.append(streak)
      return np.array(streaks, dtype=int)

  df['recent_absence_streak'] = df.groupby('student_id')['is_absent'].transform(compute_streak)

  df['day_of_week'] = df['date'].dt.dayofweek
  df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
  df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)

  df['subject_popularity'] = (
      df.groupby('subject_id')['is_absent'].transform('mean')
  )

  feature_columns = [
      'past_absent_ratio',
      'recent_absence_streak',
      'dow_sin',
      'dow_cos',
      'subject_popularity',
      'session_index'
  ]

  X = df[feature_columns].fillna(0.0)
  y = df['risk_label']
  return X, y


def train_model(X: pd.DataFrame, y: pd.Series):
  scaler = StandardScaler()
  X_scaled = scaler.fit_transform(X)

  X_train, X_test, y_train, y_test = train_test_split(
      X_scaled, y, test_size=0.2, random_state=42, stratify=y
  )

  train_dataset = lgb.Dataset(X_train, label=y_train)
  valid_dataset = lgb.Dataset(X_test, label=y_test)

  params = {
      'objective': 'binary',
      'metric': 'auc',
      'verbosity': -1,
      'seed': 42,
      'learning_rate': 0.1,
      'num_leaves': 31
  }

  model = lgb.train(
      params,
      train_set=train_dataset,
      valid_sets=[valid_dataset],
      num_boost_round=200,
      callbacks=[lgb.early_stopping(20, verbose=False)]
  )

  y_pred_proba = model.predict(X_test)
  y_pred = (y_pred_proba >= 0.5).astype(int)

  metrics = {
      'roc_auc': float(roc_auc_score(y_test, y_pred_proba)),
      'precision_at_0_5': float(precision_score(y_test, y_pred, zero_division=0)),
      'best_iteration': int(model.best_iteration)
  }

  importance = dict(
      zip(
          ['past_absent_ratio', 'recent_absence_streak', 'dow_sin', 'dow_cos', 'subject_popularity', 'session_index'],
          model.feature_importance(importance_type='gain').tolist()
      )
  )

  model_path = ARTIFACT_DIR / 'lightgbm_attendance.txt'
  model.save_model(str(model_path))

  scaler_path = ARTIFACT_DIR / 'scaler.json'
  json.dump({'mean': scaler.mean_.tolist(), 'scale': scaler.scale_.tolist()}, scaler_path.open('w'))

  metrics_path = ARTIFACT_DIR / 'metrics.json'
  json.dump(metrics, metrics_path.open('w'), indent=2)

  importance_path = ARTIFACT_DIR / 'feature_importance.json'
  json.dump(importance, importance_path.open('w'), indent=2)

  print(f'Model saved to {model_path}')
  print(f'Metrics: {json.dumps(metrics, indent=2)}')


def main() -> None:
  df = load_dataset()
  X, y = engineer_features(df)
  train_model(X, y)


if __name__ == '__main__':
  main()

