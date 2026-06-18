import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Moon, Sun, Palette, Shield, User, Mail, Calendar,
  AlertTriangle, CheckCircle2, ChevronRight, Info, Eye, EyeOff,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/tradingStore'

const accentColors = [
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-400', ring: 'ring-cyan-400' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500', ring: 'ring-purple-400' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-400', ring: 'ring-blue-400' },
  { value: 'green', label: 'Green', class: 'bg-green-400', ring: 'ring-green-400' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-400', ring: 'ring-orange-400' },
] as const

// ── SettingsPage ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuthStore()
  const { theme, setTheme, accentColor, setAccentColor } = useUIStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Unknown'

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings size={24} className="text-cyan-400" />
          <h1 className="font-display font-bold text-2xl">
            <span className="gradient-text-cyan">Settings</span>
          </h1>
        </div>
        <p className="text-gray-500 text-sm">Customize your trading experience</p>
      </motion.div>

      {/* ── Profile Section ────────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-6 card-premium relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-2xl font-display font-bold text-white shadow-lg shadow-purple-500/20">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-[#06080f] flex items-center justify-center"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <CheckCircle2 size={12} className="text-white" />
            </motion.div>
          </div>

          <div>
            <h2 className="text-xl font-display font-bold">{user?.username || 'Trader'}</h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
              <Mail size={12} />
              <span>{user?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Calendar size={11} />
              <span>Joined {joinedDate}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Theme Toggle ───────────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-5 card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              {theme === 'dark'
                ? <Moon size={18} className="text-cyan-400" />
                : <Sun size={18} className="text-amber-400" />
              }
            </div>
            <div>
              <p className="font-bold text-sm">Theme</p>
              <p className="text-xs text-gray-500">Switch between dark and light mode</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-cyan-500/20 border border-cyan-500/30'
                : 'bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <motion.div
              className={`absolute top-1 w-5 h-5 rounded-full shadow-md ${
                theme === 'dark'
                  ? 'left-1 bg-cyan-400'
                  : 'left-8 bg-amber-400'
              }`}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* ── Accent Color Picker ────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-5 card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Palette size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Accent Color</p>
            <p className="text-xs text-gray-500">Choose your interface accent</p>
          </div>
        </div>

        <div className="flex gap-3">
          {accentColors.map(({ value, label, class: bg, ring }) => (
            <motion.button
              key={value}
              onClick={() => setAccentColor(value)}
              className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center transition-all ${
                accentColor === value
                  ? `ring-2 ring-offset-2 ring-offset-[#0A0F1F] ${ring} scale-110`
                  : 'opacity-60 hover:opacity-100'
              }`}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              title={label}
            >
              {accentColor === value && <CheckCircle2 size={16} className="text-white drop-shadow" />}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Account Info ───────────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl overflow-hidden card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Info size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Account Information</p>
            <p className="text-xs text-gray-500">Your account details</p>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {[
            { label: 'User ID', value: `#${user?.id || '—'}` },
            { label: 'Username', value: user?.username || '—' },
            { label: 'Email', value: user?.email || '—' },
            { label: 'Balance', value: user?.balance ? `$${user.balance.toLocaleString()}` : '—' },
            { label: 'Account Type', value: 'Standard' },
            { label: 'Status', value: 'Active', color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-400">{label}</span>
              <span className={`text-sm font-mono ${color || 'text-white'}`}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Security ───────────────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl overflow-hidden card-premium"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Security</p>
            <p className="text-xs text-gray-500">Manage your account security</p>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {[
            { label: 'Password', value: '••••••••••' },
            { label: '2FA', value: 'Disabled', color: 'text-gray-500' },
            { label: 'Sessions', value: '1 Active', color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition cursor-pointer">
              <span className="text-sm text-gray-400">{label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${color || 'text-white'}`}>{value}</span>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Danger Zone ────────────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl overflow-hidden border-red-500/10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="p-5 border-b border-red-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-red-400">Danger Zone</p>
            <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
          </div>
        </div>

        <div className="p-5">
          {showDeleteConfirm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm text-gray-400 mb-4">
                Are you absolutely sure? This action cannot be undone. All your portfolio data,
                transaction history, and achievements will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-glass text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition"
                  onClick={() => {
                    // No real delete - just a visual
                    setShowDeleteConfirm(false)
                  }}
                >
                  Yes, Delete My Account
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition inline-flex items-center gap-2"
            >
              <AlertTriangle size={14} />
              Delete Account
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
