import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import KPICard from '../components/KPICard'
import { api } from '../api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PALETTE = ['#58A6FF', '#3FB950', '#F78166', '#D2A8FF', '#E3B341', '#79C0FF', '#56D364']
const TIP = { backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: 8, color: '#E6EDF3', fontSize: 12 }

/* ── Heatmap (24 hours × 7 days grid) ── */
function Heatmap({ data }) {
  if (!data.length) return null
  const vals = data.map(d => d.value)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)

  const grid = Array.from({ length: 24 }, (_, h) =>
    Array.from({ length: 7 }, (_, d) => {
      const cell = data.find(item => item.hour === h && item.dayofweek === d)
      return cell ? cell.value : 0
    })
  )

  const color = (v) => {
    const r = (v - lo) / (hi - lo)
    return `rgb(${Math.round(r * 88)},${Math.round(20 + r * 145)},${Math.round(60 + r * 195)})`
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="flex mb-1 ml-8">
          {DAYS.map(d => (
            <div key={d} className="flex-1 text-center text-muted text-xs">{d}</div>
          ))}
        </div>
        {grid.map((row, h) => (
          <div key={h} className="flex items-center mb-px">
            <div className="w-8 text-muted text-xs text-right pr-2 shrink-0">{h}h</div>
            {row.map((val, d) => (
              <div
                key={d}
                className="flex-1 h-5 mx-px rounded-sm cursor-default"
                style={{ backgroundColor: color(val) }}
                title={`${DAYS[d]} ${h}:00 — ${val.toFixed(0)} Wh avg`}
              />
            ))}
          </div>
        ))}
        <div className="flex justify-between mt-2 ml-8 text-xs text-muted">
          <span>Low ({lo.toFixed(0)} Wh)</span>
          <span>High ({hi.toFixed(0)} Wh)</span>
        </div>
      </div>
    </div>
  )
}

