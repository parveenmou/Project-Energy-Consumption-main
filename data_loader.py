"""
Data loading, cleaning and feature engineering.

Pipeline:  load_raw  ->  clean  ->  engineer
Use `get_data()` to get the final analysis-ready DataFrame.

The dataset lives at data/energy_data.csv. It is generated automatically the
first time the project runs; replace that file with your own readings of the
same layout to use them instead.
"""
from __future__ import annotations

import pandas as pd

import config
from generate_sample_data import generate_and_save


# ──────────────────────────────────────────────────────────────────────
# LOAD
# ──────────────────────────────────────────────────────────────────────
def load_raw() -> pd.DataFrame:
    """Load the dataset, generating it on first run if it is missing."""
    if not config.DATA_FILE.exists():
        generate_and_save(config.DATA_FILE)
    df = pd.read_csv(config.DATA_FILE)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


# ──────────────────────────────────────────────────────────────────────
# CLEAN
# ──────────────────────────────────────────────────────────────────────
def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Drop noise columns, de-duplicate timestamps, fill any gaps."""
    df = df.copy()

    # Remove the two non-predictive random variables.
    df = df.drop(columns=[c for c in config.NOISE_COLS if c in df.columns])

    # One reading per timestamp.
    df = df.drop_duplicates(subset="date").sort_values("date")

    # Time-aware interpolation for any missing sensor readings.
    df = df.set_index("date")
    numeric = df.select_dtypes("number").columns
    df[numeric] = df[numeric].interpolate(method="time").ffill().bfill()
    df = df.reset_index()

    return df


# ──────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING
# ──────────────────────────────────────────────────────────────────────
def _time_of_day(hour: int) -> str:
    if 6 <= hour < 12:
        return "Morning"
    if 12 <= hour < 17:
        return "Afternoon"
    if 17 <= hour < 21:
        return "Evening"
    return "Night"


def engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Add calendar, aggregate and categorical features used everywhere."""
    df = df.copy()

    # Calendar features
    df["hour"] = df["date"].dt.hour
    df["dayofweek"] = df["date"].dt.dayofweek
    df["day_name"] = df["date"].dt.day_name()
    df["month"] = df["date"].dt.month
    df["month_name"] = df["date"].dt.strftime("%b")
    df["week"] = df["date"].dt.isocalendar().week.astype(int)
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)
    df["time_of_day"] = df["hour"].map(_time_of_day)

    # Aggregate energy & climate
    df["total_energy"] = df["Appliances"] + df["lights"]
    indoor_t = [c for c in config.INDOOR_TEMP_COLS if c in df.columns]
    indoor_rh = [c for c in config.INDOOR_RH_COLS if c in df.columns]
    df["avg_indoor_temp"] = df[indoor_t].mean(axis=1)
    df["avg_indoor_rh"] = df[indoor_rh].mean(axis=1)

    # Usage tier
    df["energy_tier"] = pd.cut(
        df["Appliances"],
        bins=[-1, 60, 150, float("inf")],
        labels=["Low", "Medium", "High"],
    )

    return df


# ──────────────────────────────────────────────────────────────────────
# PUBLIC ENTRY POINT
# ──────────────────────────────────────────────────────────────────────
def get_data() -> pd.DataFrame:
    """Return the clean, feature-engineered DataFrame."""
    return engineer(clean(load_raw()))


if __name__ == "__main__":
    data = get_data()
    print(f"Shape  : {data.shape[0]:,} rows x {data.shape[1]} cols")
    print(f"Period : {data['date'].min()}  ->  {data['date'].max()}")
    print(f"Missing values: {int(data.isna().sum().sum())}")
    print("\nEnergy tier distribution:")
    print(data["energy_tier"].value_counts())
    print("\nSample engineered columns:")
    print(data[["date", "Appliances", "total_energy", "time_of_day",
                "energy_tier", "avg_indoor_temp"]].head())
