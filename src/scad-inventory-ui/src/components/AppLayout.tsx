import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', marker: '01' },
  { to: '/products', label: 'Products', marker: '02' },
  { to: '/inventory', label: 'Inventory', marker: '03' },
  { to: '/transfers/new', label: 'Transfers', marker: '04' },
  { to: '/warehouses', label: 'Warehouses', marker: '05' },
]

export function AppLayout() {
  const { session, signOut } = useAuth()
  const [navigationOpen, setNavigationOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <NavLink className="brand" to="/dashboard" onClick={() => setNavigationOpen(false)}>
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SCAD Inventory</span>
        </NavLink>
        <button
          className="menu-button"
          type="button"
          aria-controls="primary-navigation"
          aria-expanded={navigationOpen}
          onClick={() => setNavigationOpen((open) => !open)}
        >
          <span className="visually-hidden">Toggle navigation</span>
          <span aria-hidden="true">{navigationOpen ? '×' : '☰'}</span>
        </button>
      </header>

      {navigationOpen && (
        <button
          className="navigation-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavigationOpen(false)}
        />
      )}

      <aside className={`sidebar${navigationOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <NavLink className="brand" to="/dashboard" onClick={() => setNavigationOpen(false)}>
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>
              SCAD Inventory
              <small>Operations console</small>
            </span>
          </NavLink>
        </div>

        <nav id="primary-navigation" className="primary-navigation" aria-label="Primary navigation">
          <span className="nav-section-label">Workspace</span>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
              to={item.to}
              onClick={() => setNavigationOpen(false)}
            >
              <span className="nav-marker" aria-hidden="true">{item.marker}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="warehouse-context">
            <span className="warehouse-badge">{session?.user.warehouseCode}</span>
            <div>
              <strong>{session?.user.warehouseCode} workspace</strong>
              <span>{session?.user.username}</span>
            </div>
          </div>
          <button className="sign-out-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
