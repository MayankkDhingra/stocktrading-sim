import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Shield, BarChart3, Users, Trophy, Zap, Globe, ArrowRight,
  DollarSign, Activity, PieChart, Star, ChevronDown, Check, Sparkles,
} from 'lucide-react'
import GSAPReveal from '@/components/ui/GSAPReveal'
import TiltCard from '@/components/ui/TiltCard'
import MagneticButton from '@/components/ui/MagneticButton'

const stats = [
  { value: 245000, suffix: '+', label: 'Active Traders' },
  { value: 1200000, suffix: '+', label: 'Total Trades' },
  { value: 500000000, prefix: '$', label: 'Virtual Money Invested' },
  { value: 500, suffix: '+', label: 'Stocks Available' },
]

const features = [
  { icon: TrendingUp, title: 'Virtual Trading', desc: 'Trade US & Indian stocks with virtual money. Real-time prices, instant execution, no risk.' },
  { icon: PieChart, title: 'Portfolio Tracking', desc: 'Track your holdings with beautiful charts. Real-time P&L, asset allocation, and performance metrics.' },
  { icon: BarChart3, title: 'Stock Analytics', desc: 'Advanced charts with multiple timeframes. Candlestick patterns, moving averages, and volume analysis.' },
  { icon: Globe, title: 'Market Simulation', desc: 'Experience realistic market conditions with price movements, volatility, and sector rotations.' },
  { icon: Trophy, title: 'Leaderboards', desc: 'Compete with traders globally. Rise through the ranks from Bronze to Diamond tier.' },
  { icon: Star, title: 'Achievements', desc: 'Unlock badges and XP as you master trading. Track your journey from novice to pro trader.' },
]

const testimonials = [
  { name: 'Alex Chen', role: 'College Student', text: 'TradeX helped me understand the stock market before investing real money. The interface is incredible!' },
  { name: 'Priya Sharma', role: 'Software Engineer', text: 'Best trading simulator I\'ve used. The analytics and real-time charts are better than my actual brokerage app.' },
  { name: 'Marcus Johnson', role: 'Finance Student', text: 'I learned more about trading in 2 weeks on TradeX than in 2 semesters of finance classes.' },
]

