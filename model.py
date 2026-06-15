"""
Appliance-energy prediction model.

A RandomForest regressor predicts `Appliances` (Wh) from the temperature,
humidity, weather and time-of-day features. Exposes:

  * train_model(df)  -> dict with the fitted model, hold-out metrics,
                        feature importances and test predictions
  * predict_one(...) -> predict a single what-if scenario for the app
"""
from __future__ import annotations

import math

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

import config

# Predictors: raw sensors + weather + calendar.  We deliberately exclude
# `total_energy` (contains the target) and `lights` is kept (separate meter).
FEATURE_COLS = (
    config.TEMP_COLS
    + config.RH_COLS
    + config.WEATHER_COLS
    + ["lights", "hour", "dayofweek", "is_weekend", "month"]
)


def build_xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    cols = [c for c in FEATURE_COLS if c in df.columns]
    return df[cols].copy(), df[config.TARGET].copy(), cols


def train_model(df: pd.DataFrame, n_estimators: int = 200,
                max_depth: int | None = 20, test_size: float = 0.2,
                random_state: int = 42) -> dict:
    """Train the regressor and return everything the dashboard needs."""
    X, y, cols = build_xy(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state)

    model = RandomForestRegressor(
        n_estimators=n_estimators, max_depth=max_depth,
        random_state=random_state, n_jobs=-1)
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    metrics = {
        "r2": r2_score(y_test, pred),
        "mae": mean_absolute_error(y_test, pred),
        "rmse": math.sqrt(mean_squared_error(y_test, pred)),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }
    importances = (pd.Series(model.feature_importances_, index=cols)
                   .sort_values(ascending=False))

    return {
        "model": model,
        "metrics": metrics,
        "importances": importances,
        "feature_cols": cols,
        "defaults": X.median().to_dict(),     # for the what-if sliders
        "y_test": np.asarray(y_test),
        "pred": pred,
    }


def predict_one(model, feature_cols: list[str], defaults: dict,
                overrides: dict | None = None) -> float:
    """Predict appliance energy for one scenario.

    Missing features fall back to dataset medians (`defaults`), so the
    caller only needs to pass the handful of values it exposes as sliders.
    """
    row = dict(defaults)
    if overrides:
        row.update(overrides)
    X = pd.DataFrame([[row[c] for c in feature_cols]], columns=feature_cols)
    return float(model.predict(X)[0])


if __name__ == "__main__":
    from data_loader import get_data

    data = get_data()
    result = train_model(data)
    m = result["metrics"]
    print("Model: RandomForestRegressor")
    print(f"  Train/Test  : {m['n_train']:,} / {m['n_test']:,}")
    print(f"  R^2 score   : {m['r2']:.3f}")
    print(f"  MAE         : {m['mae']:.1f} Wh")
    print(f"  RMSE        : {m['rmse']:.1f} Wh")
    print("\nTop 8 features:")
    print(result["importances"].head(8).round(3))
