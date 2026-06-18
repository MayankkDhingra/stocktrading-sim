import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReAreaTooltip, ResponsiveContainer as RC2,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Briefcase, Wallet, DollarSign,
  AlertCircle, Sparkles, PieChart as PieIcon, ArrowUp, ArrowDown,
  BarChart3, ArrowRight, ShoppingCart, Minus,
} from 'lucide-react'
import { portfolio, type Portfolio, type Holding } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useTradingStore } from '@/store/tradingStore'
import { formatCurrency, formatPercent, formatCompact, cnColor } from '@/lib/utils'

// ── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, isCurrency = false, prefix = '', suffix = '' }: {
  value: number; isCurrency?: boolean; prefix?: string; suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1200; const steps = 60
    const increment = value / steps
    let step = 0; let current = 0
    const timer = setInterval(() => {
      step++; current += increment
      if (step >= steps) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.round(current * 100) / 100)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  const formatted = isCurrency ? formatCurrency(display) : prefix ? `${prefix}${display.toFixed(2)}` : display.toLocaleString()
  return <span className="font-display font-bold">{formatted}{suffix}</span>
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-8">
        <div className="skeleton h-4 w-32 mb-3" />
        <div className="skeleton h-10 w-64 mb-2" />
        <div className="skeleton h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="skeleton h-3 w-16 mb-3" />
            <div className="skeleton h-6 w-20 mb-2" />
            <div className="skeleton h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6"><div className="skeleton h-5 w-40 mb-4" /><div className="skeleton h-72 w-full rounded-xl" /></div>
      <div className="glass rounded-2xl p-6"><div className="skeleton h-5 w-32 mb-4" /><div className="skeleton h-10 w-full mb-2" /><div className="skeleton h-10 w-full mb-2" /><div className="skeleton h-10 w-full" /></div>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyPortfolio() {
  const navigate = useNavigate()
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Briefcase size={36} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Holdings Yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Your portfolio is empty. Start trading to build your investment portfolio and track your performance.
      </p>
      <button onClick={() => navigate('/app/markets')} className="btn-primary inline-flex items-center gap-2 text-sm">
        Explore Markets <ArrowRight size={16} />
      </button>
    </motion.div>
  )
}

// ── Pie Colors ──────────────────────────────────────────────────────────────
const PIE_COLORS = ['#00E5FF', '#8B5CF6', '#00FF88', '#FFD700', '#FF4757', '#0088FF', '#FF6B9D', '#36D399']

// ── Performance chart generator ─────────────────────────────────────────────
function generatePerformanceData(totalValue: number): { date: string; value: number }[] {
  const data: { date: string; value: number }[] = []
  let value = totalValue * 0.75
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.42) * 0.025 * value
    value = Math.max(value + change, totalValue * 0.5)
    const d = new Date()
    d.setDate(d.getDate() - (30 - i))
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
    })
  }
  return data
}

