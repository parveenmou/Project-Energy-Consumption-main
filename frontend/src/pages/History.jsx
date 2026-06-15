import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

const COLORS = ['#58A6FF', '#3FB950', '#F78166', '#D2A8FF', '#E3B341', '#79C0FF']
const TIP = { backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: 8, color: '#E6EDF3', fontSize: 12 }

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function EstimateCard({ entry, isSelected, colorDot, onToggle, onDelete }) {
  const r = entry.results
  return (
    <div
      onClick={onToggle}
      className={`bg-card border rounded-xl p-5 cursor-pointer transition-all ${
        isSelected ? 'border-accent shadow-lg shadow-accent/10' : 'border-edge hover:border-edge/60'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isSelected && colorDot && (
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorDot }} />
            )}
            <div className="text-white font-semibold truncate">{entry.name}</div>
          </div>
          <div className="text-muted text-xs mt-0.5">{formatDate(entry.savedAt)}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-muted hover:text-coral text-sm transition-colors ml-2 shrink-0"
          title="Delete">✕</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-bg rounded-lg p-2 text-center border border-edge">
          <div className="text-accent font-bold text-base">{r.dailyKwh.toFixed(1)}</div>
          <div className="text-muted text-xs">kWh/day</div>
        </div>
        <div className="bg-bg rounded-lg p-2 text-center border border-edge">
          <div className="text-white font-bold text-base">{r.monthlyKwh.toFixed(0)}</div>
          <div className="text-muted text-xs">kWh/mo</div>
        </div>
        <div className="bg-bg rounded-lg p-2 text-center border border-edge">
          <div className="text-gold font-bold text-base">₹{r.monthlyCost.toFixed(0)}</div>
          <div className="text-muted text-xs">cost/mo</div>
        </div>
      </div>

      {/* Lighting vs appliances bar */}
      <div className="h-2 bg-bg rounded-full overflow-hidden flex border border-edge">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${r.lightingPct ?? 30}%` }} />
        <div className="h-full bg-accent transition-all"   style={{ width: `${r.appliancesPct ?? 70}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>💡 {(r.lightingPct ?? 0).toFixed(0)}%</span>
        <span>🔌 {(r.appliancesPct ?? 0).toFixed(0)}%</span>
      </div>

      {/* Appliance tags */}
      {entry.appliances?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {entry.appliances.slice(0, 4).map(a => (
            <span key={a.id} className="text-xs bg-surface text-muted rounded px-1.5 py-0.5">
              {a.icon} {a.name}
            </span>
          ))}
          {entry.appliances.length > 4 && (
            <span className="text-xs bg-surface text-muted rounded px-1.5 py-0.5">
              +{entry.appliances.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function History() {
  const [entries, setEntries]   = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    setEntries(JSON.parse(localStorage.getItem('energyHistory') ?? '[]'))
  }, [])

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id].slice(-6)
    )
  }

  const deleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    setSelected(prev => prev.filter(s => s !== id))
    localStorage.setItem('energyHistory', JSON.stringify(updated))
  }

  const clearAll = () => {
    if (!confirm('Delete all saved estimates?')) return
    setEntries([]); setSelected([])
    localStorage.removeItem('energyHistory')
  }

  const compared = entries.filter(e => selected.includes(e.id))

  const compareData = compared.map((e, i) => ({
    name:       e.name,
    daily:      parseFloat(e.results.dailyKwh.toFixed(2)),
    monthly:    parseFloat(e.results.monthlyKwh.toFixed(1)),
    cost:       parseFloat(e.results.monthlyCost.toFixed(0)),
    lighting:   parseFloat((e.results.lightingWh   / 1000).toFixed(2)),
    appliances: parseFloat((e.results.appliancesWh / 1000).toFixed(2)),
    color:      COLORS[i % COLORS.length],
  }))

  /* ── Empty state ── */
  if (entries.length === 0) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-white font-semibold text-lg">No saved estimates yet</div>
        <p className="text-muted text-sm mt-2 max-w-xs">
          Go to <strong className="text-accent">Home Estimator</strong>, fill in your home setup,
          then click <em>Save Estimate</em> to build your history.
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estimate History</h1>
          <p className="text-muted text-sm mt-1">
            {entries.length} saved estimate{entries.length !== 1 ? 's' : ''} &middot; select up to 6 to compare
          </p>
        </div>
        <button onClick={clearAll} className="text-xs text-coral hover:underline">Clear all</button>
      </div>

      {/* Tip when nothing selected */}
      {selected.length < 2 && entries.length >= 2 && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 text-sm text-accent">
          💡 Click on two or more cards to compare them side by side
        </div>
      )}

      {/* Estimates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map((entry, idx) => {
          const selIdx = selected.indexOf(entry.id)
          return (
            <EstimateCard
              key={entry.id}
              entry={entry}
              isSelected={selIdx !== -1}
              colorDot={selIdx !== -1 ? COLORS[selIdx % COLORS.length] : null}
              onToggle={() => toggleSelect(entry.id)}
              onDelete={() => deleteEntry(entry.id)}
            />
          )
        })}
      </div>

      {/* ── Comparison section ── */}
      {compared.length >= 2 && (
        <div className="space-y-6 border-t border-edge pt-6">
          <h2 className="text-white font-semibold text-lg">
            Comparing: {compared.map(e => e.name).join(' vs ')}
          </h2>

          {/* Summary table */}
          <div className="bg-card border border-edge rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-edge">
                    <th className="text-left text-muted text-xs px-5 py-3 font-medium w-40">Metric</th>
                    {compared.map((e, i) => (
                      <th key={e.id} className="text-left px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-white font-medium truncate">{e.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Daily Consumption',   get: e => `${e.results.dailyKwh.toFixed(2)} kWh`                  },
                    { label: 'Monthly Consumption',  get: e => `${e.results.monthlyKwh.toFixed(1)} kWh`                },
                    { label: 'Monthly Cost',         get: e => `₹${e.results.monthlyCost.toFixed(0)}`                  },
                    { label: 'Lighting (daily)',     get: e => `${(e.results.lightingWh   / 1000).toFixed(2)} kWh`     },
                    { label: 'Appliances (daily)',   get: e => `${(e.results.appliancesWh / 1000).toFixed(2)} kWh`     },
                    { label: 'Electricity Rate',     get: e => `₹${e.rate}/kWh`                                        },
                    { label: 'No. of Rooms',         get: e => e.rooms?.length ?? '—'                                  },
                    { label: 'Active Appliances',    get: e => e.appliances?.length ?? 0                               },
                  ].map(({ label, get }) => (
                    <tr key={label} className="border-b border-edge last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="text-muted px-5 py-3">{label}</td>
                      {compared.map(e => (
                        <td key={e.id} className="text-white px-5 py-3 font-medium">{get(e)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly kWh */}
            <div className="bg-card border border-edge rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Monthly Consumption (kWh)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} />
                  <YAxis stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} unit=" kWh" />
                  <Tooltip contentStyle={TIP} formatter={v => [`${v} kWh`, 'Monthly']} />
                  <Bar dataKey="monthly" radius={[4, 4, 0, 0]}>
                    {compareData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly cost */}
            <div className="bg-card border border-edge rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Monthly Cost (₹)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} />
                  <YAxis stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} unit=" ₹" />
                  <Tooltip contentStyle={TIP} formatter={v => [`₹${v}`, 'Monthly Cost']} />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {compareData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stacked: lighting vs appliances */}
            <div className="bg-card border border-edge rounded-xl p-5 md:col-span-2">
              <h3 className="text-white font-semibold mb-4">Daily Breakdown — Lighting vs Appliances (kWh)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} />
                  <YAxis stroke="#30363D" tick={{ fill: '#8B949E', fontSize: 11 }} unit=" kWh" />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8B949E' }} />
                  <Bar dataKey="lighting"   name="Lighting"    stackId="a" fill="#3FB950" />
                  <Bar dataKey="appliances" name="Appliances"  stackId="a" fill="#58A6FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
