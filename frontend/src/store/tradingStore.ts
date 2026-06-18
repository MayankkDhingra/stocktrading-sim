import { create } from 'zustand'

interface TradingState {
  selectedStock: number | null
  tradeModal: 'buy' | 'sell' | null
  quantity: number
  setSelectedStock: (id: number | null) => void
  openTradeModal: (mode: 'buy' | 'sell') => void
  closeTradeModal: () => void
  setQuantity: (q: number) => void
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedStock: null,
  tradeModal: null,
  quantity: 1,
  setSelectedStock: (id) => set({ selectedStock: id }),
  openTradeModal: (mode) => set({ tradeModal: mode }),
  closeTradeModal: () => set({ tradeModal: null, quantity: 1 }),
  setQuantity: (q) => set({ quantity: Math.max(1, q) }),
}))

interface UIState {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  accentColor: string
  toggleSidebar: () => void
  setTheme: (t: 'dark' | 'light') => void
  setAccentColor: (c: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  accentColor: localStorage.getItem('accent') || 'cyan',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (t) => { localStorage.setItem('theme', t); set({ theme: t }) },
  setAccentColor: (c) => { localStorage.setItem('accent', c); set({ accentColor: c }) },
}))
