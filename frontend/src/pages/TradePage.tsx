import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Heart, Minus, Plus, ArrowLeft,
  Sparkles, Coins, BarChart3, Activity, Building2, DollarSign,
  Percent, Loader2, Info, Newspaper, ChevronDown, ExternalLink,
} from 'lucide-react'
import { stocks, trading, watchlist as watchlistApi, type Stock } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useTradingStore } from '@/store/tradingStore'
import { formatCurrency, formatPercent, formatCompact, cnColor } from '@/lib/utils'
import TradeConfirmModal from '@/components/ui/TradeConfirmModal'
import MagneticButton from '@/components/ui/MagneticButton'

const timeframes = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
] as const

// ── AnimatedNumber (fixed - no infinite loop) ────────────────────────────────
function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const prev = prevValue.current
    if (prev === value) { setDisplay(value); return }
    prevValue.current = value

    const duration = 600
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = prev + (value - prev) * eased
      setDisplay(current)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value])

  return (
    <span className="font-display font-bold">
      {isCurrency ? formatCurrency(display) : display.toLocaleString(undefined, { maximumFractionDigits: 2 })}
    </span>
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────────
function TradeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="skeleton h-8 w-24" />
        <div className="skeleton h-5 w-32" />
      </div>
      <div className="glass rounded-2xl p-6">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-8 w-14 rounded-lg" />)}
        </div>
        <div className="skeleton h-80 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-3 w-16 mb-2" /><div className="skeleton h-6 w-20" /></div>
        ))}
      </div>
    </div>
  )
}

