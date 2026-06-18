"""
Stock Trading Simulator - Flask Backend
Production-ready REST API with SQLite (PostgreSQL-migration-ready schema)
"""

import random
import math
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///trading.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "tradex-jwt-secret-change-in-production"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
db = SQLAlchemy(app)
jwt = JWTManager(app)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=True)
    google_id = db.Column(db.String(256), unique=True, nullable=True)
    github_id = db.Column(db.String(256), unique=True, nullable=True)
    avatar_url = db.Column(db.String(512), nullable=True)
    balance = db.Column(db.Float, default=100000.0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    holdings = db.relationship("Holding", backref="user", lazy="dynamic")
    transactions = db.relationship("Transaction", backref="user", lazy="dynamic")
    watchlist = db.relationship("Watchlist", backref="user", lazy="dynamic")
    achievements = db.relationship("UserAchievement", backref="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "balance": round(self.balance, 2),
            "created_at": self.created_at.isoformat(),
        }


class Stock(db.Model):
    __tablename__ = "stocks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    symbol = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    change = db.Column(db.Float, default=0.0, nullable=False)
    change_percent = db.Column(db.Float, default=0.0, nullable=False)
    volume = db.Column(db.BigInteger, default=0)
    market_cap = db.Column(db.BigInteger, default=0)
    pe_ratio = db.Column(db.Float, nullable=True)
    dividend_yield = db.Column(db.Float, nullable=True)
    sector = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    holdings = db.relationship("Holding", backref="stock", lazy="dynamic")
    transactions = db.relationship("Transaction", backref="stock", lazy="dynamic")
    watchlist_entries = db.relationship("Watchlist", backref="stock", lazy="dynamic")

    def to_dict(self, include_history=False):
        data = {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "price": round(self.price, 2),
            "change": round(self.change, 2),
            "change_percent": round(self.change_percent, 2),
            "volume": self.volume,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "dividend_yield": self.dividend_yield,
            "sector": self.sector,
            "created_at": self.created_at.isoformat(),
        }
        if include_history:
            data["price_history"] = PriceHistoryGenerator.generate(self.price, 30)
        return data


class Holding(db.Model):
    __tablename__ = "holdings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    avg_price = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "stock_id", name="uq_user_stock_holding"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "stock_id": self.stock_id,
            "symbol": self.stock.symbol,
            "name": self.stock.name,
            "quantity": self.quantity,
            "avg_price": round(self.avg_price, 2),
            "current_price": round(self.stock.price, 2),
            "invested": round(self.quantity * self.avg_price, 2),
            "current_value": round(self.quantity * self.stock.price, 2),
            "pnl": round(self.quantity * (self.stock.price - self.avg_price), 2),
            "pnl_percent": round(
                ((self.stock.price - self.avg_price) / self.avg_price) * 100, 2
            ) if self.avg_price > 0 else 0,
            "created_at": self.created_at.isoformat(),
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False, index=True)
    type = db.Column(db.String(4), nullable=False)  # 'buy' or 'sell'
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    profit_loss = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "stock_id": self.stock_id,
            "symbol": self.stock.symbol,
            "name": self.stock.name,
            "type": self.type,
            "quantity": self.quantity,
            "price": round(self.price, 2),
            "total": round(self.total, 2),
            "profit_loss": round(self.profit_loss, 2) if self.profit_loss else 0,
            "created_at": self.created_at.isoformat(),
        }


class Watchlist(db.Model):
    __tablename__ = "watchlist"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False, index=True)

    __table_args__ = (
        db.UniqueConstraint("user_id", "stock_id", name="uq_user_stock_watchlist"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "stock_id": self.stock_id,
            "symbol": self.stock.symbol,
            "name": self.stock.name,
            "price": round(self.stock.price, 2),
            "change": round(self.stock.change, 2),
            "change_percent": round(self.stock.change_percent, 2),
        }


class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300), nullable=False)
    icon = db.Column(db.String(50), nullable=True)
    xp = db.Column(db.Integer, default=10)

    def to_dict(self, unlocked=False):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "xp": self.xp,
            "unlocked": unlocked,
        }


class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False, index=True)
    unlocked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )


