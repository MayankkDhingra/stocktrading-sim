import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Medal, TrendingUp, AlertCircle, Crown, Star, Sparkles,
  BarChart3, ArrowUp,
} from 'lucide-react'
import { leaderboard, type LeaderboardEntry } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatPercent, formatCompact } from '@/lib/utils'

// ── Skeleton ────────────────────────────────────────────────────────────────
function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 text-center">
            <div className="skeleton h-10 w-10 rounded-full mx-auto mb-3" />
            <div className="skeleton h-4 w-20 mx-auto mb-2" />
            <div className="skeleton h-6 w-28 mx-auto mb-1" />
            <div className="skeleton h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6">
        <div className="skeleton h-5 w-24 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyLeaderboard() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Trophy size={36} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Rankings Yet</h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        Leaderboard data will appear once users start trading and building their portfolios.
      </p>
    </motion.div>
  )
}

// ── Podium Entry ────────────────────────────────────────────────────────────
function PodiumEntry({ entry, position, delay }: {
  entry: LeaderboardEntry; position: 1 | 2 | 3; delay: number
}) {
  const config = {
    1: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', gradient: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/20', label: 'Gold' },
    2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-400/10 border-gray-400/30', gradient: 'from-gray-300 to-gray-400', glow: 'shadow-gray-400/10', label: 'Silver' },
    3: { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10 border-amber-600/30', gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-600/10', label: 'Bronze' },
  }[position]

  const Icon = config.icon
  const heights = { 1: 'h-40', 2: 'h-32', 3: 'h-28' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 100 }}
      className="flex flex-col items-center"
    >
      {/* Avatar / Icon */}
      <motion.div
        className={`w-16 h-16 rounded-full ${config.bg} border flex items-center justify-center mb-3 relative`}
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      >
        <div className={`absolute -top-3 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          <span className="text-xs font-mono font-bold text-white">{position}</span>
        </div>
        {entry.avatar_url ? (
          <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-xl font-display font-bold text-white">
            {entry.username?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </motion.div>

      {/* Name */}
      <p className="font-bold text-sm mb-1 truncate max-w-[120px]">{entry.username}</p>
      <p className="font-mono text-xs text-gray-500 mb-2">Rank #{position}</p>

      {/* Stats */}
      <div className={`glass rounded-2xl p-4 text-center w-full ${config.border} border ${config.glow}`}>
        <p className={`text-lg font-display font-bold ${config.color}`}>
          {formatCurrency(entry.portfolio_value)}
        </p>
        <p className={`text-xs font-mono ${entry.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatPercent(entry.total_pnl_percent)}
        </p>
        <p className="text-gray-600 text-[10px] font-mono mt-1">
          {entry.total_trades} trades
        </p>
      </div>

      {/* Podium Block */}
      <div className={`w-full ${heights[position]} rounded-t-xl bg-gradient-to-b ${config.gradient} opacity-20 mt-2`} />
    </motion.div>
  )
}

// ── Rank Badge ──────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={18} className="text-yellow-400" />
  if (rank === 2) return <Medal size={18} className="text-gray-300" />
  if (rank === 3) return <Medal size={18} className="text-amber-600" />
  return <span className="font-mono text-sm text-gray-400 w-[18px] text-center">#{rank}</span>
}

// ── Leaderboard Page ────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const { user } = useAuthStore()

  const {
    data: entries,
    isLoading,
    error,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboard.get(),
    refetchOnMount: true,
  })

  const podium = entries?.slice(0, 3) || []
  const rest = entries?.slice(3) || []
  const currentUserId = user?.id

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={24} className="text-yellow-400" />
          <h1 className="font-display font-bold text-2xl">
            <span className="gradient-text-cyan">Leaderboard</span>
          </h1>
        </div>
        <p className="text-gray-500 text-sm">See who's dominating the markets</p>
      </motion.div>

      {/* ── Error State ────────────────────────────────────────────────── */}
      {error && (
        <motion.div className="glass rounded-2xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Failed to load leaderboard</h3>
          <p className="text-gray-500 text-sm">{(error as Error)?.message || 'Something went wrong'}</p>
        </motion.div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {isLoading && <LeaderboardSkeleton />}

      {/* ── Empty ──────────────────────────────────────────────────────── */}
      {!isLoading && !error && (!entries || entries.length === 0) && <EmptyLeaderboard />}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {!isLoading && !error && entries && entries.length > 0 && (
        <>
          {/* ── Podium Top 3 ───────────────────────────────────────── */}
          <motion.div
            className="glass rounded-3xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Ambient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Podium layout */}
            <div className="grid grid-cols-3 gap-6 items-end max-w-xl mx-auto">
              {/* Silver (2nd) */}
              {podium[1] ? (
                <PodiumEntry entry={podium[1]} position={2} delay={0.2} />
              ) : <div />}

              {/* Gold (1st) */}
              {podium[0] ? (
                <PodiumEntry entry={podium[0]} position={1} delay={0.1} />
              ) : <div />}

              {/* Bronze (3rd) */}
              {podium[2] ? (
                <PodiumEntry entry={podium[2]} position={3} delay={0.3} />
              ) : <div />}
            </div>
          </motion.div>

          {/* ── Full Ranking Table ─────────────────────────────────── */}
          <motion.div
            className="glass rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className="font-display text-sm text-gray-400 uppercase tracking-wider">
                Full Rankings ({entries.length})
              </h3>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-mono border-b border-white/5">
              <span className="col-span-1">Rank</span>
              <span className="col-span-3">Trader</span>
              <span className="col-span-3 text-right">Value</span>
              <span className="col-span-3 text-right">P&L</span>
              <span className="col-span-2 text-right">Trades</span>
            </div>

            {/* All entries */}
            <div className="divide-y divide-white/5">
              {entries.map((entry, i) => {
                const isCurrentUser = entry.user_id === currentUserId
                return (
                  <motion.div
                    key={entry.user_id || i}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-3.5 items-center transition ${
                      isCurrentUser
                        ? 'bg-cyan-500/5 border-l-2 border-l-cyan-400'
                        : 'hover:bg-white/[0.02]'
                    }`}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {/* Rank */}
                    <div className="md:col-span-1 flex items-center gap-2">
                      <RankBadge rank={entry.rank} />
                      {isCurrentUser && <ArrowUp size={12} className="text-cyan-400" />}
                    </div>

                    {/* Trader */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        entry.rank <= 3
                          ? `bg-gradient-to-br ${
                              entry.rank === 1 ? 'from-yellow-400 to-amber-500'
                              : entry.rank === 2 ? 'from-gray-400 to-gray-500'
                              : 'from-amber-500 to-orange-600'
                            }`
                          : 'bg-white/5'
                      }`}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          : entry.username?.[0]?.toUpperCase() || '?'
                        }
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono">YOU</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="md:col-span-3 text-right">
                      <span className="font-mono font-bold text-sm">{formatCurrency(entry.portfolio_value)}</span>
                    </div>

                    {/* P&L */}
                    <div className="md:col-span-3 text-right">
                      <span className={`font-mono font-bold text-sm ${entry.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(entry.total_pnl_percent)}
                      </span>
                    </div>

                    {/* Trades */}
                    <div className="md:col-span-2 text-right">
                      <span className="font-mono text-sm text-gray-400">{entry.total_trades}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
