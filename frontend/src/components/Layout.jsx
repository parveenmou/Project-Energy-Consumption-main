import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/',          label: 'Dashboard',       icon: '📊' },
  { to: '/estimator', label: 'Home Estimator',  icon: '🏠' },
  { to: '/history',   label: 'History',         icon: '📋' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-edge flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-edge">
          <div className="text-accent font-bold text-lg tracking-tight">⚡ Energy Hub</div>
          <div className="text-muted text-xs mt-0.5">Smart Home Dashboard</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted hover:bg-surface hover:text-white'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-edge text-muted text-xs space-y-0.5">
          <div>React + Vite + FastAPI</div>
          <div>RandomForest ML Model</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