# ---------------------------------------------------------------------------
# Price History Generator
# ---------------------------------------------------------------------------
class PriceHistoryGenerator:
    """Generate realistic 30-day mock price history for charts."""

    @staticmethod
    def generate(current_price: float, days: int = 30) -> list:
        history = []
        price = current_price
        now = datetime.now(timezone.utc)

        # Walk backwards from today, generating prices
        prices_reverse = [price]
        for i in range(days - 1, 0, -1):
            daily_volatility = random.uniform(-0.03, 0.03)
            price = price / (1 + daily_volatility)
            prices_reverse.append(price)

        prices_reverse.reverse()

        for i, p in enumerate(prices_reverse):
            date = now - timedelta(days=days - 1 - i)
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(p, 2),
            })

        return history


# ---------------------------------------------------------------------------
# Random Price Movement
# ---------------------------------------------------------------------------
def apply_random_price_movement():
    """Apply ±0.5-2% random movement to all stocks."""
    stocks = Stock.query.all()
    for stock in stocks:
        movement_pct = random.uniform(-0.02, 0.02)  # ±2%
        # Ensure minimum 0.5% movement in either direction
        if abs(movement_pct) < 0.005:
            movement_pct = random.choice([-0.005, 0.005]) + random.uniform(-0.005, 0.010)
        new_price = stock.price * (1 + movement_pct)
        stock.change = round(new_price - stock.price, 2)
        stock.change_percent = round(movement_pct * 100, 2)
        stock.price = round(max(new_price, 0.01), 2)  # Floor at $0.01
        stock.volume = max(0, stock.volume + random.randint(-50000, 200000))
    db.session.commit()


# ---------------------------------------------------------------------------
# Seed Data
# ---------------------------------------------------------------------------
STOCK_SEED_DATA = [
    # US Tech Giants
    {"symbol": "AAPL", "name": "Apple Inc.", "price": 182.40, "volume": 55000000, "market_cap": 2800000000000, "pe_ratio": 28.5, "dividend_yield": 0.55, "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "price": 141.80, "volume": 22000000, "market_cap": 1750000000000, "pe_ratio": 25.2, "dividend_yield": 0.0, "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "price": 420.30, "volume": 25000000, "market_cap": 3100000000000, "pe_ratio": 36.0, "dividend_yield": 0.80, "sector": "Technology"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "price": 185.20, "volume": 40000000, "market_cap": 1900000000000, "pe_ratio": 45.5, "dividend_yield": 0.0, "sector": "Consumer Cyclical"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "price": 248.50, "volume": 110000000, "market_cap": 790000000000, "pe_ratio": 65.0, "dividend_yield": 0.0, "sector": "Automotive"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "price": 510.60, "volume": 15000000, "market_cap": 1300000000000, "pe_ratio": 28.0, "dividend_yield": 0.40, "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "price": 875.00, "volume": 50000000, "market_cap": 2150000000000, "pe_ratio": 72.0, "dividend_yield": 0.02, "sector": "Technology"},
    {"symbol": "NFLX", "name": "Netflix Inc.", "price": 620.40, "volume": 5000000, "market_cap": 270000000000, "pe_ratio": 40.0, "dividend_yield": 0.0, "sector": "Entertainment"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "price": 165.30, "volume": 45000000, "market_cap": 267000000000, "pe_ratio": 220.0, "dividend_yield": 0.0, "sector": "Technology"},
    {"symbol": "INTC", "name": "Intel Corporation", "price": 34.50, "volume": 38000000, "market_cap": 146000000000, "pe_ratio": 30.0, "dividend_yield": 1.45, "sector": "Technology"},

    # More US stocks
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "price": 198.75, "volume": 10000000, "market_cap": 570000000000, "pe_ratio": 12.0, "dividend_yield": 2.30, "sector": "Financial Services"},
    {"symbol": "WMT", "name": "Walmart Inc.", "price": 68.45, "volume": 15000000, "market_cap": 550000000000, "pe_ratio": 28.5, "dividend_yield": 1.20, "sector": "Retail"},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "price": 155.30, "volume": 8000000, "market_cap": 375000000000, "pe_ratio": 16.5, "dividend_yield": 3.10, "sector": "Healthcare"},
    {"symbol": "DIS", "name": "The Walt Disney Company", "price": 95.20, "volume": 12000000, "market_cap": 174000000000, "pe_ratio": 35.0, "dividend_yield": 0.90, "sector": "Entertainment"},
    {"symbol": "BA", "name": "Boeing Company", "price": 178.65, "volume": 7000000, "market_cap": 108000000000, "pe_ratio": None, "dividend_yield": 0.0, "sector": "Aerospace & Defense"},

    # Indian Stocks
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "price": 35.50, "volume": 8000000, "market_cap": 240000000000, "pe_ratio": 27.0, "dividend_yield": 0.35, "sector": "Conglomerate"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "price": 48.20, "volume": 3000000, "market_cap": 176000000000, "pe_ratio": 32.0, "dividend_yield": 1.20, "sector": "Technology"},
    {"symbol": "INFY", "name": "Infosys Limited", "price": 18.75, "volume": 5000000, "market_cap": 78000000000, "pe_ratio": 25.0, "dividend_yield": 2.10, "sector": "Technology"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd.", "price": 65.80, "volume": 6000000, "market_cap": 165000000000, "pe_ratio": 22.0, "dividend_yield": 1.10, "sector": "Financial Services"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd.", "price": 28.90, "volume": 4000000, "market_cap": 100000000000, "pe_ratio": 19.5, "dividend_yield": 0.80, "sector": "Financial Services"},
]

