import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = {
  teacher: [
    { key: 'overview', label: 'Ringkasan Aktivitas', icon: '📊', path: '/teacher' },
  ],
  student: [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
  ],
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || '?'
}

export default function AppShell({ role, active, title, subtitle, actions, children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = NAV_ITEMS[role] || []

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">RT</div>
          <div className="sidebar-brand-text">
            <div className="name">RunTracker</div>
            <div className="sub">Sport Performance</div>
          </div>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <nav className="sidebar-nav">
          {items.map(item => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${active === item.key ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials(profile?.full_name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name || 'Pengguna'}</div>
              <div className="sidebar-user-role">{role === 'teacher' ? 'Guru' : (profile?.class_name || 'Siswa')}</div>
            </div>
          </div>
          <button className="sidebar-signout" onClick={signOut}>Keluar dari akun</button>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Buka menu">☰</button>
            <div className="topbar-title">
              <h1 className="text-h1">{title}</h1>
              {subtitle && <p className="text-small">{subtitle}</p>}
            </div>
          </div>
          <div className="topbar-actions">{actions}</div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
