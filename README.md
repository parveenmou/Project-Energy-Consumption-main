# ⚡ Smart Home Energy Consumption Predictor

An end-to-end Python project that **loads, cleans, visualises and predicts**
household appliance energy use.

It ships with:

- 🌐 an **interactive Streamlit dashboard** (filters, charts, live predictor)
- 🤖 a **RandomForest prediction model** with accuracy metrics & a what-if simulator
- 🧪 a **data generator** so the project runs immediately, out of the box
- 📄 a **project-overview PDF** ([docs/Smart_Home_Energy_Overview.pdf](docs/Smart_Home_Energy_Overview.pdf)) explaining what it is and how it works

---

## 1. Quick start

```bash
# (optional) create a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# install dependencies
pip install -r requirements.txt

# launch the interactive dashboard
streamlit run app.py
```

The dashboard opens in your browser at `http://localhost:8501`.
On first run, the energy dataset is generated automatically, so everything
works out of the box.

### Using your own data

The project reads `data/energy_data.csv`. To use your own readings, replace
that file with a CSV of the **same column layout** and re-run the app — it is
picked up automatically, no code changes required.

---

## 2. Project structure

```
Project Energy Consumption/
├── app.py                    # Interactive Streamlit dashboard (main deliverable)
├── config.py                 # Paths, dark theme, dataset column groups
├── data_loader.py            # Load → clean → feature-engineer pipeline
├── generate_sample_data.py   # Dataset generator
├── model.py                  # RandomForest predictor + metrics + what-if
├── make_pdf.py               # Builds the project-overview PDF
├── requirements.txt
├── README.md
├── .streamlit/config.toml    # Dark UI theme
├── data/                     # energy_data.csv lives here
└── docs/                     # Smart_Home_Energy_Overview.pdf
```

> The overview PDF is regenerated with `python make_pdf.py` (needs `pip install reportlab`).

Each module is runnable on its own for quick checks:

```bash
python generate_sample_data.py   # create / refresh the dataset
python data_loader.py            # inspect the cleaned, featured data
python model.py                  # train the model & print accuracy
```

---

## 3. What the pipeline does

**Load & clean** (`data_loader.py`)
- Parses timestamps, sorts chronologically, removes duplicate readings
- Drops the non-predictive random columns (`rv1`, `rv2`)
- Time-aware interpolation fills any sensor gaps

**Feature engineering**
- Calendar features: `hour`, `day_name`, `month`, `week`, `is_weekend`, `time_of_day`
- Aggregates: `total_energy`, `avg_indoor_temp`, `avg_indoor_rh`
- `energy_tier` (Low / Medium / High) for quick segmentation

**Visualisation** (interactive Plotly charts — hover, zoom, pan, legend toggle)
- Daily trend with 7-day rolling average
- Hour × day-of-week heatmap
- Time-of-day distribution, hourly profile, weekly appliances-vs-lights
- Correlation matrix + top energy drivers
- Outdoor-temperature vs energy scatter

**Prediction** (`model.py`, scikit-learn)
- `RandomForestRegressor` predicts `Appliances` (Wh) from temperature,
  humidity, weather and time features
- Reports **R²**, **MAE** and **RMSE** on a hold-out test set
- Feature-importance ranking + an interactive **what-if simulator**

---

## 4. Dataset reference

| Column            | Description                                   |
|-------------------|-----------------------------------------------|
| `date`            | Timestamp (10-minute intervals)               |
| `Appliances`      | **Target** — appliance energy use (Wh)        |
| `lights`          | Lighting energy use (Wh)                       |
| `T1`–`T9`         | Indoor temperatures (°C); `T6` is outdoor      |
| `RH_1`–`RH_9`     | Indoor relative humidity (%)                   |
| `T_out`, `RH_out` | Outdoor temperature / humidity                 |
| `Press_mm_hg`     | Atmospheric pressure                           |
| `Windspeed`, `Visibility`, `Tdewpoint` | Weather station readings  |
| `rv1`, `rv2`      | Random variables (dropped during cleaning)     |

---

*Built with pandas · Plotly · scikit-learn · Streamlit.*