ACHIEVEMENT_SEED_DATA = [
    # Auto-unlock achievements
    {"name": "Welcome!", "description": "Create your TradeX account", "icon": "star", "xp": 5},
    {"name": "Profile Setup", "description": "Complete your profile setup", "icon": "shield", "xp": 5},
    {"name": "Market Explorer", "description": "Browse the markets page", "icon": "target", "xp": 5},
    # Trading achievements
    {"name": "First Trade", "description": "Complete your first trade", "icon": "target", "xp": 10},
    {"name": "Trader", "description": "Complete 10 trades", "icon": "trending_up", "xp": 25},
    {"name": "Day Trader", "description": "Complete 50 trades", "icon": "zap", "xp": 50},
    {"name": "Whale", "description": "Make a trade worth over $50,000", "icon": "award", "xp": 30},
    {"name": "Diamond Hands", "description": "Hold a stock for over 7 days", "icon": "gem", "xp": 20},
    {"name": "Profit Maker", "description": "Achieve $1,000 in total profit", "icon": "trophy", "xp": 35},
    {"name": "Millionaire", "description": "Reach $1,000,000 portfolio value", "icon": "crown", "xp": 100},
    {"name": "Diversified", "description": "Hold 5 different stocks simultaneously", "icon": "sparkles", "xp": 25},
    {"name": "Risk Taker", "description": "Buy a stock with PE ratio over 100", "icon": "flame", "xp": 15},
    {"name": "Value Investor", "description": "Buy a stock with dividend yield over 2%", "icon": "star", "xp": 15},
]

# Demo user names for leaderboard seeding
DEMO_TRADER_NAMES = [
    "TradingWolf", "MarketKing", "BullRunner", "AlphaTrader",
    "QuantumInvestor", "StockMaster", "WallStreetWhiz", "CryptoQueen",
    "DividendKing", "GrowthHunter", "ValueSeeker", "TechBull",
    "IndexMaster", "OptionGuru", "SwingTrader", "PennyPincher",
    "BlueChipBaron", "FuturesKing", "RothschildJr", "BuffettFan",
]


