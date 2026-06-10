import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const navItems = [
  { label: 'Dashboard', path: '/', icon: '▦' },
  { label: 'Produksi', path: '/produksi', icon: '⬡' },
  { label: 'Stok Freezer', path: '/stok-freezer', icon: '❄' },
  { label: 'Koperasi', path: '/koperasi', icon: '⌂' },
  { label: 'Pengiriman', path: '/pengiriman', icon: '⇄' },
  { label: 'Laporan Laba', path: '/laporan-laba', icon: '▤' },
  { label: 'HPP & Harga', path: '/hpp-harga', icon: '◎' },
  { label: 'Manajemen User', path: '/manajemen-user', icon: '◉', adminOnly: true },
  { label: 'POS Coffee', path: '/pos', icon: '☕' },
]

const Sidebar = () => {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <aside className="w-52 min-h-screen bg-[#14141f] flex flex-col py-4 px-3 shrink-0">
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-amber-400 text-sm font-medium">Dashboard Brew & Stirr</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') return null
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-amber-400/15 text-amber-400'
                    : 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/8'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors mt-4"
      >
        ⎋ Logout
      </button>
    </aside>
  )
}

export default Sidebar