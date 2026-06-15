import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area,
} from 'recharts'
import KPICard from '../components/KPICard'
import { calculate, generateHourlyProfile, generateSavingsTips } from '../utils/calculate'

const PALETTE = ['#58A6FF', '#3FB950', '#F78166', '#D2A8FF', '#E3B341', '#79C0FF', '#56D364']
const TIP = { backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: 8, color: '#E6EDF3', fontSize: 12 }

function WelcomeScreen() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl mb-6">⚡</div>
        <h1 className="text-3xl font-bold text-white mb-3">Smart Home Energy Hub</h1>
        <p className="text-muted text-base mb-8 leading-relaxed">
          Enter your home details — lights, appliances, usage hours — and instantly see your
          personalized energy dashboard with cost estimates and saving tips.
        </p>
        <button
          onClick={() => navigate('/estimator')}
          className="px-8 py-3 bg-accent text-bg rounded-xl font-semibold text-base hover:bg-accent/80 transition-colors"
        >
          Set Up My Home →
        </button>
        <p className="text-muted text-xs mt-4">No account needed · All data stays on your device</p>
      </div>
    </div>
  )
}

function RateSimulator({ baseResults, rooms, appliances }) {
  const [rate, setRate] = useState(baseResults.rate ?? 8)
  const sim = { ...baseResults, monthlyCost: +(baseResults.monthlyKwh * rate).toFixed(0) }

  return (
    <div className="bg-card border border-edge rounded-xl p-6">
      <h3 className="text-white font-semibold mb-1">Rate What-If</h3>
      <p className="text-muted text-xs mb-4">Change your electricity rate to see cost impact</p>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>₹1/kWh</span>
        <span className="text-accent font-semibold text-sm">₹{rate}/kWh</span>
        <span>₹20/kWh</span>
      </div>
      <input type="range" min="1" max="20" step="0.5" value={rate}
        onChange={e => setRate(Number(e.target.value))}
        className="w-full mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg border border-edge rounded-lg p-3 text-center">
          <div className="text-muted text-xs mb-1">Monthly Cost</div>
          <div className="text-2xl font-bold text-gold">₹{sim.monthlyCost}</div>
        </div>
        <div className="bg-bg border border-edge rounded-lg p-3 text-center">
          <div className="text-muted text-xs mb-1">Annual Cost</div>
          <div className="text-2xl font-bold text-gold">₹{(sim.monthlyCost * 12).toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted text-center">
        {baseResults.monthlyKwh.toFixed(1)} kWh/month × ₹{rate} = ₹{sim.monthlyCost}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [homeData, setHomeData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('currentHome')
    if (saved) setHomeData(JSON.parse(saved))
  }, [])

  if (!homeData) return <WelcomeScreen />

  const results = calculate(homeData.rooms, homeData.appliances, homeData.rate)
  const hourly  = generateHourlyProfile(results.appBreakdown, results.lightingWh)
  const tips    = generateSavingsTips(results, homeData.rooms)

  const tickStyle = { fill: '#8B949E', fontSize: 11 }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{homeData.name}</h1>
          <p className="text-muted text-sm mt-0.5">
            Electricity rate: ₹{homeData.rate}/kWh · {homeData.rooms?.length} rooms ·{' '}
            {homeData.appliances?.filter(a => a.enabled).length} appliances active
          </p>
        </div>
        <button
          onClick={() => navigate('/estimator')}
          className="px-4 py-2 bg-surface border border-edge text-muted rounded-lg text-sm hover:text-white hover:border-accent transition-colors"
        >
          Edit Home
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Daily Consumption" value={results.dailyKwh.toFixed(2)} unit="kWh" color="text-accent" />
        <KPICard label="Monthly Consumption" value={results.monthlyKwh.toFixed(1)} unit="kWh" color="text-green-400" />
        <KPICard label="Monthly Cost" value={`₹${results.monthlyCost.toLocaleString()}`} sub={`₹${(results.monthlyCost * 12).toLocaleString()} / year`} color="text-gold" />
        <KPICard label="Top Consumer" value={results.biggestConsumer} sub={`${results.biggestConsumerKwh.toFixed(2)} kWh/day`} color="text-coral" />
      </div>

      {/* Category + Appliance breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Consumption by Category</h2>
          {results.categories.length === 0 ? (
            <div className="text-muted text-sm text-center py-10">No appliances added yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={results.categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis type="number" stroke="#30363D" tick={tickStyle} unit=" kWh" />
                <YAxis type="category" dataKey="name" stroke="#30363D" tick={tickStyle} width={90} />
                <Tooltip contentStyle={TIP} formatter={v => [`${v} kWh/day`, 'Daily']} />
                <Bar dataKey="dailyKwh" radius={[0, 4, 4, 0]}>
                  {results.categories.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Top Appliances by Usage</h2>
          {results.appBreakdown.length === 0 ? (
            <div className="text-muted text-sm text-center py-10">No appliances added yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={results.appBreakdown.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis type="number" stroke="#30363D" tick={tickStyle} unit=" kWh" />
                <YAxis type="category" dataKey="name" stroke="#30363D" tick={tickStyle} width={110}
                  tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v} />
                <Tooltip contentStyle={TIP} formatter={v => [`${v} kWh/day`, 'Daily']} />
                <Bar dataKey="dailyKwh" radius={[0, 4, 4, 0]}>
                  {results.appBreakdown.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 15}, 70%, ${65 - i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Hourly profile + Room lighting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1">Estimated Hourly Usage</h2>
          <p className="text-muted text-xs mb-4">Based on typical device schedules</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#58A6FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#58A6FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="hour" stroke="#30363D" tick={tickStyle} tickFormatter={v => `${v}h`} interval={3} />
              <YAxis stroke="#30363D" tick={tickStyle} unit=" kWh" width={52} />
              <Tooltip contentStyle={TIP} formatter={v => [`${v} kWh`, 'Usage']} labelFormatter={l => `${l}:00 – ${l + 1}:00`} />
              <Area type="monotone" dataKey="energy" stroke="#58A6FF" strokeWidth={2}
                fill="url(#areaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1">Lighting by Room</h2>
          <p className="text-muted text-xs mb-4">Daily kWh per room</p>
          {results.roomBreakdown.length === 0 ? (
            <div className="text-muted text-sm text-center py-10">No rooms added yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={results.roomBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="name" stroke="#30363D" tick={tickStyle}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 9) + '…' : v} />
                <YAxis stroke="#30363D" tick={tickStyle} unit=" kWh" width={52} />
                <Tooltip contentStyle={TIP} formatter={v => [`${v} kWh/day`, 'Lighting']} />
                <Bar dataKey="dailyKwh" radius={[4, 4, 0, 0]}>
                  {results.roomBreakdown.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lighting vs Appliances donut-style bar + monthly cost by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Monthly Cost by Category (₹)</h2>
          {results.categories.length === 0 ? (
            <div className="text-muted text-sm text-center py-10">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={results.categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="name" stroke="#30363D" tick={tickStyle}
                  tickFormatter={v => v.length > 10 ? v.slice(0,9)+'…' : v} />
                <YAxis stroke="#30363D" tick={tickStyle} unit=" ₹" width={60} />
                <Tooltip contentStyle={TIP} formatter={v => [`₹${v}`, 'Monthly Cost']} />
                <Bar dataKey="monthlyCost" radius={[4, 4, 0, 0]}>
                  {results.categories.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <RateSimulator baseResults={{ ...results, rate: homeData.rate }} />
      </div>

      {/* Savings Tips + Breakdown summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Energy Saving Tips</h2>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-3 p-3 bg-bg border border-edge rounded-lg">
                <span className="text-xl shrink-0">{tip.icon}</span>
                <div>
                  <div className="text-white text-sm font-medium">{tip.title}</div>
                  <div className="text-muted text-xs mt-0.5 leading-relaxed">{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Consumption Split</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">💡 Lighting</span>
              <span className="text-green-400 font-semibold">{results.lightingPct}%</span>
            </div>
            <div className="h-3 bg-bg rounded-full overflow-hidden border border-edge mb-3">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${results.lightingPct}%` }} />
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">🔌 Appliances</span>
              <span className="text-accent font-semibold">{results.appliancesPct}%</span>
            </div>
            <div className="h-3 bg-bg rounded-full overflow-hidden border border-edge">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${results.appliancesPct}%` }} />
            </div>
          </div>
          <div className="space-y-2 mt-4 border-t border-edge pt-4">
            {[
              { label: 'Lighting (daily)', value: `${(results.lightingWh/1000).toFixed(2)} kWh`, color: 'text-green-400' },
              { label: 'Appliances (daily)', value: `${(results.appliancesWh/1000).toFixed(2)} kWh`, color: 'text-accent' },
              { label: 'Total (daily)', value: `${results.dailyKwh.toFixed(2)} kWh`, color: 'text-white' },
              { label: 'Total (monthly)', value: `${results.monthlyKwh.toFixed(1)} kWh`, color: 'text-white' },
              { label: 'Est. Monthly Bill', value: `₹${results.monthlyCost.toLocaleString()}`, color: 'text-gold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm border-b border-edge pb-1.5 last:border-0 last:pb-0">
                <span className="text-muted">{label}</span>
                <span className={`${color} font-medium`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
