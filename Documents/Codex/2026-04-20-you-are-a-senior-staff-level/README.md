# Nebula Signals

Nebula Signals is a production-oriented crypto analytics platform built for real-time market visibility, rule-based signal generation, alerting, and subscription-ready growth. The stack is intentionally split into independently deployable frontend, API, market ingestion, analysis, alerting, and Telegram delivery services so it can start lean in Docker Compose and evolve into a professional SaaS deployment.

## 1. Architecture Explanation

### Service layout

1. `frontend` (`Next.js 14`, App Router, TypeScript, Tailwind CSS)
2. `api` (`FastAPI`, async-first, JWT auth, WebSocket streaming)
3. `market-data-worker` (Binance WebSocket ingestion + Redis cache + CoinGecko metadata hydration)
4. `analysis-worker` (Celery worker computing RSI, EMA, MACD, structure-aware signals)
5. `alert-worker` (Celery worker with beat schedule checking price / RSI / signal-change conditions)
6. `telegram-worker` (Telegram Bot dispatcher queue)
7. `postgres` (primary relational store)
8. `redis` (cache, pub/sub, Celery broker/backend, rate limiting)

### Core data flow

1. `market-data-worker` streams Binance tickers, stores latest market snapshots in Redis, refreshes historical candles, and publishes updates to Redis pub/sub.
2. FastAPI exposes dashboard and coin-detail APIs, plus a WebSocket endpoint that relays the Redis pub/sub market stream to the frontend.
3. `analysis-worker` periodically loads candles, computes indicators and signals, and upserts them into PostgreSQL.
4. `alert-worker` periodically evaluates user-defined alerts against Redis ticker data and latest PostgreSQL signals.
5. When alerts trigger, `telegram-worker` sends structured notifications through the Telegram Bot API and the trigger is logged in `alert_logs`.
6. The Telegram automation sends an hourly top-15 market pulse and scans for one best 4H setup, applying a medium-confidence quality gate, a 3-hour cooldown, and chart-image delivery.
7. The frontend consumes the REST API for page data and WebSocket events for live market updates.

### Signal engine

The signal engine combines:

- `EMA20 > EMA50`, `RSI < 70`, `MACD bullish` for `long`
- `EMA20 < EMA50`, `RSI > 30`, `MACD bearish` for `short`
- `neutral` otherwise

Confidence is adjusted by the trend state and recent price structure (`breakout`, `breakdown`, `range`). Suggested entries, stop loss, and take-profit levels are derived from ATR-style volatility rather than fixed percentages.

### Subscription-ready design

The schema includes:

- `plans`
- `subscriptions`
- `users`
- `watchlists`
- `alerts`
- `alert_logs`
- `signals`
- `telegram_accounts`
- `system_settings`

That gives you feature gating hooks now without forcing payment integration yet.

## 2. Backend Code

Backend code lives in [`backend/app`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app).

### Key modules

- API routes: [`backend/app/api/routes`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/api/routes)
- Core config and auth: [`backend/app/core`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/core)
- Async DB session and ORM models: [`backend/app/db`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/db), [`backend/app/models`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/models)
- Schemas: [`backend/app/schemas`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/schemas)
- Services: [`backend/app/services`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/services)
- Celery tasks: [`backend/app/tasks`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/tasks)
- Worker entrypoints: [`backend/app/workers`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/app/workers)

### Important backend behaviors

- JWT auth with register, login, and current-user endpoints
- Redis-backed basic rate limiting middleware
- PostgreSQL-first persistence with SQLAlchemy async ORM
- Alembic initial migration for the full schema
- Optional AI explanation layer with graceful fallback when `OPENAI_API_KEY` is absent
- Telegram signal automation with medium/high confidence labels, chart image attachments, cooldown, and Redis-backed delivery history
- FastAPI WebSocket endpoint for live dashboard updates

## 3. Frontend Code

Frontend code lives in [`frontend`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend).

### UI surfaces

