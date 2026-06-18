import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star, Trophy, Lock, CheckCircle2, AlertCircle, Sparkles, Zap, Target,
  TrendingUp, Flame, Award, Shield, Gem, Crown, Loader2,
} from 'lucide-react'
import { achievements, type Achievement } from '@/lib/api'

// ── Icon map for achievements ───────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  star: Star,
  trophy: Trophy,
  target: Target,
  trending_up: TrendingUp,
  flame: Flame,
  award: Award,
  shield: Shield,
  gem: Gem,
  crown: Crown,
  zap: Zap,
  sparkles: Sparkles,
}

function getAchievementIcon(iconName: string) {
  const Icon = iconMap[iconName] || Star
  return Icon
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function AchievementsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-4 w-full rounded-full mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-3 w-32 mb-3" />
            <div className="skeleton h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyAchievements() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Award size={36} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Achievements Yet</h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        Start trading to unlock achievements and earn XP.
      </p>
    </motion.div>
  )
}

// ── Achievement Card ────────────────────────────────────────────────────────
function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const isUnlocked = achievement.unlocked
  const Icon = getAchievementIcon(achievement.icon)

  return (
    <motion.div
      className={`glass rounded-2xl p-5 card-premium relative overflow-hidden group ${
        isUnlocked
          ? 'border-cyan-500/20 hover:border-cyan-500/40'
          : 'opacity-60 hover:opacity-80'
      }`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={isUnlocked ? { y: -4 } : {}}
    >
      {/* Unlocked glow */}
      {isUnlocked && (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <motion.div
            className="absolute top-2 right-2"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: index * 0.05 + 0.2 }}
          >
            <CheckCircle2 size={18} className="text-cyan-400" />
          </motion.div>
        </>
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute top-2 right-2">
          <Lock size={16} className="text-gray-600" />
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
        isUnlocked
          ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
          : 'bg-white/5 border border-white/5'
      }`}>
        <Icon
          size={22}
          className={isUnlocked ? 'text-cyan-400' : 'text-gray-600'}
        />
      </div>

      {/* Name + Description */}
      <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
        {achievement.name}
      </h4>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {achievement.description}
      </p>

      {/* XP Badge + Unlock Date */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
          isUnlocked
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            : 'bg-white/5 text-gray-600 border border-white/5'
        }`}>
          <Sparkles size={10} />
          {achievement.xp} XP
        </span>

        {isUnlocked && achievement.unlocked_at && (
          <span className="text-[10px] text-gray-500 font-mono">
            {new Date(achievement.unlocked_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── AchievementsPage ────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const queryClient = useQueryClient()

  const {
    data: achievementList,
    isLoading,
    error,
  } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => achievements.list(),
    refetchOnMount: true,
  })

  const checkMutation = useMutation({
    mutationFn: () => achievements.check(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
    },
  })

  const unlocked = achievementList?.filter(a => a.unlocked).length || 0
  const total = achievementList?.length || 0
  const totalXP = achievementList?.reduce((sum, a) => sum + (a.unlocked ? a.xp : 0), 0) || 0
  const level = Math.floor(totalXP / 100) + 1
  const xpProgress = (totalXP % 100)

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl mb-2">
              <span className="gradient-text-cyan">Achievements</span>
            </h1>
            <p className="text-gray-500 text-sm">Earn XP and unlock rewards</p>
          </div>
          <motion.button
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
            className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            {checkMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Checking...</>
            ) : (
              <><Trophy size={14} /> Check Achievements</>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Error State ────────────────────────────────────────────────── */}
      {error && (
        <motion.div className="glass rounded-2xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Failed to load achievements</h3>
          <p className="text-gray-500 text-sm">{(error as Error)?.message || 'Something went wrong'}</p>
        </motion.div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {isLoading && <AchievementsSkeleton />}

      {/* ── Empty ──────────────────────────────────────────────────────── */}
      {!isLoading && !error && (!achievementList || achievementList.length === 0) && (
        <EmptyAchievements />
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {!isLoading && !error && achievementList && achievementList.length > 0 && (
        <>
          {/* ── XP Progress Bar ─────────────────────────────────────── */}
          <motion.div
            className="glass rounded-2xl p-6 card-premium relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Level + XP */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Crown size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">Level {level}</p>
                    <p className="text-xs text-gray-500">{totalXP} XP total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-cyan-400">{unlocked}/{total}</p>
                  <p className="text-xs text-gray-500">Unlocked</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-[length:200%_100%]"
                    style={{ backgroundSize: '200% 100%', animation: 'gradientShift 2s ease infinite' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
                {/* Tick marks */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-600 font-mono">0</span>
                  <span className="text-[10px] text-gray-600 font-mono">25</span>
                  <span className="text-[10px] text-gray-600 font-mono">50</span>
                  <span className="text-[10px] text-gray-600 font-mono">75</span>
                  <span className="text-[10px] text-gray-600 font-mono">100</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-mono">
                {100 - xpProgress} XP to Level {level + 1}
              </p>
            </div>
          </motion.div>

          {/* ── Achievement Grid ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievementList.map((achievement, i) => (
              <AchievementCard key={achievement.id} achievement={achievement} index={i} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
