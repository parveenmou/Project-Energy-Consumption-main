import { useState } from 'react'

/* ── Static data ── */
const LIGHT_TYPES = [
  { type: 'LED Bulb',              watts: 9  },
  { type: 'CFL Bulb',              watts: 14 },
  { type: 'LED Tube Light',        watts: 18 },
  { type: 'Fluorescent Tube',      watts: 36 },
  { type: 'Incandescent Bulb',     watts: 60 },
  { type: 'Halogen',               watts: 50 },
]

const APPLIANCE_LIBRARY = [
  // Cooling
  { id: 'ac_1t',    name: 'AC (1 Ton)',          icon: '❄️',  watts: 1000, category: 'Cooling',       defaultHours: 8  },
  { id: 'ac_15t',   name: 'AC (1.5 Ton)',         icon: '❄️',  watts: 1500, category: 'Cooling',       defaultHours: 8  },
  { id: 'ac_2t',    name: 'AC (2 Ton)',            icon: '❄️',  watts: 2000, category: 'Cooling',       defaultHours: 8  },
  { id: 'fan',      name: 'Ceiling Fan',           icon: '🌀',  watts: 75,   category: 'Cooling',       defaultHours: 10 },
  { id: 'cooler',   name: 'Air Cooler',            icon: '💨',  watts: 200,  category: 'Cooling',       defaultHours: 8  },
  // Kitchen
  { id: 'fridge',   name: 'Refrigerator',          icon: '🧊',  watts: 150,  category: 'Kitchen',       defaultHours: 24 },
  { id: 'micro',    name: 'Microwave',             icon: '📡',  watts: 1000, category: 'Kitchen',       defaultHours: 1  },
  { id: 'oven',     name: 'Electric Oven',         icon: '🔥',  watts: 2150, category: 'Kitchen',       defaultHours: 1  },
  { id: 'mixer',    name: 'Mixer / Grinder',       icon: '🔄',  watts: 750,  category: 'Kitchen',       defaultHours: 0.5},
  { id: 'dishwash', name: 'Dishwasher',            icon: '🍽️',  watts: 1800, category: 'Kitchen',       defaultHours: 1  },
  // Entertainment
  { id: 'tv32',     name: 'TV (32")',              icon: '📺',  watts: 60,   category: 'Entertainment', defaultHours: 5  },
  { id: 'tv55',     name: 'TV (55"+)',             icon: '📺',  watts: 150,  category: 'Entertainment', defaultHours: 5  },
  { id: 'desktop',  name: 'Desktop PC',            icon: '🖥️',  watts: 200,  category: 'Entertainment', defaultHours: 6  },
  { id: 'laptop',   name: 'Laptop',                icon: '💻',  watts: 50,   category: 'Entertainment', defaultHours: 6  },
  { id: 'router',   name: 'WiFi Router',           icon: '📶',  watts: 10,   category: 'Entertainment', defaultHours: 24 },
  // Laundry
  { id: 'washing',  name: 'Washing Machine',       icon: '🫧',  watts: 500,  category: 'Laundry',       defaultHours: 1  },
  { id: 'dryer',    name: 'Clothes Dryer',         icon: '♨️',  watts: 3000, category: 'Laundry',       defaultHours: 1  },
  { id: 'iron',     name: 'Clothes Iron',          icon: '👔',  watts: 1000, category: 'Laundry',       defaultHours: 0.5},
  // Water
  { id: 'geyser',   name: 'Water Heater / Geyser', icon: '🚿',  watts: 2000, category: 'Water',         defaultHours: 1  },
  { id: 'pump',     name: 'Water Pump',             icon: '💧',  watts: 750,  category: 'Water',         defaultHours: 1  },
]

const CATEGORIES = [...new Set(APPLIANCE_LIBRARY.map(a => a.category))]

/* ── Calculation ── */
function calculate(rooms, appliances, rate) {
  let lightingWh = 0
  rooms.forEach(r => {
    const lt = LIGHT_TYPES.find(l => l.type === r.type) ?? LIGHT_TYPES[0]
    lightingWh += lt.watts * r.count * r.hours
  })

  let appliancesWh = 0
  appliances.filter(a => a.enabled).forEach(a => {
    appliancesWh += a.watts * a.count * a.hours
  })

  const totalDailyWh  = lightingWh + appliancesWh
  const dailyKwh      = totalDailyWh / 1000
  const monthlyKwh    = dailyKwh * 30
  const monthlyCost   = monthlyKwh * rate

  return {
    lightingWh, appliancesWh, totalDailyWh, dailyKwh, monthlyKwh, monthlyCost,
    lightingPct:    totalDailyWh > 0 ? (lightingWh    / totalDailyWh) * 100 : 0,
    appliancesPct:  totalDailyWh > 0 ? (appliancesWh  / totalDailyWh) * 100 : 0,
  }
}

