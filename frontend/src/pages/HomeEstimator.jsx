import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LIGHT_TYPES, APPLIANCE_LIBRARY, CATEGORIES, calculate,
} from '../utils/calculate'

function ApplianceRow({ app, onToggle, onChange }) {
  const dailyKwh = app.enabled ? (app.watts * app.count * app.hours / 1000).toFixed(2) : null
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      app.enabled ? 'border-accent/50 bg-accent/5' : 'border-edge bg-card hover:border-edge/60'
    }`}>
      <button onClick={() => onToggle(app.id)}
        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
          app.enabled ? 'bg-accent text-bg' : 'bg-surface text-muted hover:bg-edge'
        }`}>
        {app.enabled ? '✓' : '+'}
      </button>
      <span className="text-lg shrink-0">{app.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{app.name}</div>
        <div className="text-xs text-muted">{app.watts}W rated</div>
      </div>
      {app.enabled && (
        <div className="flex items-center gap-2 shrink-0">
          <div>
            <div className="text-xs text-muted mb-0.5 text-center">Qty</div>
            <input type="number" min="1" max="20" value={app.count}
              onChange={e => onChange(app.id, 'count', Number(e.target.value))}
              className="w-12 bg-bg border border-edge rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-accent" />
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5 text-center">Hrs/day</div>
            <input type="number" min="0.5" max="24" step="0.5" value={app.hours}
              onChange={e => onChange(app.id, 'hours', Number(e.target.value))}
              className="w-16 bg-bg border border-edge rounded px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-accent" />
          </div>
          <div className="text-right min-w-[52px]">
            <div className="text-xs text-muted">Daily</div>
            <div className="text-xs text-accent font-semibold">{dailyKwh} kWh</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomeEstimator() {
  const navigate    = useNavigate()
  const [homeName, setHomeName] = useState('My Home')
  const [rate, setRate]         = useState(8)
  const [activeTab, setActiveTab] = useState('lighting')
  const [saved, setSaved]       = useState(false)

  const [rooms, setRooms] = useState([
    { id: 1, name: 'Living Room', count: 4, type: 'LED Bulb',      hours: 6 },
    { id: 2, name: 'Bedroom 1',   count: 2, type: 'LED Bulb',      hours: 4 },
    { id: 3, name: 'Kitchen',     count: 3, type: 'LED Tube Light', hours: 5 },
  ])

  const [appliances, setAppliances] = useState(
    APPLIANCE_LIBRARY.map(a => ({ ...a, count: 1, hours: a.defaultHours, enabled: false }))
  )

  const results = calculate(rooms, appliances, rate)

  const addRoom    = () => setRooms(p => [...p, { id: Date.now(), name: `Room ${p.length + 1}`, count: 2, type: 'LED Bulb', hours: 4 }])
  const removeRoom = (id) => setRooms(p => p.filter(r => r.id !== id))
  const updateRoom = (id, k, v) => setRooms(p => p.map(r => r.id === id ? { ...r, [k]: v } : r))
  const toggleApp  = (id) => setAppliances(p => p.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  const updateApp  = (id, k, v) => setAppliances(p => p.map(a => a.id === id ? { ...a, [k]: v } : a))

  const saveData = () => {
    const entry = {
      id:        Date.now(),
      savedAt:   new Date().toISOString(),
      name:      homeName,
      rate,
      rooms,
      appliances,
      results,
    }
    // Save as current home (for dashboard)
    localStorage.setItem('currentHome', JSON.stringify(entry))
    // Save to history list
    const history = JSON.parse(localStorage.getItem('energyHistory') ?? '[]')
    // Replace existing entry with same name, or prepend
    const idx = history.findIndex(h => h.name === homeName)
    if (idx !== -1) history[idx] = entry
    else history.unshift(entry)
    localStorage.setItem('energyHistory', JSON.stringify(history))
    setSaved(true)
    setTimeout(() => { setSaved(false); navigate('/') }, 1200)
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Home Setup</h1>
          <p className="text-muted text-sm mt-1">Fill in your home details to generate your personal energy dashboard</p>
        </div>
        <button onClick={saveData}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-accent text-bg hover:bg-accent/80'
          }`}>
          {saved ? '✓ Saved! Opening Dashboard…' : 'Save & View Dashboard'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Profile */}
          <div className="bg-card border border-edge rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Home Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-muted text-xs block mb-1">Home / Profile Name</label>
                <input type="text" value={homeName} onChange={e => setHomeName(e.target.value)}
                  className="w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-muted text-xs block mb-1">Electricity Rate (₹/kWh) — India avg: ₹6–10</label>
                <input type="number" min="1" max="50" step="0.5" value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  className="w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card border border-edge rounded-xl overflow-hidden">
            <div className="flex border-b border-edge">
              {[
                { id: 'lighting',   label: '💡 Lighting'   },
                { id: 'appliances', label: '🔌 Appliances' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-accent border-b-2 border-accent bg-bg'
                      : 'text-muted hover:text-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* Lighting */}
              {activeTab === 'lighting' && (
                <div className="space-y-3">
                  {rooms.map(room => {
                    const lt = LIGHT_TYPES.find(l => l.type === room.type) ?? LIGHT_TYPES[0]
                    const dailyKwh = (lt.watts * room.count * room.hours / 1000).toFixed(2)
                    return (
                      <div key={room.id} className="bg-bg border border-edge rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input type="text" value={room.name}
                            onChange={e => updateRoom(room.id, 'name', e.target.value)}
                            className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none border-b border-transparent focus:border-accent pb-0.5" />
                          <span className="text-xs text-accent font-medium">{dailyKwh} kWh/day</span>
                          <button onClick={() => removeRoom(room.id)}
                            className="text-muted hover:text-coral transition-colors px-1 text-xs">✕</button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-muted text-xs block mb-1">No. of Lights</label>
                            <input type="number" min="1" max="50" value={room.count}
                              onChange={e => updateRoom(room.id, 'count', Number(e.target.value))}
                              className="w-full bg-card border border-edge rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-accent" />
                          </div>
                          <div>
                            <label className="text-muted text-xs block mb-1">Light Type</label>
                            <select value={room.type} onChange={e => updateRoom(room.id, 'type', e.target.value)}
                              className="w-full bg-card border border-edge rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent pr-6">
                              {LIGHT_TYPES.map(lt => (
                                <option key={lt.type} value={lt.type}>{lt.type} ({lt.watts}W)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-muted text-xs block mb-1">Hours/day</label>
                            <input type="number" min="0.5" max="24" step="0.5" value={room.hours}
                              onChange={e => updateRoom(room.id, 'hours', Number(e.target.value))}
                              className="w-full bg-card border border-edge rounded px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-accent" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={addRoom}
                    className="w-full py-2.5 border border-dashed border-edge rounded-lg text-muted text-sm hover:border-accent hover:text-accent transition-colors">
                    + Add Room
                  </button>
                </div>
              )}

              {/* Appliances */}
              {activeTab === 'appliances' && (
                <div className="space-y-5">
                  {CATEGORIES.map(cat => (
                    <div key={cat}>
                      <div className="text-muted text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>{cat}</span>
                        <span className="flex-1 h-px bg-edge" />
                        <span className="text-accent text-xs">
                          {appliances.filter(a => a.category === cat && a.enabled).length} active
                        </span>
                      </div>
                      <div className="space-y-2">
                        {appliances.filter(a => a.category === cat).map(app => (
                          <ApplianceRow key={app.id} app={app} onToggle={toggleApp} onChange={updateApp} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Live Summary ── */}
        <div>
          <div className="bg-card border border-edge rounded-xl p-5 sticky top-6">
            <h2 className="text-white font-semibold mb-4">Live Estimate</h2>

            <div className="text-center py-5 border-b border-edge mb-4">
              <div className="text-muted text-xs uppercase tracking-widest mb-1">Monthly Consumption</div>
              <div className="text-5xl font-bold text-accent leading-none">{results.monthlyKwh.toFixed(1)}</div>
              <div className="text-muted text-sm mt-1">kWh / month</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Daily',        value: `${results.dailyKwh.toFixed(2)} kWh`,    color: 'text-white'    },
                { label: 'Monthly Cost', value: `₹${results.monthlyCost.toLocaleString()}`, color: 'text-gold' },
                { label: 'Lighting/day', value: `${(results.lightingWh/1000).toFixed(2)} kWh`, color: 'text-green-400' },
                { label: 'Appliances/day',value:`${(results.appliancesWh/1000).toFixed(2)} kWh`, color: 'text-accent' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-bg rounded-lg p-3 border border-edge">
                  <div className="text-muted text-xs mb-0.5">{label}</div>
                  <div className={`text-sm font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>💡 {results.lightingPct}%</span>
                <span>🔌 {results.appliancesPct}%</span>
              </div>
              <div className="h-3 bg-bg rounded-full overflow-hidden flex border border-edge">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${results.lightingPct}%` }} />
                <div className="h-full bg-accent transition-all duration-300"   style={{ width: `${results.appliancesPct}%` }} />
              </div>
            </div>

            {appliances.filter(a => a.enabled).length > 0 && (
              <div className="border-t border-edge pt-4 mb-4">
                <div className="text-muted text-xs uppercase tracking-widest mb-2">Active Appliances</div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {appliances.filter(a => a.enabled).map(a => (
                    <div key={a.id} className="flex justify-between text-xs">
                      <span className="text-muted truncate">{a.icon} {a.name} ×{a.count}</span>
                      <span className="text-white ml-2 shrink-0">
                        {(a.watts * a.count * a.hours / 1000).toFixed(2)} kWh/d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={saveData}
              className="w-full py-2.5 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent/80 transition-colors">
              Save & View Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
