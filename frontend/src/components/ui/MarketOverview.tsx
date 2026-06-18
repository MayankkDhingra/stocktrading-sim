import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Flame, Newspaper, ArrowRight } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Mover {
  symbol: string; name: string; price: number; change_percent: number;
}

interface NewsItem {
  title: string; source: string; time: string; sentiment: 'positive' | 'negative' | 'neutral';
}

interface MarketOverviewData {
  gainers: Mover[]
  losers: Mover[]
  news: NewsItem[]
}

interface MarketOverviewProps {
  data: MarketOverviewData
  className?: string
}

// ── Ticker Scroller ──────────────────────────────────────────────────────────
function TickerScroller({ items, type }: { items: Mover[]; type: 'gainers' | 'losers' }) {
  return (
    <div className="overflow-hidden whitespace-nowrap relative">
      <div className="flex gap-6 animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs">
            <span className="font-display font-bold text-white">{item.symbol}</span>
            <span className={type === 'gainers' ? 'text-green-400' : 'text-red-400'}>
              {type === 'gainers' ? '+' : ''}{formatPercent(item.change_percent)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const sentimentColor = item.sentiment === 'positive' ? 'border-l-green-400' : item.sentiment === 'negative' ? 'border-l-red-400' : 'border-l-gray-600'
  return (
    <motion.a
      href="#"
      className={`block p-3 rounded-xl glass border-l-2 ${sentimentColor} hover:bg-white/[0.02] transition card-premium`}
      initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <p className="text-sm text-gray-300 line-clamp-2 mb-1.5">{item.title}</p>
      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        <span className="font-mono">{item.source}</span>
        <span>·</span>
        <span>{item.time}</span>
      </div>
    </motion.a>
  )
}

// ── MarketOverview ───────────────────────────────────────────────────────────
export default function MarketOverview({ data, className = '' }: MarketOverviewProps) {
  const topGainer = data.gainers[0]
  const topLoser = data.losers[0]

  return (
    <div className={`grid lg:grid-cols-3 gap-4 mb-6 ${className}`}>
      {/* Top Gainer Card */}
      <motion.div
        className="glass rounded-2xl p-5 card-premium relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Top Gainer</span>
          </div>
          {topGainer ? (
            <>
              <p className="font-display font-bold text-lg">{topGainer.symbol}</p>
              <p className="text-xs text-gray-500 truncate mb-2">{topGainer.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-green-400 text-xl">
                  {formatCurrency(topGainer.price)}
                </span>
                <span className="text-green-400 font-mono text-sm">+{formatPercent(topGainer.change_percent)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">No data</p>
          )}
        </div>
      </motion.div>

      {/* Top Loser Card */}
      <motion.div
        className="glass rounded-2xl p-5 card-premium relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Top Loser</span>
          </div>
          {topLoser ? (
            <>
              <p className="font-display font-bold text-lg">{topLoser.symbol}</p>
              <p className="text-xs text-gray-500 truncate mb-2">{topLoser.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-red-400 text-xl">
                  {formatCurrency(topLoser.price)}
                </span>
                <span className="text-red-400 font-mono text-sm">{formatPercent(topLoser.change_percent)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">No data</p>
          )}
        </div>
      </motion.div>

      {/* News Feed */}
      <motion.div
        className="glass rounded-2xl p-5 card-premium relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Newspaper size={14} className="text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Market News</span>
          </div>
          <ArrowRight size={14} className="text-gray-600" />
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {data.news.length > 0 ? (
            data.news.slice(0, 4).map((item, i) => (
              <NewsCard key={i} item={item} index={i} />
            ))
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">No recent news</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
