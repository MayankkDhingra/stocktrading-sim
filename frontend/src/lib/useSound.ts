import { useCallback, useRef } from 'react'

type SoundType = 'buy' | 'sell' | 'achievement' | 'notification' | 'success'

const soundConfigs: Record<SoundType, { freq: number; endFreq: number; duration: number; gain: number }> = {
  buy: { freq: 660, endFreq: 880, duration: 0.35, gain: 0.08 },
  sell: { freq: 440, endFreq: 330, duration: 0.4, gain: 0.08 },
  achievement: { freq: 523, endFreq: 1047, duration: 0.6, gain: 0.1 },
  notification: { freq: 880, endFreq: 660, duration: 0.25, gain: 0.06 },
  success: { freq: 440, endFreq: 880, duration: 0.5, gain: 0.07 },
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((type: SoundType) => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const config = soundConfigs[type]
      const ctx = ctxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      gain.gain.setValueAtTime(config.gain, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration)
      osc.frequency.setValueAtTime(config.freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(config.endFreq, ctx.currentTime + config.duration * 0.7)
      osc.type = 'sine'
      osc.start()
      osc.stop(ctx.currentTime + config.duration)
    } catch { /* audio not available */ }
  }, [])

  const cleanup = useCallback(() => {
    ctxRef.current?.close()
    ctxRef.current = null
  }, [])

  return { play, cleanup }
}
