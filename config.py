"""
Central configuration for the Smart Home Energy Consumption project.

Holds all file paths, the dark dashboard theme, and the dataset column
groupings in one place so every module (data loader, model, Streamlit app)
stays consistent.
"""
import sys
from pathlib import Path

# Make console output UTF-8 safe (Windows terminals default to cp1252,
# which crashes on the emoji used in status messages).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

# ──────────────────────────────────────────────────────────────────────
# PATHS  (all resolved relative to this file, so the project runs from
#         any working directory and on any machine)
# ──────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"

# The project's energy dataset. It is generated automatically on first run;
# replace this file with your own readings (same column layout) to use them
# instead — no code changes needed.
DATA_FILE = DATA_DIR / "energy_data.csv"

# Make sure the data folder exists on first run.
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────────────────────────────
# DATASET COLUMN GROUPS
# ──────────────────────────────────────────────────────────────────────
TARGET = "Appliances"                                   # energy use in Wh
INDOOR_TEMP_COLS = [f"T{i}" for i in range(1, 10) if i != 6]   # T6 = outdoor
INDOOR_RH_COLS = [f"RH_{i}" for i in range(1, 10) if i != 6]
TEMP_COLS = [f"T{i}" for i in range(1, 10)]
RH_COLS = [f"RH_{i}" for i in range(1, 10)]
WEATHER_COLS = ["T_out", "Press_mm_hg", "RH_out", "Windspeed",
                "Visibility", "Tdewpoint"]
NOISE_COLS = ["rv1", "rv2"]                             # random vars, dropped

# Full column order of the raw dataset (used by the data generator).
RAW_COLUMNS = (
    ["date", "Appliances", "lights"]
    + sum([[f"T{i}", f"RH_{i}"] for i in range(1, 10)], [])
    + WEATHER_COLS
    + NOISE_COLS
)

# ──────────────────────────────────────────────────────────────────────
# DARK DASHBOARD THEME  (shared by all Plotly charts)
# ──────────────────────────────────────────────────────────────────────
DARK_BG = "#0D1117"
CARD_BG = "#161B22"
GRID = "#21262D"
EDGE = "#30363D"
ACCENT1 = "#58A6FF"   # blue
ACCENT2 = "#3FB950"   # green
ACCENT3 = "#F78166"   # coral / red
ACCENT4 = "#D2A8FF"   # purple
GOLD = "#E3B341"      # gold highlight
TEXT_PRI = "#E6EDF3"
TEXT_SEC = "#8B949E"
