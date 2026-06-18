import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, TrendingUp, TrendingDown, Star, Loader2, AlertCircle, Filter, ArrowUpDown } from 'lucide-react'
import { stocks } from '@/lib/api'
import type { Stock } from '@/lib/api'
import { formatCurrency, formatCompact, formatPercent, cnColor } from '@/lib/utils'
import MarketOverview from '@/components/ui/MarketOverview'
import TiltCard from '@/components/ui/TiltCard'

const SECTORS = ['All', 'Technology', 'Finance', 'Energy', 'Healthcare', 'Consumer', 'Industrial', 'Other']
const SORT_OPTIONS = [
  { value: 'change_percent', label: 'Change %' },
  { value: 'price', label: 'Price' },
  { value: 'volume', label: 'Volume' },
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'symbol', label: 'Symbol' },
]

function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="skeleton h-36 rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 50}`).join(' ')
  return (
    <svg viewBox="0 0 100 50" className="w-20 h-10">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Markets() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')
  const [sort, setSort] = useState('change_percent')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, error, refetch } = useQuery<Stock[]>({
    queryKey: ['stocks', search, sector, sort],
    queryFn: () => stocks.list({
      search: search || undefined,
      sort: sortDir === 'desc' ? `-${sort}` : sort,
      sector: sector !== 'All' ? sector : undefined,
    }),
    refetchInterval: 15000,
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          <span className="gradient-text-cyan">Markets</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Real-time stock prices and market data</p>
      </div>

      {/* Market Overview Widget */}
      <MarketOverview data={{
        gainers: data?.filter(s => s.change_percent > 0).sort((a, b) => b.change_percent - a.change_percent).slice(0, 5).map(s => ({ symbol: s.symbol, name: s.name, price: s.price, change_percent: s.change_percent })) || [],
        losers: data?.filter(s => s.change_percent < 0).sort((a, b) => a.change_percent - b.change_percent).slice(0, 5).map(s => ({ symbol: s.symbol, name: s.name, price: s.price, change_percent: s.change_percent })) || [],
        news: [
          { title: 'Fed signals potential rate cut as inflation cools below target', source: 'Bloomberg', time: '2h ago', sentiment: 'positive' as const },
          { title: 'NVIDIA unveils next-gen AI chip architecture at GTC keynote', source: 'Reuters', time: '4h ago', sentiment: 'positive' as const },
          { title: 'Oil prices dip as OPEC+ signals production increase next quarter', source: 'CNBC', time: '5h ago', sentiment: 'negative' as const },
          { title: 'Tech sector rally continues as earnings beat expectations', source: 'WSJ', time: '6h ago', sentiment: 'positive' as const },
        ],
      }} />

      {/* Search + Filters */}
      <div className="glass rounded-2xl p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol or name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>

        {/* Sector Filter */}
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sector === s
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3">
          <ArrowUpDown size={14} className="text-gray-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            {sortDir === 'desc' ? '↓ High to Low' : '↑ Low to High'}
          </button>
        </div>
      </div>

      {/* Stock Grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Failed to load stocks</p>
          <button onClick={() => refetch()} className="btn-glass">Retry</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((stock, i) => {
            const isPositive = stock.change_percent >= 0
            const mockSpark = Array.from({ length: 12 }, () => stock.price * (0.9 + Math.random() * 0.2))

            return (
              <motion.div
                key={stock.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/app/trade/${stock.id}`}
                  className={`block glass rounded-xl p-5 card-premium group relative overflow-hidden ${
                    isPositive ? 'hover:border-green-500/20' : 'hover:border-red-500/20'
                  }`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isPositive ? 'bg-gradient-to-br from-green-500/3 to-transparent' : 'bg-gradient-to-br from-red-500/3 to-transparent'
                  }`} />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                          isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-white transition">{stock.symbol}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{stock.name}</p>
                        </div>
                      </div>
                      <MiniChart data={mockSpark} color={isPositive ? '#00FF88' : '#FF4757'} />
                    </div>

                    {/* Price + Change */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xl font-display font-bold">{formatCurrency(stock.price)}</p>
                        <div className={`flex items-center gap-1 text-sm font-mono ${cnColor(stock.change_percent)}`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span>{formatCurrency(stock.change)}</span>
                          <span>({formatPercent(stock.change_percent)})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Vol</p>
                        <p className="text-xs font-mono text-gray-400">{formatCompact(stock.volume)}</p>
                      </div>
                    </div>

                    {/* Sector badge */}
                    {stock.sector && (
                      <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-500">
                        {stock.sector}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {data?.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <Search size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No stocks found matching your search</p>
        </div>
      )}
    </motion.div>
  )
}
