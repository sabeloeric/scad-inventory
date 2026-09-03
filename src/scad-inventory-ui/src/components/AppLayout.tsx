import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppLayout() {
  const { session, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <NavLink className="brand" to="/products">SCAD Inventory</NavLink>
          <span className="warehouse-badge">{session?.user.warehouseCode}</span>
        </div>
        <div className="user-actions">
          <span>{session?.user.username}</span>
          <button className="button button-secondary button-small" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
