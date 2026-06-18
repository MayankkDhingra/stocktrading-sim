import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, Activity, ArrowUpRight,
  ArrowDownRight, Eye, Star, Clock, Loader2, AlertCircle,
} from 'lucide-react'
import { portfolio, watchlist } from '@/lib/api'
import type { Portfolio } from '@/lib/api'
import { formatCurrency, formatCompact, formatPercent, cnColor } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts'

const COLORS = ['#00E5FF', '#8B5CF6', '#0088FF', '#FFD700', '#00FF88', '#FF4757', '#FF69B4', '#FF8C00']

function AnimatedNumber({ value, prefix = '', isCurrency = false }: { value: number; prefix?: string; isCurrency?: boolean }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const prev = prevRef.current
    const duration = 800
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(prev + (value - prev) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    prevRef.current = value
  }, [value])
  return <span>{prefix}{isCurrency ? formatCurrency(display) : display.toLocaleString()}</span>
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, isLoading, error, refetch } = useQuery<Portfolio>({
    queryKey: ['portfolio'],
    queryFn: () => portfolio.get(),
    refetchInterval: 30000,
  })

  const { data: wlData } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlist.list(),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Failed to load portfolio</p>
          <button onClick={() => refetch()} className="btn-glass">Retry</button>
        </div>
      </div>
    )
  }

  const portfolioValue = data.total_value
  const dailyPnl = data.daily_pnl
  const dailyPnlPct = data.daily_pnl_percent
  const isPositive = dailyPnl >= 0

  // Mock chart data if no history
  const chartData = data.holdings.length > 0
    ? Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: portfolioValue * (0.9 + Math.random() * 0.2 + (i / 30) * (portfolioValue > 100000 ? 0.05 : -0.02)),
      }))
    : Array.from({ length: 7 }, (_, i) => ({ date: `Day ${i+1}`, value: 100000 + Math.random() * 500 }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold overflow-guard">
            <span className="gradient-text-cyan">Portfolio</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.username}</p>
        </div>
        <Link to="/app/markets" className="btn-primary text-sm">
          Trade Now
        </Link>
      </div>

      {/* Portfolio Value Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden mb-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-purple-500/3" />
        <div className="relative z-10">
          <p className="text-sm text-gray-500 mb-2">Total Portfolio Value</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-display font-bold gradient-text-cyan break-all">
              <AnimatedNumber value={portfolioValue} isCurrency />
            </span>
            <span className={`flex items-center gap-1 text-base font-semibold whitespace-nowrap ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isPositive ? '+' : ''}{formatCurrency(dailyPnl)} ({formatPercent(dailyPnlPct)})
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Today's change</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cash Balance', value: data.balance, icon: DollarSign, isCurrency: true },
          { label: 'Total Invested', value: data.total_invested, icon: Activity, isCurrency: true },
          { label: 'Total P&L', value: data.total_pnl, icon: data.total_pnl >= 0 ? TrendingUp : TrendingDown, isCurrency: true, color: data.total_pnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Holdings', value: data.holdings.length, icon: PieChart, suffix: ' stocks' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5 card-premium"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
                <stat.icon size={16} className="text-cyan-400" />
              </div>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-xl font-display font-bold ${stat.color || 'text-white'}`}>
              {stat.isCurrency ? <AnimatedNumber value={stat.value} isCurrency /> : <AnimatedNumber value={stat.value} />}
              {stat.suffix && <span className="text-sm font-normal text-gray-500">{stat.suffix}</span>}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts + Allocation */}
      <div className="dashboard-grid mb-6">
        {/* Chart */}
        <div className="glass rounded-2xl p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Portfolio Growth</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                formatter={(v: number) => [formatCurrency(v), 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2} fill="url(#portGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
          {data.allocation && data.allocation.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie data={data.allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="sector">
                    {data.allocation.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {data.allocation.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400">{a.sector}</span>
                    </div>
                    <span className="font-mono text-gray-300">{a.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PieChart size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start trading to see allocation</p>
            </div>
          )}
        </div>
      </div>

      {/* Holdings + Watchlist */}
      <div className="dashboard-grid">
        {/* Holdings */}
        <div className="glass rounded-2xl p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Your Holdings</h3>
          {data.holdings.length > 0 ? (
            <div className="space-y-3">
              {data.holdings.map((h, i) => (
                <motion.div
                  key={h.stock_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/app/trade/${h.stock_id}`} className="flex items-center justify-between glass rounded-xl p-4 hover:border-cyan-500/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center font-display font-bold text-sm text-cyan-400">
                        {h.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-cyan-400 transition">{h.symbol}</p>
                        <p className="text-xs text-gray-500">{h.quantity} shares @ {formatCurrency(h.avg_price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{formatCurrency(h.current_value)}</p>
                      <p className={`text-xs font-mono ${cnColor(h.profit_loss_percent)}`}>
                        {formatPercent(h.profit_loss_percent)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-2">No holdings yet</p>
              <Link to="/app/markets" className="text-cyan-400 text-sm hover:underline">Start trading</Link>
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={16} className="text-cyan-400" />
            <h3 className="text-lg font-semibold">Watchlist</h3>
          </div>
          {wlData && wlData.length > 0 ? (
            <div className="space-y-2">
              {wlData.slice(0, 5).map((s: any, i: number) => (
                <Link key={i} to={`/app/trade/${s.stock_id || s.id}`} className="flex items-center justify-between glass rounded-xl p-3 hover:border-cyan-500/20 transition">
                  <div>
                    <p className="text-sm font-semibold">{s.symbol}</p>
                    <p className="text-xs text-gray-500">{s.name}</p>
                  </div>
                  <p className={`text-sm font-mono ${cnColor(s.change_percent || 0)}`}>
                    {formatCurrency(s.price || 0)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star size={30} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No watchlisted stocks</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
