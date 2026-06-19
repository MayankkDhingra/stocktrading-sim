# TradeX - Premium Stock Trading Simulator

A production-grade virtual stock trading platform built with premium fintech design.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, Zustand, React Query
**Backend:** Python Flask, SQLAlchemy, JWT Authentication, SQLite (PostgreSQL-ready schema)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Demo Credentials
- Email: demo@tradex.com
- Password: demo123
- Balance: $100,000 virtual

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Current user |
| GET | /api/stocks | List stocks (search, sort, filter) |
| GET | /api/stocks/:id | Stock detail + price history |
| POST | /api/trade/buy | Buy stock |
| POST | /api/trade/sell | Sell stock |
| GET | /api/portfolio | Portfolio overview |
| GET | /api/transactions | Transaction history |
| GET | /api/leaderboard | User rankings |
| GET | /api/achievements | Achievement list |
| POST | /api/achievements/check | Check & unlock achievements |
| GET/POST/DELETE | /api/watchlist | Manage watchlist |

## Features

- 🏦 Virtual trading with $100,000 starting balance
- 📊 Real-time stock prices with live updates
- 📈 Interactive charts (Area, Pie, Candlestick)
- 🏆 Competitive leaderboards with podium
- 🎯 Achievement system with XP & badges
- 📱 Fully responsive dark theme
- ✨ Glassmorphism, particle effects, custom cursor
- 🔐 JWT authentication
- 💼 Portfolio tracking with P&L

## Design

Neo-Fintech Luxury aesthetic featuring:
- Dark mode with aurora gradients
- Frosted glass cards with backdrop blur
- Animated particle backgrounds
- Custom cursor with hover effects
- Framer Motion page transitions
- Gradient text accents
- Neon glow borders

## Project Structure

```
stocktrading-sim/
├── backend/
│   ├── app.py              # Main Flask application
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/layout/  # Layout components
│   │   ├── lib/              # API client, utils
│   │   ├── pages/            # All page components
│   │   ├── store/            # Zustand stores
│   │   ├── App.tsx           # Main app with routing
│   │   └── index.css         # Global styles
│   ├── vite.config.ts
│   └── package.json
└── README.md
```