def seed_database():
    """Seed the database with realistic demo data."""
    if Stock.query.first() is not None:
        return

    # ── Stocks ──────────────────────────────────────────────────────────
    for sdata in STOCK_SEED_DATA:
        stock = Stock(
            symbol=sdata["symbol"],
            name=sdata["name"],
            price=sdata["price"],
            volume=sdata.get("volume", 0),
            market_cap=sdata.get("market_cap", 0),
            pe_ratio=sdata.get("pe_ratio"),
            dividend_yield=sdata.get("dividend_yield"),
            sector=sdata.get("sector"),
        )
        db.session.add(stock)

    # ── Achievements ────────────────────────────────────────────────────
    for adata in ACHIEVEMENT_SEED_DATA:
        db.session.add(Achievement(
            name=adata["name"],
            description=adata["description"],
            icon=adata["icon"],
            xp=adata["xp"],
        ))
    db.session.flush()

    # ── Demo user (the main one) ────────────────────────────────────────
    demo_user = User(
        username="demo",
        email="demo@tradex.com",
        password_hash=generate_password_hash("demo123"),
        balance=100000.0,
    )
    db.session.add(demo_user)
    db.session.flush()

    # Give demo user some holdings and transactions
    stock_ids = list(range(1, len(STOCK_SEED_DATA) + 1))
    random.shuffle(stock_ids)

    demo_holdings_cfg = [
        (stock_ids[0], 15),   # AAPL equivalent
        (stock_ids[5], 8),    # META equivalent
        (stock_ids[6], 3),    # NVDA equivalent
        (stock_ids[2], 10),   # MSFT equivalent
    ]

    total_spent = 0.0
    for sid, qty in demo_holdings_cfg:
        stock = Stock.query.get(sid)
        buy_price = stock.price * random.uniform(0.92, 0.98)
        cost = buy_price * qty
        total_spent += cost
        db.session.add(Holding(
            user_id=demo_user.id, stock_id=sid,
            quantity=qty, avg_price=buy_price,
        ))
        db.session.add(Transaction(
            user_id=demo_user.id, stock_id=sid,
            type="buy", quantity=qty, price=buy_price,
            total=cost, profit_loss=0.0,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(3, 20)),
        ))

    # Add some sell transactions for realism
    sell_sid = stock_ids[3]
    sell_stock = Stock.query.get(sell_sid)
    db.session.add(Holding(
        user_id=demo_user.id, stock_id=sell_sid,
        quantity=5, avg_price=sell_stock.price * 0.95,
    ))
    db.session.add(Transaction(
        user_id=demo_user.id, stock_id=sell_sid,
        type="buy", quantity=10, price=sell_stock.price * 0.94,
        total=sell_stock.price * 0.94 * 10, profit_loss=0.0,
        created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(10, 25)),
    ))
    db.session.add(Transaction(
        user_id=demo_user.id, stock_id=sell_sid,
        type="sell", quantity=5, price=sell_stock.price,
        total=sell_stock.price * 5,
        profit_loss=(sell_stock.price - sell_stock.price * 0.95) * 5,
        created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 8)),
    ))

    demo_user.balance = 100000.0 - total_spent
    if demo_user.balance < 0:
        demo_user.balance = 50000.0

    # Auto-unlock welcome achievements for demo
    welcome_achs = Achievement.query.filter(
        Achievement.name.in_(["Welcome!", "Profile Setup", "Market Explorer"])
    ).all()
    for ach in welcome_achs:
        db.session.add(UserAchievement(user_id=demo_user.id, achievement_id=ach.id))

    # ── Create 20 AI traders ────────────────────────────────────────────
    for i, name in enumerate(DEMO_TRADER_NAMES):
        ai_user = User(
            username=name,
            email=f"{name.lower()}@trader.ai",
            password_hash=generate_password_hash("ai_trader_pass"),
            balance=100000.0,
        )
        db.session.add(ai_user)
        db.session.flush()

        # Give each AI trader 2-5 holdings
        ai_holdings_count = random.randint(2, 5)
        ai_stocks = random.sample(stock_ids, ai_holdings_count)
        ai_spent = 0.0
        for sid in ai_stocks:
            stock = Stock.query.get(sid)
            qty = random.randint(3, 30)
            buy_price = stock.price * random.uniform(0.88, 1.02)
            cost = buy_price * qty
            ai_spent += cost
            db.session.add(Holding(
                user_id=ai_user.id, stock_id=sid,
                quantity=qty, avg_price=buy_price,
            ))
            # 1-4 buy transactions per stock
            for _ in range(random.randint(1, 4)):
                tx_qty = random.randint(1, max(1, qty // 2))
                tx_price = stock.price * random.uniform(0.85, 1.05)
                db.session.add(Transaction(
                    user_id=ai_user.id, stock_id=sid,
                    type="buy", quantity=tx_qty, price=tx_price,
                    total=tx_price * tx_qty, profit_loss=0.0,
                    created_at=datetime.now(timezone.utc) - timedelta(
                        days=random.randint(0, 30),
                        hours=random.randint(0, 23),
                    ),
                ))

        # Some sell transactions for AI traders
        if ai_stocks and random.random() > 0.3:
            sell_sid = random.choice(ai_stocks)
            sell_stock = Stock.query.get(sell_sid)
            sell_qty = random.randint(1, 5)
            sell_price = sell_stock.price * random.uniform(0.95, 1.10)
            db.session.add(Transaction(
                user_id=ai_user.id, stock_id=sell_sid,
                type="sell", quantity=sell_qty, price=sell_price,
                total=sell_price * sell_qty,
                profit_loss=(sell_price - sell_stock.price * 0.92) * sell_qty,
                created_at=datetime.now(timezone.utc) - timedelta(
                    days=random.randint(0, 14),
                ),
            ))

        ai_user.balance = max(1000, 100000.0 - ai_spent)

        # Unlock welcome achievements for AI
        for ach in welcome_achs:
            db.session.add(UserAchievement(user_id=ai_user.id, achievement_id=ach.id))

    db.session.commit()


# ---------------------------------------------------------------------------
# Auth Routes
# ---------------------------------------------------------------------------
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already exists"}), 409

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        balance=100000.0,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "User created", "user": user.to_dict(), "token": token}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Login successful", "user": user.to_dict(), "token": token}), 200


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# Stock Routes
# ---------------------------------------------------------------------------
@app.route("/api/stocks", methods=["GET"])
@jwt_required(optional=True)
def list_stocks():
    # Apply random price movement on each fetch
    apply_random_price_movement()

    query = Stock.query

    # Search by symbol or name
    search = request.args.get("search", "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Stock.symbol.ilike(pattern)) | (Stock.name.ilike(pattern))
        )

    # Filter by sector
    sector = request.args.get("sector", "").strip()
    if sector:
        query = query.filter(Stock.sector == sector)

    # Sort
    sort_by = request.args.get("sort_by", "symbol")
    sort_order = request.args.get("sort_order", "asc")
    valid_sort_fields = {
        "symbol": Stock.symbol,
        "name": Stock.name,
        "price": Stock.price,
        "change": Stock.change,
        "change_percent": Stock.change_percent,
        "volume": Stock.volume,
        "market_cap": Stock.market_cap,
        "sector": Stock.sector,
    }
    sort_col = valid_sort_fields.get(sort_by, Stock.symbol)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    stocks = query.all()
    return jsonify({
        "stocks": [s.to_dict(include_history=False) for s in stocks],
        "count": len(stocks),
    }), 200


@app.route("/api/stocks/<int:stock_id>", methods=["GET"])
@jwt_required(optional=True)
def get_stock(stock_id):
    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"error": "Stock not found"}), 404
    return jsonify({"stock": stock.to_dict(include_history=True)}), 200


