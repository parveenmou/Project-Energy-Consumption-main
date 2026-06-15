"""
FastAPI backend — Smart Home Energy Consumption
Run:  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations
import sys
from pathlib import Path

# Parent dir holds config.py, data_loader.py, model.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import pandas as pd

from data_loader import get_data
from model import train_model, predict_one

app = FastAPI(title="Smart Home Energy API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_state: dict = {}


def _load():
    if not _state:
        df = get_data()
        result = train_model(df)
        _state["df"] = df
        _state["result"] = result
    return _state["df"], _state["result"]


@app.on_event("startup")
async def startup():
    _load()


@app.get("/api/summary")
def summary():
    df, result = _load()
    daily = df.groupby(df["date"].dt.date)["total_energy"].sum()
    m = result["metrics"]
    return {
        "total_kwh": round(float(df["total_energy"].sum()) / 1000, 1),
        "avg_daily_kwh": round(float(daily.mean()) / 1000, 2),
        "peak_hour": int(df.groupby("hour")["Appliances"].mean().idxmax()),
        "records": len(df),
        "date_from": str(df["date"].min().date()),
        "date_to": str(df["date"].max().date()),
        "r2": round(m["r2"], 3),
        "mae": round(m["mae"], 1),
        "rmse": round(m["rmse"], 1),
        "n_train": m["n_train"],
        "n_test": m["n_test"],
    }


@app.get("/api/trends")
def trends(days: int = 60):
    df, _ = _load()
    cutoff = df["date"].max() - pd.Timedelta(days=days)
    sub = df[df["date"] >= cutoff].copy()
    daily = (
        sub.groupby(sub["date"].dt.date)
        .agg(appliances=("Appliances", "sum"), lights=("lights", "sum"),
             total=("total_energy", "sum"))
        .reset_index()
    )
    daily.columns = ["date", "appliances", "lights", "total"]
    for c in ["appliances", "lights", "total"]:
        daily[c] = (daily[c] / 1000).round(2)
    daily["rolling7d"] = daily["total"].rolling(7, min_periods=1).mean().round(2)
    daily["date"] = daily["date"].astype(str)
    return daily.to_dict(orient="records")


@app.get("/api/heatmap")
def heatmap():
    df, _ = _load()
    pivot = (
        df.groupby(["hour", "dayofweek"])["Appliances"]
        .mean()
        .reset_index()
        .rename(columns={"Appliances": "value"})
    )
    pivot["value"] = pivot["value"].round(1)
    return pivot.to_dict(orient="records")


@app.get("/api/tod")
def tod():
    df, _ = _load()
    order = ["Morning", "Afternoon", "Evening", "Night"]
    result = (
        df.groupby("time_of_day")["Appliances"]
        .agg(["mean", "count"])
        .reset_index()
        .rename(columns={"time_of_day": "period", "mean": "avg_energy"})
    )
    result["avg_energy"] = result["avg_energy"].round(1)
    result["period"] = pd.Categorical(result["period"], categories=order, ordered=True)
    result = result.sort_values("period")
    return result.to_dict(orient="records")


@app.get("/api/hourly")
def hourly():
    df, _ = _load()
    result = (
        df.groupby("hour")["Appliances"]
        .mean()
        .reset_index()
        .rename(columns={"Appliances": "avg_energy"})
    )
    result["avg_energy"] = result["avg_energy"].round(1)
    return result.to_dict(orient="records")


@app.get("/api/importances")
def importances():
    _, result = _load()
    imp = result["importances"].head(12)
    return [{"feature": k, "importance": round(float(v), 4)} for k, v in imp.items()]


@app.get("/api/model")
def model_info():
    _, result = _load()
    m = result["metrics"]
    return {
        "r2": round(m["r2"], 4),
        "mae": round(m["mae"], 1),
        "rmse": round(m["rmse"], 1),
        "n_train": m["n_train"],
        "n_test": m["n_test"],
        "defaults": {k: round(float(v), 2) for k, v in result["defaults"].items()},
    }


class PredictReq(BaseModel):
    T_out: Optional[float] = None
    RH_out: Optional[float] = None
    lights: Optional[float] = None
    hour: Optional[int] = None
    is_weekend: Optional[int] = None
    T1: Optional[float] = None
    month: Optional[int] = None


@app.post("/api/predict")
def predict(req: PredictReq):
    _, result = _load()
    overrides = {k: v for k, v in req.dict().items() if v is not None}
    value = predict_one(result["model"], result["feature_cols"], result["defaults"], overrides)
    return {"predicted_wh": round(max(0.0, value), 1)}


# ── Serve React build in production ──────────────────────────────────────────
_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if _dist.exists():
    app.mount("/assets", StaticFiles(directory=str(_dist / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        return FileResponse(str(_dist / "index.html"))
