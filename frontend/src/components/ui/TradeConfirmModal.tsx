import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, TrendingUp, TrendingDown, X, Sparkles, DollarSign, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TradeConfirmModalProps {
  open: boolean
  onClose: () => void
  type: 'buy' | 'sell'
  symbol: string
  quantity: number
  price: number
  total: number
  balance: number
  profitLoss?: number
}

// ── Confetti Particle ────────────────────────────────────────────────────────
function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#00E5FF', '#8B5CF6', '#00FF88', '#FFD700', '#FF4757', '#0088FF', '#FF69B4']
  const color = colors[index % colors.length]
  const left = 5 + (index * 13) % 90
  const size = 5 + (index % 7)
  const duration = 1.8 + (index % 2)
  const delay = index * 0.04
  const shapes = ['rounded-sm', 'rounded-full']

  return (
    <motion.div
      className={`absolute ${shapes[index % 2]}`}
      style={{ left: `${left}%`, top: -10, width: size, height: size * (index % 2 === 0 ? 1 : 0.6), background: color }}
      initial={{ y: -30, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: '110vh', opacity: [1, 0.8, 0], rotate: 360 * (index % 3 + 2),
        scale: [1, 1.5, 0.8],
        x: [0, (index % 2 === 0 ? 50 : -50), (index % 2 === 0 ? -30 : 30)],
      }}
      transition={{ duration, delay, ease: [0.1, 0.4, 0.2, 1] }}
    />
  )
}

// ── Animated Ring Pulse ─────────────────────────────────────────────────────
function PulseRing({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{ borderColor: color }}
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 1.5, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

// ── TradeConfirmModal ────────────────────────────────────────────────────────
export default function TradeConfirmModal({
  open, onClose, type, symbol, quantity, price, total, balance, profitLoss,
}: TradeConfirmModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const isBuy = type === 'buy'

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [open])

  // Play sound on open
  useEffect(() => {
    if (!open) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.frequency.setValueAtTime(isBuy ? 660 : 440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(isBuy ? 880 : 330, ctx.currentTime + 0.3)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
      setTimeout(() => ctx.close(), 600)
    } catch { /* audio not supported */ }
  }, [open, isBuy])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Confetti Layer */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <ConfettiPiece key={i} index={i} />
              ))}
            </div>
          )}

          {/* Modal */}
          <motion.div
            className="relative glass rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl z-[1001]"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Close button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition z-10">
              <X size={18} />
            </button>

            {/* Success Icon */}
            <div className="relative flex justify-center mb-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <PulseRing color={isBuy ? '#00FF88' : '#FF4757'} delay={0} />
                <PulseRing color={isBuy ? '#00FF88' : '#FF4757'} delay={0.3} />
                <motion.div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isBuy ? 'bg-green-500/15 border border-green-500/30' : 'bg-red-500/15 border border-red-500/30'
                  }`}
                  initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                >
                  {isBuy ? (
                    <TrendingUp size={32} className="text-green-400" />
                  ) : (
                    <TrendingDown size={32} className="text-red-400" />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className={`text-2xl font-display font-bold mb-1 ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                {isBuy ? 'Purchase Confirmed!' : 'Sale Confirmed!'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isBuy ? 'Your order has been executed successfully' : 'Your shares have been sold successfully'}
              </p>
            </motion.div>

            {/* Trade Details */}
            <motion.div
              className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-xs font-bold ${
                    isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {symbol.slice(0, 3)}
                  </div>
                  <span className="font-bold text-sm">{symbol}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                  {type.toUpperCase()} {quantity} shares
                </span>
              </div>

              <div className="h-px bg-white/5" />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Price per share</span>
                  <p className="font-mono text-white">{formatCurrency(price)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Total {isBuy ? 'Cost' : 'Proceeds'}</span>
                  <p className={`font-mono font-bold ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(total)}
                  </p>
                </div>
                {profitLoss !== undefined && profitLoss !== 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs">Profit / Loss</span>
                    <p className={`font-mono font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <div className="h-px bg-white/5 my-1" />
                  <span className="text-gray-500 text-xs">Updated Balance</span>
                  <p className="font-mono font-bold text-lg text-cyan-400">{formatCurrency(balance)}</p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button onClick={onClose} className="btn-glass flex-1 text-sm py-2.5">
                Close
              </button>
              <button
                onClick={() => { onClose(); window.location.href = '/app/portfolio' }}
                className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <DollarSign size={14} />
                View Portfolio
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