const faqs = [
  { q: 'Is TradeX completely free?', a: 'Yes! TradeX is 100% free. You get $100,000 in virtual money to practice trading with zero risk.' },
  { q: 'Are the stock prices real?', a: 'Stock prices are simulated based on real market data patterns with realistic volatility and price movements.' },
  { q: 'Can I trade Indian stocks?', a: 'Yes! TradeX includes both US stocks (AAPL, TSLA, NVDA) and Indian stocks (RELIANCE, TCS, INFY).' },
  { q: 'How is the leaderboard calculated?', a: 'Leaders are ranked by portfolio growth percentage. The more profitable your trades, the higher you rank!' },
]

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <span ref={ref} className="font-display font-bold">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [typedText, setTypedText] = useState('')
  const tickerRef = useRef<HTMLDivElement>(null)

  // Typing animation
  useEffect(() => {
    const text = 'Practice Trading Like a Pro'
    let i = 0
    const timer = setInterval(() => {
      if (i <= text.length) { setTypedText(text.slice(0, i)); i++ }
      else clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [])

  // Floating ticker
  const tickerSymbols = ['AAPL +2.4%', 'NVDA +5.1%', 'TSLA -1.2%', 'MSFT +0.8%', 'GOOGL +1.6%', 'META +3.2%', 'RELIANCE +0.5%', 'TCS +1.8%', 'INFY -0.3%', 'AMZN +1.1%']

  return (
    <div className="min-h-screen bg-[#06080f] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="ambient-bg" />

      {/* Floating orbs */}
      <FloatingOrb className="w-96 h-96 bg-purple-600 top-20 -left-20" delay={0} />
      <FloatingOrb className="w-80 h-80 bg-cyan-400 top-60 right-0" delay={2} />
      <FloatingOrb className="w-64 h-64 bg-blue-600 bottom-20 left-1/3" delay={4} />

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text-cyan tracking-wider">TRADEX</span>
          </div>

          {/* Center nav */}
          <div className="hidden md:flex items-center justify-center gap-8 text-sm text-gray-400 flex-1">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#testimonials" className="hover:text-white transition-colors duration-200">Testimonials</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm !py-2 !px-5">
              Get Started <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-cyan-400 mb-6">
                  <Sparkles size={14} />
                  <span>#1 Virtual Trading Platform</span>
                </div>

                <h1 className="hero-title mb-6 overflow-guard">
                  <span className="gradient-text-cyan">{typedText}</span>
                  <span className="animate-pulse text-cyan-400">|</span>
                </h1>

                <p className="text-lg text-gray-400 mb-8 max-w-lg">
                  Trade with virtual money, build your portfolio, and master the stock market risk-free.
                  The most beautiful trading simulator ever built.
                </p>

                <div className="flex flex-wrap gap-4">
                  <MagneticButton>
                    <Link to="/signup" className="btn-primary text-lg inline-flex items-center group">
                      Start Trading
                      <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </MagneticButton>
                  <MagneticButton>
                    <a href="#features" className="btn-glass text-lg">
                      Explore Features
                    </a>
                  </MagneticButton>
                </div>
              </motion.div>
            </div>

            {/* Right - Animated Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="glass rounded-2xl p-6 animate-pulse-glow">
                {/* Mock Chart */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold">S&P 500</p>
                    <p className="text-green-400 font-mono text-sm">+1.24%</p>
                  </div>
                  <div className="flex gap-2">
                    {['1D', '1W', '1M', '6M', '1Y'].map((tf) => (
                      <button key={tf} className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        tf === '1D' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white'
                      }`}>{tf}</button>
                    ))}
                  </div>
                </div>

                {/* SVG Chart */}
                <svg viewBox="0 0 500 200" className="w-full h-48">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,150 L50,140 L100,120 L150,130 L200,80 L250,90 L300,50 L350,60 L400,30 L450,40 L500,20"
                    fill="none"
                    stroke="url(#chartGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dasharray" from="0,520" to="520,0" dur="2s" fill="freeze" />
                  </path>
                  <path
                    d="M0,150 L50,140 L100,120 L150,130 L200,80 L250,90 L300,50 L350,60 L400,30 L450,40 L500,20 L500,200 L0,200 Z"
                    fill="url(#chartGrad)"
                    opacity="0.3"
                  >
                    <animate attributeName="opacity" from="0" to="0.3" dur="2s" fill="freeze" />
                  </path>
                </svg>
              </div>

              {/* Floating cards */}
              <motion.div
                className="absolute -top-6 -right-6 glass rounded-xl p-4"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <p className="text-sm">NVDA <span className="text-green-400">+5.1%</span></p>
                </div>
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 glass rounded-xl p-4"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-cyan-400" />
                  <p className="text-sm font-mono">$100K Virtual Balance</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <TiltCard key={i} className="glass rounded-xl p-5 text-center card-premium" tiltAmount={4}>
                <p className="text-3xl md:text-4xl font-bold gradient-text-cyan mb-1">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </TiltCard>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} className="text-gray-600" />
        </motion.div>
      </section>

      {/* Ticker Strip */}
      <div className="border-y border-white/5 py-3 overflow-hidden bg-white/[0.02]">
        <div className="flex gap-12 animate-marquee whitespace-nowrap" ref={tickerRef}>
          {[...tickerSymbols, ...tickerSymbols].map((s, i) => (
            <span key={i} className={`font-mono text-sm ${s.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <GSAPReveal className="text-center mb-16">
          <h2 className="section-title mb-4 overflow-guard">
            Everything You <span className="gradient-text-cyan">Need</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Professional-grade tools packaged in the most beautiful trading interface you've ever seen.
          </p>
        </GSAPReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <GSAPReveal key={i} delay={i * 0.1}>
              <TiltCard className="glass rounded-2xl p-6 card-premium group" tiltAmount={5}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-500/40 transition-all">
                  <Icon size={22} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </TiltCard>
            </GSAPReveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <GSAPReveal className="text-center mb-16">
            <h2 className="section-title overflow-guard">
              Loved by <span className="gradient-text-cyan">Traders</span>
            </h2>
          </GSAPReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <GSAPReveal key={i} delay={i * 0.15}>
                <TiltCard className="glass rounded-2xl p-6 card-premium" tiltAmount={4}>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </TiltCard>
              </GSAPReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
        <GSAPReveal className="text-center mb-16">
          <h2 className="section-title overflow-guard">
            Frequently <span className="gradient-text-cyan">Asked</span>
          </h2>
        </GSAPReveal>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <GSAPReveal key={i} delay={i * 0.1}>
              <div className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition"
                >
                  <span className="font-medium pr-8">{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-500 transition-transform flex-shrink-0 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GSAPReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <GSAPReveal className="max-w-4xl mx-auto px-6 text-center">
          <TiltCard className="glass rounded-3xl p-12 md:p-16 relative overflow-hidden" tiltAmount={3}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
            <div className="relative z-10">
              <h2 className="section-title mb-6 overflow-guard">
                Ready to <span className="gradient-text-cyan">Start Trading</span>?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                Join 245,000+ traders practicing with virtual money. No risk, all reward.
              </p>
              <MagneticButton>
                <Link to="/signup" className="btn-primary text-lg inline-flex items-center gap-2 group">
                  Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
            </div>
          </TiltCard>
        </GSAPReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg gradient-text-cyan">TRADEX</span>
              </div>
              <p className="text-sm text-gray-500">The most beautiful stock trading simulator. Practice, learn, compete.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Markets', 'Leaderboard', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-white transition">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 text-center text-sm text-gray-600">
            &copy; 2026 TradeX. All rights reserved. Built with love for traders.
          </div>
        </div>
      </footer>
    </div>
  )
}