/* ── Appliance row ── */
function ApplianceRow({ app, onToggle, onChange }) {
  const dailyKwh = app.enabled ? (app.watts * app.count * app.hours / 1000).toFixed(2) : null
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      app.enabled ? 'border-accent/50 bg-accent/5' : 'border-edge bg-card hover:border-edge/80'
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
              className="w-12 bg-bg border border-edge rounded px-1.5 py-1 text-xs text-white text-center" />
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5 text-center">Hrs/day</div>
            <input type="number" min="0.5" max="24" step="0.5" value={app.hours}
              onChange={e => onChange(app.id, 'hours', Number(e.target.value))}
              className="w-16 bg-bg border border-edge rounded px-1.5 py-1 text-xs text-white text-center" />
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

/* ── Main page ── */
export default function HomeEstimator() {
  const [homeName, setHomeName] = useState('My Home')
  const [rate, setRate]         = useState(8)
  const [activeTab, setActiveTab] = useState('lighting')
  const [flash, setFlash]       = useState(false)

  const [rooms, setRooms] = useState([
    { id: 1, name: 'Living Room', count: 4, type: 'LED Bulb',        hours: 6 },
    { id: 2, name: 'Bedroom 1',   count: 2, type: 'LED Bulb',        hours: 4 },
    { id: 3, name: 'Kitchen',     count: 3, type: 'LED Tube Light',   hours: 5 },
  ])

  const [appliances, setAppliances] = useState(
    APPLIANCE_LIBRARY.map(a => ({ ...a, count: 1, hours: a.defaultHours, enabled: false }))
  )

  const results = calculate(rooms, appliances, rate)

  /* Room helpers */
  const addRoom = () => setRooms(p => [...p, {
    id: Date.now(), name: `Room ${p.length + 1}`, count: 2, type: 'LED Bulb', hours: 4,
  }])
  const removeRoom    = (id) => setRooms(p => p.filter(r => r.id !== id))
  const updateRoom    = (id, k, v) => setRooms(p => p.map(r => r.id === id ? { ...r, [k]: v } : r))

  /* Appliance helpers */
  const toggleApp  = (id) => setAppliances(p => p.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  const updateApp  = (id, k, v) => setAppliances(p => p.map(a => a.id === id ? { ...a, [k]: v } : a))

  /* Save to history */
  const saveToHistory = () => {
    const entry = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      name: homeName,
      rate,
      rooms,
      appliances: appliances.filter(a => a.enabled),
      results,
    }
    const prev = JSON.parse(localStorage.getItem('energyHistory') ?? '[]')
    localStorage.setItem('energyHistory', JSON.stringify([entry, ...prev]))
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Home Energy Estimator</h1>
          <p className="text-muted text-sm mt-1">Enter your home setup to calculate estimated energy consumption</p>
        </div>
        <button onClick={saveToHistory}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            flash
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-accent text-bg hover:bg-accent/80'
          }`}>
          {flash ? '✓ Saved to History!' : 'Save Estimate'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: form ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Profile */}
          <div className="bg-card border border-edge rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Home Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-muted text-xs block mb-1">Home Name</label>
                <input type="text" value={homeName} onChange={e => setHomeName(e.target.value)}
                  className="w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-muted text-xs block mb-1">
                  Electricity Rate (₹/kWh)
                  <span className="ml-1 text-muted/60">— avg India: ₹6–10</span>
                </label>
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
                { id: 'lighting',    label: '💡 Lighting'   },
                { id: 'appliances',  label: '🔌 Appliances' },
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
              {/* ── Lighting tab ── */}
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
                            className="text-muted hover:text-coral text-xs transition-colors px-1">✕</button>
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
                            <select value={room.type}
                              onChange={e => updateRoom(room.id, 'type', e.target.value)}
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

              {/* ── Appliances tab ── */}
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

        {/* ── Right: live results ── */}
        <div>
          <div className="bg-card border border-edge rounded-xl p-5 sticky top-6">
            <h2 className="text-white font-semibold mb-4">Estimate Summary</h2>

            {/* Hero number */}
            <div className="text-center py-5 border-b border-edge mb-4">
              <div className="text-muted text-xs uppercase tracking-widest mb-1">Monthly Consumption</div>
              <div className="text-5xl font-bold text-accent leading-none">{results.monthlyKwh.toFixed(1)}</div>
              <div className="text-muted text-sm mt-1">kWh / month</div>
            </div>

            {/* 4-stat grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Daily',          value: `${results.dailyKwh.toFixed(2)} kWh`,    color: 'text-white'      },
                { label: 'Monthly Cost',   value: `₹${results.monthlyCost.toFixed(0)}`,    color: 'text-gold'       },
                { label: 'Lighting/day',   value: `${(results.lightingWh/1000).toFixed(2)} kWh`, color: 'text-green-400'  },
                { label: 'Appliances/day', value: `${(results.appliancesWh/1000).toFixed(2)} kWh`, color: 'text-accent' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-bg rounded-lg p-3 border border-edge">
                  <div className="text-muted text-xs mb-0.5">{label}</div>
                  <div className={`text-sm font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Breakdown bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>💡 Lighting {results.lightingPct.toFixed(0)}%</span>
                <span>🔌 Appliances {results.appliancesPct.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-bg rounded-full overflow-hidden flex border border-edge">
                <div className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${results.lightingPct}%` }} />
                <div className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${results.appliancesPct}%` }} />
              </div>
            </div>

            {/* Active appliances breakdown */}
            {appliances.filter(a => a.enabled).length > 0 && (
              <div className="border-t border-edge pt-4">
                <div className="text-muted text-xs uppercase tracking-widest mb-2">Active Appliances</div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
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

            <button onClick={saveToHistory}
              className="w-full mt-4 py-2.5 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent/80 transition-colors">
              Save to History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