# ---------------------------------------------------------------------------
# Trading Routes
# ---------------------------------------------------------------------------
@app.route("/api/trade/buy", methods=["POST"])
@jwt_required()
def buy_stock():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    stock_id = data.get("stock_id")
    quantity = data.get("quantity")

    if not stock_id or not quantity:
        return jsonify({"error": "stock_id and quantity are required"}), 400

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"error": "Stock not found"}), 404

    total_cost = stock.price * quantity
    if user.balance < total_cost:
        return jsonify({
            "error": "Insufficient balance",
            "required": round(total_cost, 2),
            "balance": round(user.balance, 2),
        }), 400

    # Deduct balance
    user.balance -= total_cost

    # Create or update holding
    holding = Holding.query.filter_by(user_id=user_id, stock_id=stock_id).first()
    if holding:
        total_quantity = holding.quantity + quantity
        holding.avg_price = ((holding.avg_price * holding.quantity) + (stock.price * quantity)) / total_quantity
        holding.quantity = total_quantity
    else:
        holding = Holding(
            user_id=user_id,
            stock_id=stock_id,
            quantity=quantity,
            avg_price=stock.price,
        )
        db.session.add(holding)

    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        stock_id=stock_id,
        type="buy",
        quantity=quantity,
        price=stock.price,
        total=total_cost,
        profit_loss=0.0,
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({
        "message": "Purchase successful",
        "transaction": transaction.to_dict(),
        "holding": holding.to_dict(),
        "balance": round(user.balance, 2),
    }), 200


@app.route("/api/trade/sell", methods=["POST"])
@jwt_required()
def sell_stock():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    stock_id = data.get("stock_id")
    quantity = data.get("quantity")

    if not stock_id or not quantity:
        return jsonify({"error": "stock_id and quantity are required"}), 400

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"error": "Stock not found"}), 404

    holding = Holding.query.filter_by(user_id=user_id, stock_id=stock_id).first()
    if not holding or holding.quantity < quantity:
        return jsonify({"error": "Insufficient holdings"}), 400

    total_sale = stock.price * quantity
    profit_loss = (stock.price - holding.avg_price) * quantity

    # Update balance
    user.balance += total_sale

    # Update holding
    holding.quantity -= quantity
    if holding.quantity == 0:
        db.session.delete(holding)
    # If quantity > 0, avg_price stays the same (FIFO simplification)

    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        stock_id=stock_id,
        type="sell",
        quantity=quantity,
        price=stock.price,
        total=total_sale,
        profit_loss=profit_loss,
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({
        "message": "Sale successful",
        "transaction": transaction.to_dict(),
        "remaining_holding": holding.to_dict() if (holding and holding.quantity > 0) else None,
        "balance": round(user.balance, 2),
    }), 200


