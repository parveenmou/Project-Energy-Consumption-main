"""
⚡ Smart Home Energy Consumption — Interactive Dashboard
========================================================
Run with:   streamlit run app.py

An interactive analytics + prediction dashboard for smart-home energy use.
Every chart is a live Plotly graph (hover, zoom, pan, legend toggle).
Features:

  * KPI summary cards
  * Consumption trends, hour/day heatmap, time-of-day patterns
  * Correlation analysis
  * A RandomForest energy predictor with a live what-if simulator

Data is loaded and prepared by data_loader.py.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

import config
import data_loader
import model as ml

# ──────────────────────────────────────────────────────────────────────
# PAGE SETUP & THEME
# ──────────────────────────────────────────────────────────────────────
st.set_page_config(page_title="Smart Home Energy Dashboard",
                   page_icon="⚡", layout="wide",
                   initial_sidebar_state="expanded")

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday",
             "Friday", "Saturday", "Sunday"]
TOD_ORDER = ["Morning", "Afternoon", "Evening", "Night"]

st.markdown(
    f"""
    <style>
      .block-container {{padding-top: 1.6rem; padding-bottom: 2rem;}}
      .kpi {{
          background: {config.CARD_BG};
          border: 1px solid {config.EDGE};
          border-radius: 12px;
          padding: 16px 18px;
          height: 100%;
      }}
      .kpi-label {{color: {config.TEXT_SEC}; font-size: 0.78rem;
                   text-transform: uppercase; letter-spacing: .04em;}}
      .kpi-value {{font-size: 1.75rem; font-weight: 700; line-height: 1.2;
                   margin: 4px 0;}}
      .kpi-sub   {{color: {config.TEXT_SEC}; font-size: 0.74rem;}}
      h1, h2, h3 {{color: {config.TEXT_PRI};}}
      hr {{border-color: {config.EDGE};}}
    </style>
    """,
    unsafe_allow_html=True,
)


# ──────────────────────────────────────────────────────────────────────
# CACHED DATA + MODEL
# ──────────────────────────────────────────────────────────────────────
@st.cache_data(show_spinner="Loading & preparing data…")
def load_data():
    return data_loader.get_data()


@st.cache_resource(show_spinner="Training prediction model…")
def get_model(_df):
    return ml.train_model(_df)


df = load_data()


# ──────────────────────────────────────────────────────────────────────
# PLOTLY HELPERS  (consistent dark theme + interactive rendering)
# ──────────────────────────────────────────────────────────────────────
def style(fig, height=360, legend=True):
    """Apply the dark theme and shared layout to a Plotly figure."""
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor=config.DARK_BG,
        plot_bgcolor=config.CARD_BG,
        font=dict(color=config.TEXT_PRI, size=12),
        margin=dict(l=12, r=12, t=30, b=12),
        height=height,
        showlegend=legend,
        legend=dict(bgcolor="rgba(0,0,0,0)", orientation="h",
                    yanchor="bottom", y=1.0, xanchor="right", x=1,
                    font=dict(size=11)),
        hoverlabel=dict(bgcolor=config.CARD_BG, bordercolor=config.EDGE,
                        font_size=12),
    )
    fig.update_xaxes(gridcolor=config.GRID, zerolinecolor=config.EDGE,
                     linecolor=config.EDGE)
    fig.update_yaxes(gridcolor=config.GRID, zerolinecolor=config.EDGE,
                     linecolor=config.EDGE)
    return fig


def show(fig):
    """Render an interactive Plotly chart full-width."""
    st.plotly_chart(fig, width="stretch", theme=None,
                    config={"displaylogo": False,
                            "modeBarButtonsToRemove": ["lasso2d", "select2d"]})


def kpi(col, label, value, sub, color):
    col.markdown(
        f"""<div class="kpi" style="border-left:4px solid {color}">
            <div class="kpi-label">{label}</div>
            <div class="kpi-value" style="color:{color}">{value}</div>
            <div class="kpi-sub">{sub}</div></div>""",
        unsafe_allow_html=True,
    )


# ──────────────────────────────────────────────────────────────────────
# HEADER
# ──────────────────────────────────────────────────────────────────────
st.title("⚡ Smart Home Energy Consumption Dashboard")
st.caption(
    f"{df['date'].min():%d %b %Y} – {df['date'].max():%d %b %Y} · "
    f"{len(df):,} readings (10-min intervals)"
)

# ──────────────────────────────────────────────────────────────────────
# SIDEBAR FILTERS
# ──────────────────────────────────────────────────────────────────────
st.sidebar.header("🔎 Filters")

min_d = df["date"].min().to_pydatetime()
max_d = df["date"].max().to_pydatetime()
date_range = st.sidebar.slider(
    "Date range", min_value=min_d, max_value=max_d,
    value=(min_d, max_d), format="DD MMM YYYY")

sel_days = st.sidebar.multiselect("Days of week", DAY_ORDER, default=DAY_ORDER)
sel_tod = st.sidebar.multiselect("Time of day", TOD_ORDER, default=TOD_ORDER)

mask = (
    (df["date"] >= pd.Timestamp(date_range[0]))
    & (df["date"] <= pd.Timestamp(date_range[1]))
    & (df["day_name"].isin(sel_days or DAY_ORDER))
    & (df["time_of_day"].isin(sel_tod or TOD_ORDER))
)
dff = df[mask].copy()

st.sidebar.markdown("---")
st.sidebar.metric("Readings in view", f"{len(dff):,}",
                  f"{len(dff) / len(df) * 100:.0f}% of total")

if dff.empty:
    st.warning("No data matches the current filters. Widen your selection.")
    st.stop()

# ──────────────────────────────────────────────────────────────────────
# KPI ROW
# ──────────────────────────────────────────────────────────────────────
c1, c2, c3, c4, c5 = st.columns(5)
kpi(c1, "Avg Appliance Use", f"{dff['Appliances'].mean():.0f} Wh",
    "per 10-min interval", config.ACCENT1)
kpi(c2, "Peak Consumption", f"{dff['Appliances'].max():.0f} Wh",
    "highest recorded", config.ACCENT3)
kpi(c3, "Total Energy", f"{dff['total_energy'].sum() / 1000:.0f} kWh",
    "appliances + lights", config.ACCENT2)
kpi(c4, "High-Usage Share", f"{(dff['energy_tier'] == 'High').mean() * 100:.1f}%",
    "intervals ≥ 150 Wh", config.GOLD)
kpi(c5, "Avg Outdoor Temp", f"{dff['T_out'].mean():.1f} °C",
    "weather station", config.ACCENT4)

st.markdown("")

# ──────────────────────────────────────────────────────────────────────
# TABS
# ──────────────────────────────────────────────────────────────────────
tab_overview, tab_patterns, tab_corr, tab_pred = st.tabs(
    ["📈 Overview", "🔍 Usage Patterns", "🔗 Correlations", "🤖 Predictor"])

# ── OVERVIEW ───────────────────────────────────────────────────────────
with tab_overview:
    st.subheader("Daily average appliance energy")
    daily = (dff.groupby(dff["date"].dt.date)["Appliances"].mean()
             .rename("avg").reset_index())
    daily["date"] = pd.to_datetime(daily["date"])
    daily["roll"] = daily["avg"].rolling(7, min_periods=1).mean()
    avg_val = dff["Appliances"].mean()

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=daily["date"], y=daily["avg"], name="Daily avg", mode="lines",
        line=dict(color=config.ACCENT1, width=1.8),
        fill="tozeroy", fillcolor="rgba(88,166,255,0.12)",
        hovertemplate="%{x|%d %b %Y}<br><b>%{y:.0f} Wh</b><extra></extra>"))
    fig.add_trace(go.Scatter(
        x=daily["date"], y=daily["roll"], name="7-day rolling avg", mode="lines",
        line=dict(color=config.GOLD, width=2.4, dash="dash"),
        hovertemplate="%{x|%d %b %Y}<br>%{y:.0f} Wh<extra></extra>"))
    fig.add_hline(y=avg_val, line=dict(color=config.ACCENT3, width=1, dash="dot"),
                  annotation_text=f"Overall avg ({avg_val:.0f} Wh)",
                  annotation_position="top left",
                  annotation_font_color=config.ACCENT3)
    fig.update_yaxes(title_text="Energy (Wh)")
    show(style(fig, height=380))

    left, right = st.columns([1, 1])
    with left:
        st.subheader("Usage-tier distribution")
        tiers = dff["energy_tier"].value_counts().reindex(
            ["Low", "Medium", "High"]).fillna(0)
        fig = go.Figure(go.Pie(
            labels=tiers.index, values=tiers.values, hole=0.55, sort=False,
            marker=dict(colors=[config.ACCENT2, config.GOLD, config.ACCENT3],
                        line=dict(color=config.DARK_BG, width=2)),
            textinfo="label+percent", textfont=dict(color=config.TEXT_PRI),
            hovertemplate="%{label}<br>%{value:,} readings"
                          "<br>%{percent}<extra></extra>"))
        show(style(fig, height=370, legend=False))
    with right:
        st.subheader("Average energy by hour")
        hourly = dff.groupby("hour")["Appliances"].mean()
        thresh = hourly.quantile(0.75)
        colors = [config.ACCENT3 if v >= thresh else config.ACCENT1
                  for v in hourly]
        fig = go.Figure(go.Bar(
            x=hourly.index, y=hourly.values, marker_color=colors,
            hovertemplate="%{x}:00<br>%{y:.0f} Wh<extra></extra>"))
        fig.update_xaxes(title_text="Hour of day", dtick=3)
        fig.update_yaxes(title_text="Avg energy (Wh)")
        show(style(fig, height=370, legend=False))

# ── PATTERNS ───────────────────────────────────────────────────────────
with tab_patterns:
    st.subheader("When is energy used? Hour × day-of-week")
    pivot = (dff.pivot_table(values="Appliances", index="day_name",
                             columns="hour", aggfunc="mean")
             .reindex(DAY_ORDER))
    fig = go.Figure(go.Heatmap(
        z=pivot.values, x=pivot.columns, y=pivot.index,
        colorscale=[[0.0, config.CARD_BG], [0.5, config.ACCENT1],
                    [1.0, config.ACCENT3]],
        colorbar=dict(title="Avg Wh"),
        hovertemplate="%{y}, %{x}:00<br>%{z:.0f} Wh<extra></extra>"))
    fig.update_xaxes(title_text="Hour of day", dtick=3)
    fig.update_yaxes(autorange="reversed")
    show(style(fig, height=380, legend=False))

    left, right = st.columns([1, 1])
    with left:
        st.subheader("Distribution by time of day")
        tod_colors = {"Morning": config.GOLD, "Afternoon": config.ACCENT3,
                      "Evening": config.ACCENT4, "Night": config.ACCENT1}
        present = [t for t in TOD_ORDER if t in dff["time_of_day"].unique()]
        fig = go.Figure()
        for t in present:
            fig.add_trace(go.Box(
                y=dff.loc[dff["time_of_day"] == t, "Appliances"], name=t,
                marker=dict(color=tod_colors[t], size=3, opacity=0.4),
                line=dict(width=1.4), boxpoints="outliers"))
        fig.update_yaxes(title_text="Appliance energy (Wh)")
        show(style(fig, height=370, legend=False))
    with right:
        st.subheader("Weekly: appliances vs lights")
        weekly = dff.groupby("week")[["Appliances", "lights"]].mean()
        fig = go.Figure()
        fig.add_trace(go.Bar(x=weekly.index, y=weekly["Appliances"],
                             name="Appliances", marker_color=config.ACCENT1,
                             hovertemplate="Week %{x}<br>%{y:.0f} Wh<extra></extra>"))
        fig.add_trace(go.Bar(x=weekly.index, y=weekly["lights"],
                             name="Lights", marker_color=config.GOLD,
                             hovertemplate="Week %{x}<br>%{y:.0f} Wh<extra></extra>"))
        fig.update_layout(barmode="group")
        fig.update_xaxes(title_text="Week of year")
        fig.update_yaxes(title_text="Avg energy (Wh)")
        show(style(fig, height=370))

# ── CORRELATIONS ───────────────────────────────────────────────────────
with tab_corr:
    left, right = st.columns([1.1, 1])
    with left:
        st.subheader("Correlation matrix — key variables")
        sel = ["Appliances", "lights", "T_out", "T1", "T2", "T3",
               "RH_out", "Windspeed", "avg_indoor_temp", "avg_indoor_rh"]
        sel = [c for c in sel if c in dff.columns]
        corr = dff[sel].corr()
        fig = go.Figure(go.Heatmap(
            z=corr.values, x=corr.columns, y=corr.index,
            colorscale=[[0.0, config.ACCENT3], [0.5, config.CARD_BG],
                        [1.0, config.ACCENT1]],
            zmid=0, zmin=-1, zmax=1,
            text=corr.round(2).values, texttemplate="%{text}",
            textfont=dict(size=9, color=config.TEXT_PRI),
            colorbar=dict(title="r"),
            hovertemplate="%{y} vs %{x}<br>r = %{z:.2f}<extra></extra>"))
        fig.update_xaxes(tickangle=45)
        fig.update_yaxes(autorange="reversed")
        show(style(fig, height=480, legend=False))
    with right:
        st.subheader("Top drivers of appliance energy")
        feats = (config.TEMP_COLS + config.RH_COLS
                 + ["T_out", "RH_out", "Windspeed", "lights"])
        feats = [c for c in feats if c in dff.columns]
        corrs = (dff[feats + ["Appliances"]].corr()["Appliances"]
                 .drop("Appliances").abs().sort_values().tail(12))
        bar_c = [config.ACCENT2 if v >= 0.1 else config.TEXT_SEC
                 for v in corrs.values]
        fig = go.Figure(go.Bar(
            x=corrs.values, y=corrs.index, orientation="h", marker_color=bar_c,
            hovertemplate="%{y}<br>|r| = %{x:.3f}<extra></extra>"))
        fig.update_xaxes(title_text="|correlation| with Appliances")
        show(style(fig, height=480, legend=False))

    st.subheader("Outdoor temperature vs appliance energy")
    sample = dff.sample(min(len(dff), 3000), random_state=42)
    z = np.polyfit(sample["T_out"], sample["Appliances"], 1)
    xline = np.linspace(sample["T_out"].min(), sample["T_out"].max(), 100)
    fig = go.Figure()
    fig.add_trace(go.Scattergl(
        x=sample["T_out"], y=sample["Appliances"], mode="markers", name="readings",
        marker=dict(size=5, color=sample["hour"], colorscale="Plasma",
                    opacity=0.5, colorbar=dict(title="Hour")),
        hovertemplate="%{x:.1f} °C<br>%{y:.0f} Wh<extra></extra>"))
    fig.add_trace(go.Scatter(
        x=xline, y=np.poly1d(z)(xline), mode="lines", name="Trend",
        line=dict(color=config.ACCENT3, width=2, dash="dash")))
    fig.update_xaxes(title_text="Outdoor temperature (°C)")
    fig.update_yaxes(title_text="Appliance energy (Wh)")
    show(style(fig, height=400))

# ── PREDICTOR ──────────────────────────────────────────────────────────
with tab_pred:
    res = get_model(df)              # trained on the FULL dataset
    m = res["metrics"]

    st.subheader("Model performance — RandomForest regressor")
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("R² score", f"{m['r2']:.3f}", help="1.0 = perfect")
    k2.metric("MAE", f"{m['mae']:.1f} Wh", help="Mean absolute error")
    k3.metric("RMSE", f"{m['rmse']:.1f} Wh", help="Root mean squared error")
    k4.metric("Test samples", f"{m['n_test']:,}")

    left, right = st.columns([1, 1])
    with left:
        st.markdown("**Feature importance** (top 12)")
        imp = res["importances"].head(12).iloc[::-1]
        fig = go.Figure(go.Bar(
            x=imp.values, y=imp.index, orientation="h",
            marker_color=config.ACCENT1,
            hovertemplate="%{y}<br>%{x:.3f}<extra></extra>"))
        fig.update_xaxes(title_text="Importance")
        show(style(fig, height=460, legend=False))
    with right:
        st.markdown("**Actual vs predicted** (hold-out set)")
        y_test, pred = res["y_test"], res["pred"]
        idx = np.random.RandomState(0).choice(
            len(y_test), size=min(2000, len(y_test)), replace=False)
        lim = [0.0, float(max(y_test.max(), pred.max()))]
        fig = go.Figure()
        fig.add_trace(go.Scattergl(
            x=y_test[idx], y=pred[idx], mode="markers", name="test",
            marker=dict(size=5, color=config.ACCENT2, opacity=0.4),
            hovertemplate="actual %{x:.0f} Wh<br>predicted %{y:.0f} Wh<extra></extra>"))
        fig.add_trace(go.Scatter(
            x=lim, y=lim, mode="lines", name="perfect fit",
            line=dict(color=config.ACCENT3, width=1.5, dash="dash")))
        fig.update_xaxes(title_text="Actual (Wh)")
        fig.update_yaxes(title_text="Predicted (Wh)")
        show(style(fig, height=460))

    st.markdown("---")
    st.subheader("🔮 What-if simulator")
    st.caption("Adjust the conditions below to estimate appliance energy use. "
               "Unspecified sensors default to dataset medians.")

    s1, s2, s3 = st.columns(3)
    in_hour = s1.slider("Hour of day", 0, 23, 18)
    in_daytype = s1.radio("Day type", ["Weekday", "Weekend"], horizontal=True)
    in_month = s2.slider("Month", int(df["month"].min()), int(df["month"].max()),
                         int(df["month"].median()))
    in_tout = s2.slider("Outdoor temp (°C)", float(round(df["T_out"].min())),
                        float(round(df["T_out"].max())),
                        float(round(df["T_out"].median())))
    in_itemp = s3.slider("Indoor temp (°C)", 15.0, 28.0,
                         float(round(df["avg_indoor_temp"].median(), 1)))
    in_irh = s3.slider("Indoor humidity (%)", 20.0, 60.0,
                       float(round(df["avg_indoor_rh"].median(), 1)))
    in_lights = s1.slider("Lights (Wh)", 0, 70, 0, step=10)

    overrides = {
        "hour": in_hour,
        "is_weekend": 1 if in_daytype == "Weekend" else 0,
        "dayofweek": 6 if in_daytype == "Weekend" else 2,
        "month": in_month,
        "T_out": in_tout,
        "T6": in_tout,
        "lights": in_lights,
    }
    for c in config.INDOOR_TEMP_COLS:
        overrides[c] = in_itemp
    for c in config.INDOOR_RH_COLS:
        overrides[c] = in_irh

    pred_val = ml.predict_one(res["model"], res["feature_cols"],
                              res["defaults"], overrides)
    avg = df["Appliances"].mean()
    delta = (pred_val - avg) / avg * 100
    st.metric("Predicted appliance energy",
              f"{pred_val:.0f} Wh",
              f"{delta:+.0f}% vs overall average",
              delta_color="inverse")

st.markdown("---")
st.caption("Built with pandas · Plotly · scikit-learn · Streamlit  ·  "
           "Smart Home Energy Consumption Predictor")