- Dashboard: [`frontend/app/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/page.tsx)
- Coin detail with TradingView widget and signal cards: [`frontend/app/coin/[symbol]/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/coin/[symbol]/page.tsx)
- Watchlist: [`frontend/app/watchlist/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/watchlist/page.tsx)
- Alerts and Telegram linking: [`frontend/app/alerts/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/alerts/page.tsx)
- Auth: [`frontend/app/login/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/login/page.tsx), [`frontend/app/register/page.tsx`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/app/register/page.tsx)

### Component architecture

- `CoinTable`
- `SignalCard`
- `AlertForm`
- `WatchlistPanel`
- `Navbar`
- `Sidebar`
- `TradingViewWidget`
- `TelegramLinkCard`

State handling uses React Query for remote data and Zustand for auth/session state.

## 4. Docker Setup

Runtime files:

- [`docker-compose.yml`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/docker-compose.yml)
- [`backend/Dockerfile`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/Dockerfile)
- [`frontend/Dockerfile`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/Dockerfile)

### Local stack

- Frontend on `http://localhost:3000`
- API on `http://localhost:8000`
- Postgres on `localhost:5432`
- Redis on `localhost:6379`

## 5. Environment Config

Template files:

- [`backend/.env.example`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/backend/.env.example)
- [`frontend/.env.example`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/frontend/.env.example)

### Backend variables

- `ENVIRONMENT`
- `SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_SIGNAL_ENABLED`
- `TELEGRAM_MARKET_UPDATE_ENABLED`
- `TELEGRAM_MARKET_UPDATE_INTERVAL_MINUTES`
- `TELEGRAM_SIGNAL_INTERVAL_MINUTES`
- `TELEGRAM_UPDATE_INTERVAL_MINUTES`
- `TELEGRAM_SIGNAL_MIN_CONFIDENCE`
- `TELEGRAM_SIGNAL_MIN_RISK_REWARD`
- `TELEGRAM_SIGNAL_COOLDOWN_MINUTES`
- `TELEGRAM_SIGNAL_TIMEFRAME`
- `TELEGRAM_MARKET_TOP_ASSETS_COUNT`
- `TELEGRAM_SIGNAL_SYMBOLS`
- `TELEGRAM_MARKET_UPDATE_SYMBOLS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### Frontend variables

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## 6. Setup Instructions

### Local Docker workflow

1. Copy the example env files if you want to customize values.
2. Run:

```bash
docker compose up --build
```

3. Open [http://localhost:3000](http://localhost:3000).

### Manual backend workflow

1. Create a Python 3.12 virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Run migrations:

```bash
alembic upgrade head
python -m app.workers.seed
```

4. Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

5. Start services in separate terminals:

```bash
python -m app.workers.market_data_worker
celery -A app.tasks.celery_app.celery_app worker -Q analysis --loglevel=info
celery -A app.tasks.celery_app.celery_app worker -Q alerts --beat --loglevel=info
celery -A app.tasks.celery_app.celery_app worker -Q telegram --loglevel=info
```

### Telegram hourly market pulse and signals

Every `TELEGRAM_MARKET_UPDATE_INTERVAL_MINUTES` minutes Vypexrock sends a short top-15 market pulse with live prices, 24h change, and market mood. Every `TELEGRAM_SIGNAL_INTERVAL_MINUTES` minutes it scans watched assets and sends only the single best setup if it passes the quality filter. Trade photos are sent only for `Long`, `Strong Long`, `Short`, or `Strong Short` setups when confidence is at least `TELEGRAM_SIGNAL_MIN_CONFIDENCE`, risk/reward is at least `TELEGRAM_SIGNAL_MIN_RISK_REWARD`, stop loss and take-profit levels exist, and the same symbol/timeframe is outside the cooldown window. Signals from 50-69% are labeled medium confidence; 70%+ are labeled high confidence.

To enable locally:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_MARKET_UPDATE_ENABLED=true
TELEGRAM_SIGNAL_ENABLED=true
TELEGRAM_MARKET_UPDATE_INTERVAL_MINUTES=60
TELEGRAM_SIGNAL_INTERVAL_MINUTES=60
TELEGRAM_MARKET_TOP_ASSETS_COUNT=15
TELEGRAM_SIGNAL_MIN_CONFIDENCE=50
TELEGRAM_SIGNAL_MIN_RISK_REWARD=1.5
TELEGRAM_SIGNAL_COOLDOWN_MINUTES=180
```

Then run workers:

```bash
docker compose --profile workers up --build -d
```

The default market pulse interval is 60 minutes, the default best-setup scan interval is 60 minutes, the default cooldown is 180 minutes, and the default signal timeframe is `4h`.

For hosted 24/7 Telegram alerts that keep running when your PC is off, use the production worker guide in [`DEPLOYMENT_TELEGRAM_24_7.md`](/C:/Users/vypex/Documents/Codex/2026-04-20-you-are-a-senior-staff-level/DEPLOYMENT_TELEGRAM_24_7.md).

### Manual frontend workflow

```bash
cd frontend
npm install
npm run dev
```

## 7. Deploy Instructions

### Frontend on Vercel

1. Import the `frontend` directory as a Vercel project.
2. Set:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
3. Deploy with the default Next.js build settings.

### Backend on Railway / Fly.io / Render

1. Deploy the `backend` directory as a Python service.
2. Provision managed PostgreSQL and Redis.
3. Set backend env vars, especially `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, and optional `OPENAI_API_KEY`.
4. Run `alembic upgrade head` as a release or startup command.
5. Run separate process definitions for:
   - API: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Market worker: `python -m app.workers.market_data_worker`
   - Analysis worker: `celery -A app.tasks.celery_app.celery_app worker -Q analysis --loglevel=info`
   - Alert worker: `celery -A app.tasks.celery_app.celery_app worker -Q alerts --beat --loglevel=info`
   - Telegram worker: `celery -A app.tasks.celery_app.celery_app worker -Q telegram --loglevel=info`

### How services connect

- Frontend points to the public API URL and WebSocket URL.
- API, workers, and Celery share the same Postgres and Redis instances.
- Telegram delivery is enabled only when a bot token is configured.
- Scheduled Telegram reports require Telegram credentials and `TELEGRAM_MARKET_UPDATE_ENABLED=true`. High-confidence Telegram signal automation also requires `TELEGRAM_SIGNAL_ENABLED=true`.
- AI explanations are optional and degrade to rule-based text if no key is present.

## 8. Notes

- This scaffold is production-oriented, but you should still add monitoring, secret rotation, managed TLS, and stronger plan enforcement before public launch.
- TradingView is used as the current chart layer, while the data model leaves room for future custom charting.
- Payment integration is intentionally deferred, but the schema and service boundaries are ready for it.