// ── PortfolioPage ───────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openTradeModal, setQuantity } = useTradingStore()

  const {
    data: portfolioData,
    isLoading,
    error,
  } = useQuery<Portfolio>({
    queryKey: ['portfolio'],
    queryFn: () => portfolio.get(),
    refetchOnMount: true,
  })

  const [perfData] = useState(() => generatePerformanceData(portfolioData?.total_value || 100000))

  // ── Error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div className="glass rounded-2xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Failed to load portfolio</h3>
        <p className="text-gray-500 text-sm">{(error as Error)?.message || 'Something went wrong'}</p>
      </motion.div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) return <PortfolioSkeleton />

  // ── Empty ─────────────────────────────────────────────────────────
  if (!portfolioData || !portfolioData.holdings || portfolioData.holdings.length === 0) {
    return <EmptyPortfolio />
  }

  const { holdings, total_value, total_invested, total_pnl, total_pnl_percent, daily_pnl, daily_pnl_percent, balance, allocation } = portfolioData

  // Pie chart data from holdings
  const pieData = holdings.map(h => ({ name: h.symbol, value: h.current_value }))

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* ── Hero: Portfolio Value ──────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-cyan-400" />
            <span className="text-sm text-gray-500 uppercase tracking-wider font-mono">Portfolio Value</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold gradient-text-cyan">
              <AnimatedNumber value={total_value} isCurrency />
            </h2>
            <motion.div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-mono font-bold ${
                total_pnl >= 0
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
            >
              {total_pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatCurrency(Math.abs(total_pnl))}
              <span className="ml-1">({formatPercent(total_pnl_percent)})</span>
            </motion.div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${total_pnl_percent >= 0
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500'
                  : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(total_pnl_percent) * 3, 100)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className={cnColor(total_pnl_percent) + ' font-mono text-sm font-bold'}>
              {formatPercent(total_pnl_percent)} all time
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Wallet, label: 'Cash Balance', value: balance, isCurrency: true, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { icon: DollarSign, label: 'Total Invested', value: total_invested, isCurrency: true, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: BarChart3, label: "Today's P&L", value: daily_pnl, isCurrency: true, color: daily_pnl >= 0 ? 'text-green-400' : 'text-red-400', bg: daily_pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20', suffix: ` (${formatPercent(daily_pnl_percent)})` },
        ].map(({ icon: Icon, label, value, isCurrency, color, bg, suffix }, i) => (
          <motion.div
            key={label}
            className={`glass rounded-2xl p-5 border ${bg} card-premium`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-2xl font-display font-bold ${color}`}>
              <AnimatedNumber value={value} isCurrency={isCurrency} suffix={suffix} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div
          className="lg:col-span-2 glass rounded-2xl p-6 card-premium"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-display text-sm text-gray-400 uppercase tracking-wider mb-4">
            Performance Over Time
          </h3>
          <RC2 width="100%" height={260}>
            <AreaChart data={perfData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${formatCompact(v)}`} domain={['auto', 'auto']} />
              <ReAreaTooltip
                contentStyle={{ background: 'rgba(15, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(20px)', color: '#e8eaed', fontSize: '13px' }}
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="url(#perfGrad)" strokeWidth={2} fill="url(#perfGrad)" dot={false} activeDot={{ r: 5, fill: '#00E5FF', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </RC2>
        </motion.div>

        {/* Asset Allocation Pie */}
        <motion.div
          className="glass rounded-2xl p-6 card-premium"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="font-display text-sm text-gray-400 uppercase tracking-wider mb-4">
            Asset Allocation
          </h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                  paddingAngle={3} strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(20px)', color: '#e8eaed', fontSize: '13px' }}
                  formatter={(v: number) => [formatCurrency(v), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="font-mono text-gray-400">{((item.value / total_value) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Holdings Table ───────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl overflow-hidden card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-display text-sm text-gray-400 uppercase tracking-wider">
            Holdings ({holdings.length})
          </h3>
          <button
            onClick={() => navigate('/app/markets')}
            className="btn-glass text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <ShoppingCart size={12} /> Buy More
          </button>
        </div>

        {/* Table Header - hidden on mobile */}
        <div className="hidden md:grid grid-cols-7 gap-3 px-5 py-3 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5 font-mono">
          <span>Symbol</span>
          <span>Qty</span>
          <span>Avg Price</span>
          <span>Price</span>
          <span>Value</span>
          <span>P&L</span>
          <span className="text-right">Action</span>
        </div>

        {/* Holdings Rows */}
        <div className="divide-y divide-white/5">
          {holdings.map((holding: Holding, i: number) => {
            const isPositive = holding.profit_loss >= 0
            return (
              <motion.div
                key={holding.id}
                className="group"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-7 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition cursor-pointer"
                  onClick={() => navigate(`/app/trade/${holding.stock_id}`)}
                >
                  <div>
                    <p className="font-display font-bold text-sm">{holding.symbol}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{holding.name}</p>
                  </div>
                  <span className="font-mono text-sm">{holding.quantity}</span>
                  <span className="font-mono text-sm text-gray-400">{formatCurrency(holding.avg_price)}</span>
                  <span className="font-mono text-sm">{formatCurrency(holding.current_price)}</span>
                  <span className="font-mono text-sm font-bold">{formatCurrency(holding.current_value)}</span>
                  <div>
                    <p className={cnColor(holding.profit_loss) + ' font-mono text-sm font-bold'}>
                      {formatCurrency(holding.profit_loss)}
                    </p>
                    <p className={cnColor(holding.profit_loss_percent) + ' font-mono text-xs'}>
                      ({formatPercent(holding.profit_loss_percent)})
                    </p>
                  </div>
                  <div className="text-right">
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/trade/${holding.stock_id}`) }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-mono hover:bg-red-500/20 transition"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      Sell
                    </motion.button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden p-4 hover:bg-white/[0.02] transition cursor-pointer"
                  onClick={() => navigate(`/app/trade/${holding.stock_id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-display font-bold">{holding.symbol}</p>
                      <p className="text-xs text-gray-500">{holding.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={cnColor(holding.profit_loss) + ' font-mono font-bold text-sm'}>
                        {formatCurrency(holding.profit_loss)}
                      </p>
                      <p className={cnColor(holding.profit_loss_percent) + ' font-mono text-xs'}>
                        ({formatPercent(holding.profit_loss_percent)})
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-mono mb-3">
                    <span>Qty: {holding.quantity}</span>
                    <span>Avg: {formatCurrency(holding.avg_price)}</span>
                    <span>Value: {formatCurrency(holding.current_value)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/trade/${holding.stock_id}`) }}
                      className="flex-1 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition"
                    >
                      Trade
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/trade/${holding.stock_id}`) }}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-mono hover:bg-red-500/20 transition"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