# ---------------------------------------------------------------------------
# Portfolio Route
# ---------------------------------------------------------------------------
@app.route("/api/portfolio", methods=["GET"])
@jwt_required()
def portfolio():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    holdings = Holding.query.filter_by(user_id=user_id).filter(Holding.quantity > 0).all()

    holdings_data = []
    total_invested = 0.0
    total_current_value = 0.0

    for h in holdings:
        invested = h.quantity * h.avg_price
        current_value = h.quantity * h.stock.price
        total_invested += invested
        total_current_value += current_value
        holdings_data.append(h.to_dict())

    total_pnl = total_current_value - total_invested
    total_pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    # Asset allocation by sector
    allocation = {}
    for h in holdings:
        sector = h.stock.sector or "Other"
        current_value = h.quantity * h.stock.price
        allocation[sector] = allocation.get(sector, 0) + current_value

    allocation_pct = {}
    for sector, value in allocation.items():
        allocation_pct[sector] = round((value / total_current_value * 100), 2) if total_current_value > 0 else 0

    # Daily P&L approximation based on today's change
    daily_pnl = sum(
        h.quantity * h.stock.change
        for h in holdings
    )

    return jsonify({
        "balance": round(user.balance, 2),
        "holdings": holdings_data,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current_value, 2),
        "total_portfolio_value": round(user.balance + total_current_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_percent": round(total_pnl_percent, 2),
        "daily_pnl": round(daily_pnl, 2),
        "asset_allocation": allocation_pct,
    }), 200


# ---------------------------------------------------------------------------
# Transactions Route
# ---------------------------------------------------------------------------
@app.route("/api/transactions", methods=["GET"])
@jwt_required()
def transactions():
    user_id = int(get_jwt_identity())

    query = Transaction.query.filter_by(user_id=user_id)

    # Filter by type
    tx_type = request.args.get("type", "").strip()
    if tx_type in ("buy", "sell"):
        query = query.filter(Transaction.type == tx_type)

    # Filter by stock
    stock_id = request.args.get("stock_id")
    if stock_id:
        query = query.filter(Transaction.stock_id == int(stock_id))

    # Filter by date range
    from_date = request.args.get("from")
    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date)
            query = query.filter(Transaction.created_at >= from_dt)
        except ValueError:
            pass

    to_date = request.args.get("to")
    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date)
            query = query.filter(Transaction.created_at <= to_dt)
        except ValueError:
            pass

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)

    pagination = query.order_by(Transaction.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "transactions": [t.to_dict() for t in pagination.items],
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "pages": pagination.pages,
    }), 200


