"""
Generate the project overview PDF.

Builds `docs/Smart_Home_Energy_Overview.pdf` — a clean, printable explainer of
what the Smart Home Energy Consumption Predictor is, what it is used for and
how it works. Run with:

    python make_pdf.py

Requires reportlab (``pip install reportlab``). Only needed to (re)build the
PDF — the Streamlit app itself does not depend on it.
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, ListFlowable, ListItem, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

# ── Brand palette ───────────────────────────────────────────────────────
NAVY = colors.HexColor("#0D1B2A")
BLUE = colors.HexColor("#1F6FEB")
SLATE = colors.HexColor("#3D4A5C")
LIGHT = colors.HexColor("#EAF1FB")
GREY = colors.HexColor("#6B7785")
RULE = colors.HexColor("#D5DDE8")

OUT_DIR = Path(__file__).resolve().parent / "docs"
OUT_FILE = OUT_DIR / "Smart_Home_Energy_Overview.pdf"


# ── Styles ────────────────────────────────────────────────────────────────
def _styles():
    ss = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=ss["Title"], fontName="Helvetica-Bold",
                                 fontSize=24, textColor=NAVY, spaceAfter=2, leading=28),
        "subtitle": ParagraphStyle("subtitle", parent=ss["Normal"], fontName="Helvetica",
                                    fontSize=12, textColor=BLUE, spaceAfter=10, leading=16),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                             fontSize=14, textColor=NAVY, spaceBefore=14, spaceAfter=6,
                             leading=18),
        "h3": ParagraphStyle("h3", parent=ss["Heading3"], fontName="Helvetica-Bold",
                             fontSize=11.5, textColor=BLUE, spaceBefore=8, spaceAfter=3,
                             leading=15),
        "body": ParagraphStyle("body", parent=ss["Normal"], fontName="Helvetica",
                               fontSize=10.5, textColor=SLATE, leading=15.5,
                               alignment=TA_LEFT, spaceAfter=6),
        "bullet": ParagraphStyle("bullet", parent=ss["Normal"], fontName="Helvetica",
                                 fontSize=10.5, textColor=SLATE, leading=15),
        "small": ParagraphStyle("small", parent=ss["Normal"], fontName="Helvetica",
                                fontSize=8.5, textColor=GREY, leading=12),
        "code": ParagraphStyle("code", parent=ss["Normal"], fontName="Courier",
                               fontSize=9.5, textColor=NAVY, leading=14,
                               backColor=LIGHT, borderPadding=8, leftIndent=2,
                               spaceBefore=2, spaceAfter=8),
        "cell": ParagraphStyle("cell", parent=ss["Normal"], fontName="Helvetica",
                               fontSize=9.5, textColor=SLATE, leading=13),
        "cellb": ParagraphStyle("cellb", parent=ss["Normal"], fontName="Helvetica-Bold",
                                fontSize=9.5, textColor=NAVY, leading=13),
    }
    return styles


def bullets(items, st):
    flow = [ListItem(Paragraph(t, st["bullet"]), leftIndent=10, value="•")
            for t in items]
    return ListFlowable(flow, bulletType="bullet", bulletColor=BLUE,
                        bulletFontSize=9, leftIndent=12, spaceAfter=6)


def kv_table(rows, st, col_widths):
    data = [[Paragraph(a, st["cellb"]), Paragraph(b, st["cell"])] for a, b in rows]
    tbl = Table(data, colWidths=col_widths, hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT]),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
    ]))
    return tbl


def rule():
    return HRFlowable(width="100%", thickness=1, color=RULE,
                      spaceBefore=4, spaceAfter=8)


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    st = _styles()
    story = []

    # ── Header ──────────────────────────────────────────────────────────
    story.append(Paragraph("Smart Home Energy Consumption Predictor", st["title"]))
    story.append(Paragraph("Project Overview &mdash; what it is, what it is for, "
                           "and how it works", st["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=10))

    # ── 1. What is this? ────────────────────────────────────────────────
    story.append(Paragraph("1. What is this?", st["h2"]))
    story.append(Paragraph(
        "An end-to-end Python project that turns raw smart-home sensor readings "
        "into insight and a forecast. It <b>loads, cleans, explores and predicts</b> "
        "household appliance energy use, and presents everything in a single "
        "interactive web dashboard. Energy is recorded every 10 minutes from "
        "appliances, lighting, indoor room sensors (temperature and humidity) and "
        "an outdoor weather station.", st["body"]))

    # ── 2. What is it used for? ─────────────────────────────────────────
    story.append(Paragraph("2. What is it used for?", st["h2"]))
    story.append(Paragraph(
        "It answers practical questions about a home's electricity use and helps "
        "anticipate it:", st["body"]))
    story.append(bullets([
        "<b>Understand consumption</b> &mdash; when energy is used across the day "
        "and week, and how usage splits into low / medium / high periods.",
        "<b>Spot the drivers</b> &mdash; which conditions (time of day, lighting, "
        "indoor and outdoor temperature) move energy use the most.",
        "<b>Predict usage</b> &mdash; estimate appliance energy for a given set of "
        "conditions, and explore &ldquo;what-if&rdquo; scenarios live.",
        "<b>Support decisions</b> &mdash; shift loads to cheaper / greener hours, "
        "size batteries or solar, flag abnormal consumption, and inform efficiency "
        "or demand-response programmes.",
    ], st))
    story.append(Paragraph(
        "Typical users: homeowners and smart-home enthusiasts, energy analysts and "
        "utilities, and students or developers learning an end-to-end data + machine "
        "learning workflow.", st["body"]))

    # ── 3. How it works ─────────────────────────────────────────────────
    story.append(Paragraph("3. How it works", st["h2"]))
    story.append(Paragraph(
        "The project is split into small, single-purpose modules that form a clear "
        "pipeline: <b>generate &rarr; load &rarr; clean &rarr; engineer features "
        "&rarr; visualise &rarr; predict</b>.", st["body"]))

    story.append(Paragraph("3.1 &nbsp;Data", st["h3"]))
    story.append(Paragraph(
        "On first run the project generates a realistic dataset of ~19,700 readings "
        "(10-minute intervals over several months). The data is behaviour-driven: "
        "appliance energy follows daily routines (morning and evening peaks), a "
        "weekend bump, and a per-day &ldquo;household activity&rdquo; level, with a "
        "weak weather influence and occasional high-usage spikes &mdash; so daily "
        "averages vary naturally rather than following any artificial trend. You can "
        "drop in your own CSV of the same layout to use real readings instead.",
        st["body"]))

    story.append(Paragraph("3.2 &nbsp;Clean &amp; feature engineering", st["h3"]))
    story.append(bullets([
        "Parse timestamps, sort chronologically, remove duplicate readings.",
        "Drop non-predictive random columns; fill any sensor gaps with time-aware "
        "interpolation.",
        "Add calendar features (hour, day of week, month, weekend flag, time-of-day), "
        "aggregates (total energy, average indoor temperature and humidity) and a "
        "Low / Medium / High <i>energy tier</i>.",
    ], st))

    story.append(Paragraph("3.3 &nbsp;Visualise &mdash; interactive dashboard", st["h3"]))
    story.append(Paragraph(
        "A Streamlit web app presents the data across four tabs, with sidebar filters "
        "(date range, days of week, time of day) that update every chart and KPI "
        "live. All charts are interactive Plotly graphs &mdash; hover for values, "
        "zoom, pan and toggle series:", st["body"]))
    story.append(bullets([
        "<b>Overview</b> &mdash; daily trend with 7-day rolling average, usage-tier "
        "donut, average energy by hour.",
        "<b>Usage Patterns</b> &mdash; hour &times; day-of-week heatmap, time-of-day "
        "distributions, weekly appliances vs lights.",
        "<b>Correlations</b> &mdash; correlation matrix, top energy drivers, "
        "outdoor-temperature vs energy scatter.",
        "<b>Predictor</b> &mdash; model accuracy, feature importance, actual vs "
        "predicted, and a live what-if simulator.",
    ], st))

    story.append(Paragraph("3.4 &nbsp;Predict &mdash; machine learning model", st["h3"]))
    story.append(Paragraph(
        "A <b>Random Forest regressor</b> (scikit-learn) predicts appliance energy "
        "(in Wh) from the temperature, humidity, weather and time features. It is "
        "trained on a portion of the data and scored on a held-out test set, "
        "reporting <b>R&sup2;</b>, <b>MAE</b> and <b>RMSE</b>. A feature-importance "
        "ranking shows which inputs matter most (time of day dominates), and the "
        "<b>what-if simulator</b> lets you set the hour, day type, temperatures and "
        "lighting to get an instant energy estimate.", st["body"]))

    # ── 4. Project structure ────────────────────────────────────────────
    story.append(Paragraph("4. Project structure", st["h2"]))
    story.append(kv_table([
        ("app.py", "Interactive Streamlit dashboard (the main deliverable)."),
        ("data_loader.py", "Load &rarr; clean &rarr; feature-engineer pipeline."),
        ("generate_sample_data.py", "Realistic dataset generator."),
        ("model.py", "Random Forest predictor, metrics and what-if helper."),
        ("config.py", "Central paths, theme colours and column groups."),
        ("requirements.txt", "Python dependencies."),
        ("data/energy_data.csv", "The dataset (auto-generated; replaceable)."),
    ], st, col_widths=[55 * mm, 110 * mm]))

    # ── 5. Tech stack & how to run ──────────────────────────────────────
    story.append(Paragraph("5. Tech stack", st["h2"]))
    story.append(Paragraph(
        "<b>Python</b> &nbsp;&bull;&nbsp; <b>pandas</b> / <b>NumPy</b> (data) "
        "&nbsp;&bull;&nbsp; <b>scikit-learn</b> (model) &nbsp;&bull;&nbsp; "
        "<b>Plotly</b> (interactive charts) &nbsp;&bull;&nbsp; <b>Streamlit</b> "
        "(web dashboard).", st["body"]))

    story.append(Paragraph("6. How to run", st["h2"]))
    story.append(Paragraph(
        "Install the dependencies and launch the dashboard &mdash; it opens in the "
        "browser and generates its data automatically on first run:", st["body"]))
    story.append(Paragraph(
        "pip install -r requirements.txt<br/>"
        "streamlit run app.py", st["code"]))
    story.append(Paragraph(
        "For a permanent shareable link, the app can be deployed from its GitHub "
        "repository to Streamlit Community Cloud, which serves it at a public "
        "<i>&hellip;.streamlit.app</i> URL.", st["body"]))

    story.append(Spacer(1, 8))
    story.append(rule())
    story.append(Paragraph(
        f"Smart Home Energy Consumption Predictor &mdash; project overview. "
        f"Generated {date.today():%d %B %Y}.", st["small"]))

    SimpleDocTemplate(
        str(OUT_FILE), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=16 * mm,
        title="Smart Home Energy Consumption Predictor — Project Overview",
        author="Smart Home Energy project",
    ).build(story)
    return OUT_FILE


if __name__ == "__main__":
    path = build()
    print(f"PDF written -> {path}  ({path.stat().st_size / 1024:.0f} KB)")