/* ── What-If Simulator ── */
function WhatIfSimulator({ defaults }) {
  const [form, setForm] = useState({
    T_out: 10, RH_out: 75, lights: 30, hour: 12, is_weekend: 0,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const run = async () => {
    setLoading(true)
    try { setResult(await api.predict(form)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const Slider = ({ label, field, min, max, step = 1, unit = '' }) => (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        <span className="text-white">{form[field]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={form[field]}
        onChange={e => set(field, Number(e.target.value))}
        className="w-full" />
    </div>
  )

  return (
    <div className="bg-card border border-edge rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">What-If Simulator</h3>
      <div className="space-y-4">
        <Slider label="Outdoor Temp" field="T_out" min={-10} max={45} step={0.5} unit="°C" />
        <Slider label="Outdoor Humidity" field="RH_out" min={10} max={100} unit="%" />
        <Slider label="Lighting" field="lights" min={0} max={200} unit=" Wh" />
        <Slider label="Hour of Day" field="hour" min={0} max={23} unit=":00" />
        <div>
          <div className="text-xs text-muted mb-1">Day type</div>
          <div className="flex gap-2">
            {['Weekday', 'Weekend'].map((lbl, i) => (
              <button key={i} onClick={() => set('is_weekend', i)}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  form.is_weekend === i ? 'bg-accent text-bg' : 'bg-surface text-muted hover:text-white'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <button onClick={run} disabled={loading}
          className="w-full py-2 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50">
          {loading ? 'Predicting…' : 'Run Prediction'}
        </button>
        {result && (
          <div className="bg-bg rounded-lg p-4 text-center border border-edge">
            <div className="text-muted text-xs uppercase tracking-widest">Predicted Appliance Use</div>
            <div className="text-4xl font-bold text-accent mt-1">{result.predicted_wh.toFixed(0)}</div>
            <div className="text-muted text-xs mt-0.5">Wh per 10-min reading</div>
            <div className="text-muted text-xs">≈ {(result.predicted_wh * 144 / 1000).toFixed(2)} kWh/day</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const [summary, setSummary]       = useState(null)
  const [trends, setTrends]         = useState([])
  const [heatmap, setHeatmap]       = useState([])
  const [hourly, setHourly]         = useState([])
  const [tod, setTod]               = useState([])
  const [importances, setImportances] = useState([])
  const [modelInfo, setModelInfo]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [trendDays, setTrendDays]   = useState(60)

  useEffect(() => {
    Promise.all([
      api.summary(), api.trends(60), api.heatmap(),
      api.hourly(), api.tod(), api.importances(), api.model(),
    ]).then(([s, t, h, hr, td, imp, m]) => {
      setSummary(s); setTrends(t); setHeatmap(h)
      setHourly(hr); setTod(td); setImportances(imp); setModelInfo(m)
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!loading && !error) api.trends(trendDays).then(setTrends)
  }, [trendDays])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">⚡</div>
        <div className="text-muted text-sm">Loading dashboard data…</div>
        <div className="text-muted text-xs mt-1">Training model on first run takes ~10 seconds</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-white font-semibold mb-2">Backend not reachable</div>
        <code className="text-coral text-xs block mb-4">{error}</code>
        <div className="text-muted text-xs bg-surface rounded-lg p-3 text-left">
          Start the API server:<br />
          <code className="text-accent">cd backend</code><br />
          <code className="text-accent">uvicorn main:app --reload --port 8000</code>
        </div>
      </div>
    </div>
  )

  const tickX = { fill: '#8B949E', fontSize: 11 }
  const tickY = { fill: '#8B949E', fontSize: 11 }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Energy Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          {summary?.date_from} — {summary?.date_to} &middot; {summary?.records?.toLocaleString()} readings
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Energy"  value={summary?.total_kwh?.toLocaleString()} unit="kWh" color="text-accent" />
        <KPICard label="Avg Daily"     value={summary?.avg_daily_kwh} unit="kWh/day" color="text-green-400" />
        <KPICard label="Peak Hour"     value={`${summary?.peak_hour}:00`} sub="Highest avg consumption" color="text-yellow-400" />
        <KPICard label="Model R²"      value={summary?.r2} sub={`MAE ${summary?.mae} Wh · RMSE ${summary?.rmse} Wh`} color="text-purple-400" />
      </div>

      {/* Trend chart */}
      <div className="bg-card border border-edge rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Energy Trend</h2>
          <div className="flex gap-2">
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setTrendDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  trendDays === d ? 'bg-accent text-bg' : 'bg-surface text-muted hover:text-white'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="date" stroke="#30363D" tick={tickX}
              tickFormatter={v => v.slice(5)}
              interval={Math.max(1, Math.floor(trends.length / 10))} />
            <YAxis stroke="#30363D" tick={tickY} unit=" kWh" width={60} />
            <Tooltip contentStyle={TIP} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#8B949E' }} />
            <Line type="monotone" dataKey="appliances" name="Appliances" stroke="#58A6FF" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="lights"     name="Lights"     stroke="#3FB950" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="rolling7d"  name="7-day avg"  stroke="#E3B341" dot={false} strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap + Hourly profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Hour × Day Heatmap (avg Wh)</h2>
          <Heatmap data={heatmap} />
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Hourly Profile</h2>
          <ResponsiveContainer width="100%" height={265}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="hour" stroke="#30363D" tick={tickX} tickFormatter={v => `${v}h`} />
              <YAxis stroke="#30363D" tick={tickY} unit=" Wh" width={55} />
              <Tooltip contentStyle={TIP} formatter={v => [`${v} Wh`, 'Avg Energy']} />
              <Bar dataKey="avg_energy" name="Avg Energy">
                {hourly.map((_, i) => (
                  <Cell key={i} fill={i >= 17 || i <= 6 ? '#F78166' : '#58A6FF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-muted"><span className="w-2.5 h-2.5 rounded-sm bg-[#58A6FF] inline-block" />Day hours</span>
            <span className="flex items-center gap-1.5 text-xs text-muted"><span className="w-2.5 h-2.5 rounded-sm bg-[#F78166] inline-block" />Night / Evening</span>
          </div>
        </div>
      </div>

      {/* Time-of-day + Feature importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Time-of-Day Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tod} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis type="number" stroke="#30363D" tick={tickX} unit=" Wh" />
              <YAxis type="category" dataKey="period" stroke="#30363D" tick={tickY} width={80} />
              <Tooltip contentStyle={TIP} formatter={v => [`${v} Wh`, 'Avg Energy']} />
              <Bar dataKey="avg_energy" name="Avg Energy" radius={[0, 4, 4, 0]}>
                {tod.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Top Energy Drivers</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={importances.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis type="number" stroke="#30363D" tick={tickX} />
              <YAxis type="category" dataKey="feature" stroke="#30363D" tick={tickY} width={80} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toFixed(4), 'Importance']} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {importances.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={`hsl(${210 + i * 10}, 70%, ${65 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What-If + Model info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WhatIfSimulator defaults={modelInfo?.defaults} />
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Model Performance</h3>
          <div className="space-y-3">
            {[
              { label: 'Algorithm',     value: 'Random Forest' },
              { label: 'R² Score',      value: modelInfo?.r2,                      hi: true },
              { label: 'MAE',           value: `${modelInfo?.mae} Wh` },
              { label: 'RMSE',          value: `${modelInfo?.rmse} Wh` },
              { label: 'Train samples', value: modelInfo?.n_train?.toLocaleString() },
              { label: 'Test samples',  value: modelInfo?.n_test?.toLocaleString() },
            ].map(({ label, value, hi }) => (
              <div key={label} className="flex justify-between text-sm border-b border-edge pb-2.5 last:border-0 last:pb-0">
                <span className="text-muted">{label}</span>
                <span className={hi ? 'text-green-400 font-semibold' : 'text-white'}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
