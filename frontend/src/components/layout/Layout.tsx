import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/tradingStore'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, PieChart, Clock, Trophy, Star, Settings,
  LogOut, Menu, X, Bell, Search, ChevronDown, Sun, Moon, TrendingDown,
} from 'lucide-react'

const mockNotifications = [
  { text: 'AAPL up 2.1% today', time: '5m ago', icon: TrendingUp, color: 'text-green-400' },
  { text: 'NVDA crossed $900 mark', time: '15m ago', icon: TrendingUp, color: 'text-green-400' },
  { text: 'Market opens in 15 mins', time: '30m ago', icon: Clock, color: 'text-cyan-400' },
  { text: 'Portfolio gained 1.2% this week', time: '1h ago', icon: TrendingUp, color: 'text-green-400' },
  { text: 'TSLA dropped 2.3%', time: '2h ago', icon: TrendingDown, color: 'text-red-400' },
]

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/markets', icon: TrendingUp, label: 'Markets' },
  { to: '/app/portfolio', icon: PieChart, label: 'Portfolio' },
  { to: '/app/transactions', icon: Clock, label: 'Transactions' },
  { to: '/app/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/app/achievements', icon: Star, label: 'Achievements' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }
  const closeSidebar = () => { if (isMobile) toggleSidebar() }

  return (
    <div className="min-h-screen bg-[#06080f] flex">
      {/* Ambient background */}
      <div className="ambient-bg" />

      {/* ── Mobile overlay ─────────────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50
        transition-transform duration-300 ease-out
        ${!isMobile && !sidebarOpen ? 'w-[72px]' : 'w-64'}
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        flex-shrink-0
      `}>
        <div className="h-full glass-deep flex flex-col border-r border-white/5">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.04] flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-white" />
            </div>
            {(sidebarOpen || isMobile) && (
              <span className="font-display font-bold text-lg gradient-text-cyan tracking-wider whitespace-nowrap">
                TRADEX
              </span>
            )}
            <button
              onClick={toggleSidebar}
              className="ml-auto text-gray-500 hover:text-white transition flex-shrink-0 hidden md:block"
            >
              <Menu size={18} />
            </button>
            {isMobile && (
              <button onClick={toggleSidebar} className="ml-auto text-gray-500 hover:text-white md:hidden">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={20} className="flex-shrink-0" />
                {(sidebarOpen || isMobile) && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="p-3 border-t border-white/5 flex-shrink-0">
            <div className={`flex items-center gap-3 ${!sidebarOpen && !isMobile ? 'justify-center' : 'px-2'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              {(sidebarOpen || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 font-mono">${(user?.balance ?? 0).toLocaleString()}</p>
                </div>
              )}
              {(!sidebarOpen && !isMobile) && (
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu toggle */}
            <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-400 hover:text-white">
              <Menu size={20} />
            </button>

            <div className="relative hidden sm:flex items-center">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                placeholder="Search stocks..."
                className="w-44 lg:w-56 bg-white/[0.03] border border-white/[0.08] rounded-xl py-2 pl-9 pr-16 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-600 font-mono pointer-events-none">
                ⌘K
              </kbd>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-gray-400 whitespace-nowrap">Market Open</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 glass rounded-xl border border-white/10 py-2 z-[60] shadow-2xl">
                    <div className="px-4 py-2 border-b border-white/[0.04]">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notifications</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {mockNotifications.map((n, i) => {
                        const Icon = n.icon
                        return (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition cursor-pointer">
                            <Icon size={14} className={`${n.color} mt-0.5 flex-shrink-0`} />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-300">{n.text}</p>
                              <p className="text-[10px] text-gray-600 mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition hidden sm:block"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/10 py-2 z-[60] shadow-2xl">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                      <p className="text-xs text-gray-500 font-mono">${(user?.balance ?? 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 flex-1 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
