export default function KPICard({ label, value, unit, sub, color = 'text-accent' }) {
  return (
    <div className="bg-card border border-edge rounded-xl p-5">
      <div className="text-muted text-xs uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-3xl font-bold ${color} leading-none`}>
        {value}
        {unit && <span className="text-sm font-normal text-muted ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-muted text-xs mt-1.5">{sub}</div>}
    </div>
  )
}
