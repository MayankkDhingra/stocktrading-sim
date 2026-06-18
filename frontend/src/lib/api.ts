import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export interface User {
  id: number; username: string; email: string; avatar_url?: string; balance: number; created_at: string;
}
export interface Stock {
  id: number; symbol: string; name: string; price: number; change: number; change_percent: number;
  volume: number; market_cap: number; pe_ratio?: number; dividend_yield?: number; sector?: string;
  price_history?: { date: string; price: number }[];
}
export interface Holding {
  id: number; stock_id: number; symbol: string; name: string; quantity: number; avg_price: number;
  current_price: number; current_value: number; profit_loss: number; profit_loss_percent: number;
}
export interface Portfolio {
  holdings: Holding[]; total_value: number; total_invested: number; daily_pnl: number;
  daily_pnl_percent: number; total_pnl: number; total_pnl_percent: number; balance: number;
  allocation: { sector: string; value: number; percent: number }[];
}
export interface Transaction {
  id: number; type: 'buy' | 'sell'; symbol: string; name: string; quantity: number; price: number;
  total: number; profit_loss?: number; created_at: string;
}
export interface LeaderboardEntry {
  rank: number; user_id: number; username: string; avatar_url?: string; portfolio_value: number;
  total_pnl: number; total_pnl_percent: number; total_trades: number;
}
export interface Achievement {
  id: number; name: string; description: string; icon: string; xp: number; unlocked?: boolean; unlocked_at?: string;
}

// Auth
export const auth = {
  signup: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/signup', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data.user),
}

// Stocks - backend wraps in { stocks: [...], count: N }
export const stocks = {
  list: (params?: { search?: string; sort?: string; sector?: string }) =>
    api.get<{ stocks: Stock[]; count: number }>('/stocks', { params }).then(r => r.data.stocks),
  get: (id: number) =>
    api.get<{ stock: Stock }>(`/stocks/${id}`).then(r => r.data.stock),
}

// Trading
export const trading = {
  buy: (data: { stock_id: number; quantity: number }) =>
    api.post('/trade/buy', data).then(r => r.data),
  sell: (data: { stock_id: number; quantity: number }) =>
    api.post('/trade/sell', data).then(r => r.data),
}

// Portfolio - backend sends different field names, map to expected shape
export const portfolio = {
  get: () => api.get<any>('/portfolio').then(r => {
    const d = r.data
    // Map backend holding fields (pnl → profit_loss, pnl_percent → profit_loss_percent)
    const holdings = (d.holdings || []).map((h: any) => ({
      ...h,
      profit_loss: h.pnl ?? h.profit_loss ?? 0,
      profit_loss_percent: h.pnl_percent ?? h.profit_loss_percent ?? 0,
    }))
    const allocationArray = d.asset_allocation
      ? Object.entries(d.asset_allocation).map(([sector, percent]) => ({
          sector,
          value: (Number(percent) / 100) * (d.total_current_value || 0),
          percent: Number(percent),
        }))
      : []
    return {
      holdings,
      total_value: d.total_portfolio_value || d.total_current_value || 0,
      total_invested: d.total_invested || 0,
      daily_pnl: d.daily_pnl || 0,
      daily_pnl_percent: d.daily_pnl_percent || 0,
      total_pnl: d.total_pnl || 0,
      total_pnl_percent: d.total_pnl_percent || 0,
      balance: d.balance || 0,
      allocation: allocationArray,
    } as Portfolio
  }),
}

// Transactions
export const transactions = {
  list: (params?: { type?: string; stock_id?: number; page?: number }) =>
    api.get('/transactions', { params }).then(r => r.data),
}

// Watchlist - backend wraps in { watchlist: [...] }
export const watchlist = {
  list: () =>
    api.get<{ watchlist: any[] }>('/watchlist').then(r => r.data.watchlist),
  add: (stock_id: number) =>
    api.post('/watchlist', { stock_id }).then(r => r.data),
  remove: (stock_id: number) =>
    api.delete(`/watchlist/${stock_id}`).then(r => r.data),
}

// Leaderboard - backend sends growth_percent instead of total_pnl_percent
export const leaderboard = {
  get: () =>
    api.get<{ leaderboard: any[] }>('/leaderboard').then(r =>
      (r.data.leaderboard || []).map((e: any) => ({
        ...e,
        total_pnl_percent: e.growth_percent ?? e.total_pnl_percent ?? 0,
        total_pnl: e.total_pnl ?? 0,
        total_trades: e.total_trades ?? 0,
      }))
    ),
}

// Achievements - backend wraps in { achievements: [...] }
export const achievements = {
  list: () =>
    api.get<{ achievements: Achievement[] }>('/achievements').then(r => r.data.achievements),
  check: () =>
    api.post('/achievements/check').then(r => r.data),
}

export default api
