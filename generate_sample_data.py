"""
Data generator for the Smart Home Energy project.

Produces the project's energy dataset (data/energy_data.csv) so the whole
project runs end-to-end out of the box. Replace that file with your own
readings of the same column layout to use them instead.

The signal is built to behave like a real smart home:
  * outdoor temperature follows a seasonal baseline plus a daily cycle
  * indoor rooms track the outdoor temperature, damped, room by room
  * appliance energy is driven mainly by time-of-day behaviour (morning
    and evening peaks), a weekend bump and a per-day "how busy was the
    home" activity level, with only a weak, noisy weather influence and a
    heavy right tail of occasional high-usage spikes

Because each calendar day gets its own random activity level, the daily
averages wander naturally instead of following any clean built-in trend.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

import config


def generate(seed: int = 42, n_rows: int = 19_735,
             start: str = "2016-01-11 17:00:00") -> pd.DataFrame:
    """Return a synthetic DataFrame of 10-minute smart-home readings."""
    rng = np.random.default_rng(seed)

    dates = pd.date_range(start=start, periods=n_rows, freq="10min")
    hour = dates.hour + dates.minute / 60.0          # fractional hour 0..24
    doy = dates.dayofyear.to_numpy()
    dow = dates.dayofweek.to_numpy()                 # 0 = Mon
    is_weekend = (dow >= 5).astype(float)

    # Integer index of the calendar day each reading belongs to (0, 1, 2 …).
    day_norm = dates.normalize()
    day_id = (day_norm - day_norm[0]).days.to_numpy()
    n_days = int(day_id.max()) + 1

    # ── Weather ───────────────────────────────────────────────────────
    # Seasonal baseline (cooler early, milder later) plus a daily cosine
    # cycle. Day-to-day weather scatter is added so it is not too smooth.
    season = np.interp(doy, [11, 60, 105, 150], [3.0, 6.0, 12.0, 16.0])
    day_weather = rng.normal(0, 2.2, n_days)[day_id]   # whole-day offset
    daily_cycle = -np.cos((hour - 3) / 24 * 2 * np.pi)  # min ~3am, max ~3pm
    t_out = season + day_weather + 5.0 * daily_cycle + rng.normal(0, 1.5, n_rows)

    press = 755 + 8 * np.sin(doy / 15.0) + rng.normal(0, 4, n_rows)
    windspeed = np.clip(rng.gamma(2.0, 2.0, n_rows), 0, 14)
    visibility = np.clip(40 + rng.normal(0, 12, n_rows), 1, 66)
    rh_out = np.clip(78 - 7.0 * daily_cycle + rng.normal(0, 10, n_rows), 20, 100)
    tdew = t_out - (100 - rh_out) / 5.0 + rng.normal(0, 1.0, n_rows)

    # ── Indoor rooms (T1..T9 / RH_1..RH_9), T6 is the outside-north side ─
    indoor_base = 20.0 + 0.15 * (t_out - 10.0)       # comfortable, damped
    temps: dict[str, np.ndarray] = {}
    hums: dict[str, np.ndarray] = {}
    for i in range(1, 10):
        if i == 6:                                   # outdoor sensor
            temps["T6"] = t_out + rng.normal(0, 2.0, n_rows)
            hums["RH_6"] = np.clip(rh_out + rng.normal(0, 8, n_rows), 1, 100)
        else:
            t = indoor_base + (i - 5) * 0.2 + rng.normal(0, 1.2, n_rows)
            temps[f"T{i}"] = t
            hums[f"RH_{i}"] = np.clip(40 - 0.3 * (t - 20) + rng.normal(0, 6, n_rows),
                                      15, 65)

    avg_indoor_temp = np.mean([temps[f"T{i}"] for i in range(1, 10) if i != 6],
                              axis=0)

    # ── Lights (Wh): mostly off, on in the evening / early morning ──────
    light_prob = np.select(
        [(hour >= 17) & (hour <= 23), (hour >= 6) & (hour <= 8)],
        [0.50, 0.35], default=0.08)
    lights = ((rng.random(n_rows) < light_prob)
              * rng.choice([10, 20, 30, 40, 50, 60, 70], n_rows)).astype(float)

    # ── Appliances (Wh) — the prediction target ─────────────────────────
    # Daily behaviour profile: a morning peak, a larger evening peak and a
    # smaller midday bump — this is the dominant, learnable signal.
    hour_profile = (
        50 * np.exp(-((hour - 7.5) ** 2) / 3.5)       # morning peak ~07:30
        + 105 * np.exp(-((hour - 18.5) ** 2) / 6.0)   # evening peak ~18:30
        + 30 * np.exp(-((hour - 13.0) ** 2) / 7.0)    # midday bump
    )

    # One random "household activity" multiplier per calendar day. Every
    # reading on the same day shares it, so daily averages bounce around
    # realistically with no built-in upward or downward trend.
    day_activity = np.clip(rng.normal(1.0, 0.16, n_days), 0.55, 1.7)[day_id]

    base = 40 + hour_profile
    base = base * (1 + 0.15 * is_weekend)            # homes busier at weekends
    base = base * day_activity                        # per-day occupancy swing
    base = base + 0.45 * lights                       # lighting adds a little
    # Weak, noisy weather nudge: only cold spells lift usage, and only
    # slightly — too small to create a visible seasonal trend.
    base = base + np.clip(8.0 - t_out, 0, None) * rng.uniform(0, 0.8, n_rows)

    noise = rng.lognormal(0.0, 0.22, n_rows)          # multiplicative skew
    appliances = base * noise

    # Heavy-tail spikes, concentrated in the busy evening hours.
    spike_gate = 0.3 + ((hour >= 17) & (hour <= 21)).astype(float)
    spikes = (rng.random(n_rows) < 0.012 * spike_gate) * rng.uniform(140, 360, n_rows)
    appliances = np.clip(appliances + spikes, 10, 1080).round().astype(int)

    # ── Assemble in the full column order ───────────────────────────────
    data = {
        "date": dates.strftime("%Y-%m-%d %H:%M:%S"),
        "Appliances": appliances,
        "lights": lights.astype(int),
    }
    for i in range(1, 10):
        data[f"T{i}"] = np.round(temps[f"T{i}"], 2)
        data[f"RH_{i}"] = np.round(hums[f"RH_{i}"], 2)
    data["T_out"] = np.round(t_out, 2)
    data["Press_mm_hg"] = np.round(press, 1)
    data["RH_out"] = np.round(rh_out, 1)
    data["Windspeed"] = np.round(windspeed, 2)
    data["Visibility"] = np.round(visibility, 1)
    data["Tdewpoint"] = np.round(tdew, 2)
    rv = np.round(rng.uniform(0, 50, n_rows), 6)
    data["rv1"] = rv
    data["rv2"] = rv

    return pd.DataFrame(data, columns=config.RAW_COLUMNS)


def generate_and_save(path=config.DATA_FILE, **kwargs) -> "Path":
    """Generate the dataset and write it to `path` (default: data/energy_data.csv)."""
    df = generate(**kwargs)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    out = generate_and_save()
    sample = pd.read_csv(out)
    print(f"Generated {len(sample):,} rows -> {out}")
    print(f"Columns ({len(sample.columns)}): {list(sample.columns)}")
    print(sample[["date", "Appliances", "lights", "T_out", "RH_out"]].head())
