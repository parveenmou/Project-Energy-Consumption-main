# 🗒️ Chat Summary — Smart Home Energy Consumption Project

A record of what was discussed and built.

- **Topic:** Energy Consumption Predictor for Smart Homes
- **Goal:** A Python project that does data load → clean → visualisation → prediction and presents an interactive dashboard, using pandas / Plotly / scikit-learn / Streamlit.

---

## 1. The request

Build a project on *"energy consumption predictor for smart homes"*, delivering
a **dashboard** in Python that covers **data loading, cleaning, visualisation
and prediction** with pandas, Plotly (and related libraries).

## 2. Decisions taken

| Question | Decision |
|----------|----------|
| Dashboard type | **Interactive web app (Streamlit)** |
| Prediction model | **Yes — a RandomForest predictor** |
| Data | **Generated automatically** (replaceable with your own CSV of the same layout) |
| Charts | **Interactive Plotly graphs** (hover, zoom, pan, legend toggle) — no static images |
| Static image report | **Removed** — the interactive dashboard is the single deliverable |

## 3. What was built

A clean, modular, Windows-ready project:

| File | Purpose |
|------|---------|
| `app.py` | 🌐 **Interactive Streamlit dashboard** — main deliverable (filters, KPIs, charts, live predictor) |
| `data_loader.py` | Load → clean → feature-engineer pipeline |
| `generate_sample_data.py` | Dataset generator (29 columns, 19,735 rows) |
| `model.py` | RandomForest predictor + R²/MAE/RMSE metrics + feature importance + `predict_one()` what-if helper |
| `config.py` | Central paths, dark dashboard theme, dataset column groups, UTF-8 console fix |
| `.streamlit/config.toml` | Dark UI theme for the Streamlit chrome |
| `requirements.txt` | Dependencies (pandas, numpy, plotly, scikit-learn, streamlit) |
| `README.md` | Full setup + usage documentation |
| `data/energy_data.csv` | Auto-generated dataset |

### Data pipeline
- Parse timestamps, sort, drop duplicate readings
- Drop non-predictive random columns (`rv1`, `rv2`)
- Time-aware interpolation for any missing sensor values
- Feature engineering: `hour`, `day_name`, `month`, `week`, `is_weekend`, `time_of_day`, `total_energy`, `avg_indoor_temp`, `avg_indoor_rh`, `energy_tier` (Low/Medium/High)

### Interactive dashboard — 4 tabs
1. **Overview** — daily trend with 7-day rolling average, usage-tier donut, hourly profile
2. **Usage Patterns** — hour × day-of-week heatmap, time-of-day boxplots, weekly appliances-vs-lights
3. **Correlations** — correlation matrix, top energy drivers, outdoor-temp-vs-energy scatter
4. **Predictor** — model accuracy metrics, feature importance, actual-vs-predicted, and a **🔮 what-if simulator** (set hour / temp / lights / etc. → live energy prediction)

Sidebar filters: date range, days of week, time of day (all charts + KPIs update live).

## 4. Data realism

Appliance energy is driven mainly by **time-of-day behaviour** (morning and
evening peaks), a **weekend bump** and a **per-day household activity level**,
with only a weak, noisy weather influence and a heavy right tail of occasional
high-usage spikes. Because each calendar day gets its own random activity
level, the **daily averages wander naturally** with no artificial built-in
trend, and the RandomForest still finds genuine, learnable signal (hour is the
dominant driver).

## 5. How to run

```bash
pip install -r requirements.txt
streamlit run app.py          # interactive dashboard → http://localhost:8501
```

Works immediately with the auto-generated dataset. To use your own data, drop
a CSV of the same column layout in at `data/energy_data.csv` and rerun — it is
picked up automatically (no code changes).

## 6. Issues encountered & fixed

- **Broken pandas install (environment):** Python 3.14 had the *free-threaded*
  (`cp314t`) pandas wheel installed on a *standard* (GIL) interpreter →
  `import pandas` failed with `No module named 'pandas._libs.pandas_parser'`.
  Fixed via `pip install --force-reinstall --no-deps pandas`.
- **Windows console encoding (cp1252):** emoji in `print()` crashed the scripts.
  Fixed centrally in `config.py` by reconfiguring stdout/stderr to UTF-8.
- **Streamlit API update:** replaced the now-deprecated `use_container_width`
  with `width="stretch"`.
- **Unrealistic daily trend:** the earlier generator produced a smooth,
  monotonic decline. Reworked so daily averages are behaviour-driven and vary
  naturally (see §4).
- **Charts were static images:** the dashboard originally rendered matplotlib
  figures as static PNGs via `st.pyplot`. Converted all 11 charts to
  **interactive Plotly graphs** (`st.plotly_chart`) — hover, zoom, pan, legend
  toggle — and dropped matplotlib/seaborn from the dependencies.

## 7. Why Streamlit?

The whole project is Python (pandas, scikit-learn, Plotly), and Streamlit lets
the dashboard stay in Python too — no HTML/CSS/JS, no separate frontend, no API
layer. Specifically it gives us:

- **Interactive widgets for free** — the sidebar filters and what-if sliders
  are one line each; moving one re-runs the script and updates every chart and
  the live prediction.
- **Caching that matters for ML** — `@st.cache_data` / `@st.cache_resource`
  mean the data loads and the model trains once, not on every interaction.
- **Dashboard layout primitives** — tabs, columns, metric/KPI cards.
- **Zero-friction run/deploy** — `streamlit run app.py` and it's live.

Trade-off: it re-runs the entire script on each interaction (handled via
caching) and is opinionated about layout — ideal for data/ML dashboards, not
for a pixel-perfect custom website.

## 8. Deployment & sharing

- The project lives in a **private GitHub repo**
  (`adsccpl-jpg/Project-Energy-Consumption`, branch `main`); all changes are
  committed and pushed.
- **GitHub itself cannot run the app** — it only stores code / serves static
  files. A Streamlit app needs a live Python server.
- For a **permanent public link**, deploy from the repo to **Streamlit
  Community Cloud** (https://share.streamlit.io): sign in with GitHub →
  *Create app* → repo `adsccpl-jpg/Project-Energy-Consumption`, branch `main`,
  main file `app.py` → *Deploy*. Result: a permanent `https://<name>.streamlit.app`
  URL that auto-redeploys on every push. (Free; works with private repos after
  granting access.)
- The repo is deployment-ready: `requirements.txt` present, `app.py` at the
  root, data auto-generates on first run, no secrets needed.
- Alternatives that also give a permanent link from a repo: Hugging Face Spaces
  (Streamlit SDK), Render, or Railway.

---

*Stack: pandas · numpy · Plotly · scikit-learn · Streamlit.*