// ── TradePage ───────────────────────────────────────────────────────────────
export default function TradePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, updateBalance } = useAuthStore()
  const { quantity, setQuantity } = useTradingStore()

  const [timeframe, setTimeframe] = useState<number>(30)
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'news'>('overview')
  const [tradeResult, setTradeResult] = useState<{
    type: 'buy' | 'sell'; quantity: number; price: number; total: number;
  } | null>(null)

  const stockId = Number(id)

  // ── Fetch Stock ───────────────────────────────────────────────────────
  const { data: stock, isLoading, error } = useQuery<Stock>({
    queryKey: ['stock', stockId],
    queryFn: () => stocks.get(stockId),
    enabled: !isNaN(stockId),
    staleTime: 10000,
  })

  // ── Fetch Watchlist (compute inWatchlist from data, NOT via setState) ──
  const { data: wlData } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
    enabled: !isNaN(stockId),
    staleTime: 30000,
  })

  // Compute isWatchlisted from data — NO setState in render
  const isWatchlisted = useMemo(() => {
    if (!wlData) return false
    return wlData.some((w: any) => w.stock_id === stockId || w.id === stockId)
  }, [wlData, stockId])

  // ── Price history chart data ──────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!stock?.price_history || stock.price_history.length === 0) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeframe)
    let filtered = stock.price_history.filter(p => new Date(p.date) >= cutoff)
    if (filtered.length < 2) filtered = stock.price_history.slice(-Math.max(timeframe, 10))
    return filtered.map(p => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: p.price,
    }))
  }, [stock?.price_history, timeframe])

  // ── Trade Mutation ────────────────────────────────────────────────────
  const tradeMutation = useMutation({
    mutationFn: async (data: { stock_id: number; quantity: number }) => {
      const res = tradeMode === 'buy' ? await trading.buy(data) : await trading.sell(data)
      return res
    },
    onSuccess: (data: any) => {
      if (data.balance !== undefined) updateBalance(data.balance)
      queryClient.invalidateQueries({ queryKey: ['stock', stockId] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      setQuantity(1)
    },
  })

  // ── Watchlist Mutation ────────────────────────────────────────────────
  const watchlistAdd = useMutation({
    mutationFn: () => watchlistApi.add(stockId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })
  const watchlistRemove = useMutation({
    mutationFn: () => watchlistApi.remove(stockId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  // ── Computed ──────────────────────────────────────────────────────────
  const currentPrice = stock?.price || 0
  const estimatedCost = quantity * currentPrice
  const currentBalance = user?.balance || 0
  const updatedBalance = tradeMode === 'buy' ? currentBalance - estimatedCost : currentBalance + estimatedCost
  const canTrade = quantity > 0 && (tradeMode === 'sell' || estimatedCost <= currentBalance)
  const isPositive = (stock?.change ?? 0) >= 0

  // ── Handlers (no useCallback needed - these are simple) ───────────────
  const handleConfirm = () => {
    if (!canTrade || !stock) return
    setTradeResult({ type: tradeMode, quantity, price: currentPrice, total: estimatedCost })
    setShowConfirm(true)
    tradeMutation.mutate({ stock_id: stockId, quantity })
    setTimeout(() => { setShowConfirm(false); setTradeResult(null) }, 2500)
  }

  const toggleWatchlist = () => {
    if (isWatchlisted) watchlistRemove.mutate()
    else watchlistAdd.mutate()
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error || isNaN(stockId)) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Info size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Stock Not Found</h2>
        <p className="text-gray-400 mb-6">{isNaN(stockId) ? 'Invalid stock ID' : 'Could not load stock data'}</p>
        <button onClick={() => navigate('/app/markets')} className="btn-glass inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Back to Markets
        </button>
      </div>
    )
  }

  if (isLoading) return <TradeSkeleton />
  if (!stock) return null

  // ── Info cards data ──────────────────────────────────────────────────
  const infoCards = [
    { icon: Building2, label: 'Market Cap', value: formatCompact(stock.market_cap) },
    { icon: Percent, label: 'P/E Ratio', value: stock.pe_ratio ? stock.pe_ratio.toFixed(2) : 'N/A' },
    { icon: BarChart3, label: 'Volume', value: formatCompact(stock.volume) },
    { icon: DollarSign, label: 'Div Yield', value: stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A' },
    { icon: Activity, label: 'Sector', value: stock.sector || 'N/A' },
  ]

  // ── Mock news ────────────────────────────────────────────────────────
  const mockNews = [
    { title: `${stock.name} beats Q4 earnings estimates, revenue up 12% YoY`, time: '2 hours ago', source: 'Reuters' },
    { title: `Analyst upgrades ${stock.symbol} to "Strong Buy" with raised price target`, time: '5 hours ago', source: 'Bloomberg' },
    { title: `${stock.symbol} announces new product line expansion for 2026`, time: '1 day ago', source: 'CNBC' },
    { title: `Market watch: ${stock.sector} sector shows strong momentum`, time: '2 days ago', source: 'WSJ' },
  ]

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app/markets')} className="p-2 rounded-xl glass text-gray-400 hover:text-white transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{stock.symbol}</h1>
            <span className="text-sm text-gray-400 truncate">{stock.name}</span>
            {stock.sector && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500">
                {stock.sector}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleWatchlist}
          className={`p-2 rounded-xl transition ${isWatchlisted ? 'text-red-400 bg-red-500/10' : 'text-gray-500 hover:text-red-400'}`}
        >
          <Heart size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Price Bar ───────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold">{formatCurrency(currentPrice)}</span>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-mono font-bold ${isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.change_percent)})
          </span>
        </div>
      </div>

      {/* ── Main Layout: Chart + Trade Panel ────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 flex-wrap">
              {timeframes.map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => setTimeframe(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    timeframe === days ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#00FF88' : '#FF4757'} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={isPositive ? '#00FF88' : '#FF4757'} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v: number) => `$${formatCompact(v)}`} />
                <Tooltip contentStyle={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} formatter={(v: number) => [formatCurrency(v), 'Price']} />
                <Area type="monotone" dataKey="price" stroke={isPositive ? '#00FF88' : '#FF4757'} strokeWidth={2} fill="url(#tradeGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-600 text-sm">No price history</div>
          )}
        </div>

        {/* Buy/Sell Panel */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm text-gray-400 mb-4 font-medium">Trade {stock.symbol}</h3>

          {/* Toggle */}
          <div className="flex rounded-xl bg-white/[0.03] p-1 mb-4">
            {(['buy', 'sell'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setTradeMode(mode); setQuantity(1) }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition ${
                  tradeMode === mode
                    ? mode === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    : 'text-gray-500 hover:text-white'
                }`}
              >{mode}</button>
            ))}
          </div>

          {/* Quantity */}
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Quantity</label>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-lg glass text-gray-400 hover:text-white flex items-center justify-center"><Minus size={14} /></button>
            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500/30" />
            <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-lg glass text-gray-400 hover:text-white flex items-center justify-center"><Plus size={14} /></button>
          </div>

          {/* Summary */}
          <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-mono">{formatCurrency(currentPrice)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{tradeMode === 'buy' ? 'Cost' : 'Proceeds'}</span><span className={`font-mono font-bold ${tradeMode === 'buy' ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(estimatedCost)}</span></div>
            <div className="border-t border-white/[0.04] pt-2 flex justify-between"><span className="text-gray-500">Balance</span><span className="font-mono">{formatCurrency(currentBalance)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">After</span><span className={`font-mono font-bold ${updatedBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(updatedBalance)}</span></div>
          </div>

          {tradeMode === 'buy' && estimatedCost > currentBalance && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] mb-3">
              <Info size={12} /> Insufficient balance
            </div>
          )}

          <MagneticButton
            onClick={handleConfirm}
            disabled={!canTrade || tradeMutation.isPending}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider ${
              tradeMode === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {tradeMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : `${tradeMode} ${stock.symbol}`}
          </MagneticButton>
        </div>
      </div>

      {/* ── Info Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {infoCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs: Overview / News ────────────────────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/[0.04]">
          {(['overview', 'news'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition capitalize ${
                activeTab === tab ? 'text-white border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >{tab}</button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'overview' ? (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Company</span><span>{stock.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Symbol</span><span className="font-mono">{stock.symbol}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sector</span><span>{stock.sector || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Market Cap</span><span className="font-mono">{formatCompact(stock.market_cap)}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">P/E Ratio</span><span className="font-mono">{stock.pe_ratio?.toFixed(2) || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Volume</span><span className="font-mono">{formatCompact(stock.volume)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Div Yield</span><span className="font-mono">{stock.dividend_yield ? `${stock.dividend_yield}%` : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-mono font-bold">{formatCurrency(currentPrice)}</span></div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mockNews.map((n, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition cursor-pointer">
                  <Newspaper size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 line-clamp-2">{n.title}</p>
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                      <span>{n.source}</span><span>·</span><span>{n.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Trade Confirm Modal ──────────────────────────────────────── */}
      <TradeConfirmModal
        open={showConfirm}
        onClose={() => { setShowConfirm(false); setTradeResult(null) }}
        type={tradeResult?.type || 'buy'}
        symbol={stock.symbol}
        quantity={tradeResult?.quantity || 0}
        price={tradeResult?.price || 0}
        total={tradeResult?.total || 0}
        balance={user?.balance || 0}
      />
    </motion.div>
  )
}