# ---------------------------------------------------------------------------
# Watchlist Routes
# ---------------------------------------------------------------------------
@app.route("/api/watchlist", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = int(get_jwt_identity())
    items = Watchlist.query.filter_by(user_id=user_id).all()
    return jsonify({
        "watchlist": [item.to_dict() for item in items],
    }), 200


@app.route("/api/watchlist", methods=["POST"])
@jwt_required()
def add_to_watchlist():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    stock_id = data.get("stock_id")
    if not stock_id:
        return jsonify({"error": "stock_id is required"}), 400

    stock = Stock.query.get(stock_id)
    if not stock:
        return jsonify({"error": "Stock not found"}), 404

    existing = Watchlist.query.filter_by(user_id=user_id, stock_id=stock_id).first()
    if existing:
        return jsonify({"message": "Already in watchlist", "item": existing.to_dict()}), 200

    item = Watchlist(user_id=user_id, stock_id=stock_id)
    db.session.add(item)
    db.session.commit()

    return jsonify({"message": "Added to watchlist", "item": item.to_dict()}), 201


@app.route("/api/watchlist/<int:stock_id>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(stock_id):
    user_id = int(get_jwt_identity())
    item = Watchlist.query.filter_by(user_id=user_id, stock_id=stock_id).first()
    if not item:
        return jsonify({"error": "Item not found in watchlist"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from watchlist"}), 200


# ---------------------------------------------------------------------------
# Leaderboard Route
# ---------------------------------------------------------------------------
@app.route("/api/leaderboard", methods=["GET"])
@jwt_required(optional=True)
def leaderboard():
    users = User.query.all()
    leaderboard_data = []

    for user in users:
        holdings = Holding.query.filter_by(user_id=user.id).filter(Holding.quantity > 0).all()
        total_current_value = sum(h.quantity * h.stock.price for h in holdings)
        total_portfolio = user.balance + total_current_value
        total_trades = Transaction.query.filter_by(user_id=user.id).count()

        # Growth % based on initial balance of 100000
        initial_balance = 100000.0
        growth_pct = ((total_portfolio - initial_balance) / initial_balance) * 100

        leaderboard_data.append({
            "user_id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "portfolio_value": round(total_portfolio, 2),
            "growth_percent": round(growth_pct, 2),
            "total_trades": total_trades,
        })

    leaderboard_data.sort(key=lambda x: x["growth_percent"], reverse=True)

    # Add ranks
    for rank, entry in enumerate(leaderboard_data, 1):
        entry["rank"] = rank

    return jsonify({"leaderboard": leaderboard_data}), 200


# ---------------------------------------------------------------------------
# Achievements Routes
# ---------------------------------------------------------------------------
@app.route("/api/achievements", methods=["GET"])
@jwt_required()
def get_achievements():
    user_id = int(get_jwt_identity())
    all_achievements = Achievement.query.all()
    unlocked_ids = {
        ua.achievement_id
        for ua in UserAchievement.query.filter_by(user_id=user_id).all()
    }

    result = [a.to_dict(unlocked=(a.id in unlocked_ids)) for a in all_achievements]
    return jsonify({"achievements": result}), 200


@app.route("/api/achievements/check", methods=["POST"])
@jwt_required()
def check_achievements():
    """Check and unlock new achievements based on current user state."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    unlocked_ids = {
        ua.achievement_id
        for ua in UserAchievement.query.filter_by(user_id=user_id).all()
    }

    transactions = Transaction.query.filter_by(user_id=user_id).all()
    holdings = Holding.query.filter_by(user_id=user_id).filter(Holding.quantity > 0).all()
    holding_stocks = [h.stock for h in holdings]

    total_portfolio = user.balance + sum(h.quantity * h.stock.price for h in holdings)
    total_profit = sum(t.profit_loss for t in transactions if t.profit_loss and t.profit_loss > 0)
    total_trade_count = len(transactions)
    max_trade_value = max((abs(t.total) for t in transactions), default=0)
    distinct_holdings = len(holdings)

    has_high_pe = any(s.pe_ratio and s.pe_ratio > 100 for s in holding_stocks)
    has_dividend = any(s.dividend_yield and s.dividend_yield > 2 for s in holding_stocks)

    # Check oldest holding for diamond hands (7+ days)
    diamond_hands = False
    if holdings:
        oldest = min(h.created_at for h in holdings)
        if (datetime.now(timezone.utc) - oldest).days >= 7:
            diamond_hands = True

    criteria_map = {
        "First Trade": total_trade_count >= 1,
        "Trader": total_trade_count >= 10,
        "Day Trader": total_trade_count >= 50,
        "Whale": max_trade_value >= 50000,
        "Diamond Hands": diamond_hands,
        "Profit Maker": total_profit >= 1000,
        "Millionaire": total_portfolio >= 1000000,
        "Diversified": distinct_holdings >= 5,
        "Risk Taker": has_high_pe,
        "Value Investor": has_dividend,
    }

    newly_unlocked = []
    for ach in Achievement.query.all():
        if ach.id in unlocked_ids:
            continue
        if criteria_map.get(ach.name, False):
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.session.add(ua)
            newly_unlocked.append(ach.to_dict(unlocked=True))

    db.session.commit()

    return jsonify({
        "newly_unlocked": newly_unlocked,
        "total_unlocked": len(unlocked_ids) + len(newly_unlocked),
    }), 200


# ---------------------------------------------------------------------------
# Health Route
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return jsonify({
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


# ---------------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_database()
    app.run(host="0.0.0.0", port=5000, debug=True)
