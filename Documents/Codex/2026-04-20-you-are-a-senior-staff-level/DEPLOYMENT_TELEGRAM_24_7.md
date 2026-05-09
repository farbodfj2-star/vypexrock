# Vypexrock Telegram 24/7 Deployment

Telegram alerts only run while the backend worker processes are running. For alerts to keep working when your PC is off, deploy the backend, Redis, Postgres, Celery Beat, and the Telegram worker to a hosted server such as Railway, Render, or a VPS.

## Required Services

Run these processes on the server:

```bash
web: alembic upgrade head && python -m app.workers.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
beat: celery -A app.tasks.celery_app.celery_app beat --loglevel=info
telegram_worker: celery -A app.tasks.celery_app.celery_app worker -Q telegram --loglevel=info
```

Recommended optional workers:

```bash
analysis_worker: celery -A app.tasks.celery_app.celery_app worker -Q analysis --loglevel=info
alert_worker: celery -A app.tasks.celery_app.celery_app worker -Q alerts --loglevel=info
market_data_worker: python -m app.workers.market_data_worker
```

The `beat` process schedules the hourly market pulse and best-setup scan. The `telegram_worker` sends the messages and chart images. The frontend/browser does not need to be open.

## Environment Variables

Set these in Railway, Render, or your VPS environment settings:

```bash
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
SECRET_KEY=change-this-to-a-long-random-value

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_SIGNAL_ENABLED=true
TELEGRAM_MARKET_UPDATE_ENABLED=true
TELEGRAM_SIGNAL_INTERVAL_MINUTES=60
TELEGRAM_MARKET_UPDATE_INTERVAL_MINUTES=60
TELEGRAM_SIGNAL_MIN_CONFIDENCE=50
TELEGRAM_SIGNAL_MIN_RISK_REWARD=1.5
TELEGRAM_SIGNAL_COOLDOWN_MINUTES=180
TELEGRAM_MARKET_TOP_ASSETS_COUNT=15
```

If you use the Alerts page to save a bot token locally, that only applies to the database connected to that backend. For production 24/7 alerts, the safest setup is to put `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` directly in the hosted backend environment variables.

## Railway

1. Create a new Railway project from the repo.
2. Add PostgreSQL and Redis plugins.
3. Set the backend root/build context to `backend`.
4. Add the environment variables above.
5. Create one web service using the `web` command from `backend/Procfile`.
6. Create one worker service using the `beat` command.
7. Create one worker service using the `telegram_worker` command.
8. Check logs for `beat: Starting...` and `Task app.tasks.signal_alerts.send_hourly_market_update received`.

## Render

1. Create a Web Service for the backend.
2. Use Docker or Python runtime with root directory `backend`.
3. Add managed PostgreSQL and Redis, then set `DATABASE_URL` and `REDIS_URL`.
4. Add one Background Worker for Celery Beat:
   `celery -A app.tasks.celery_app.celery_app beat --loglevel=info`
5. Add one Background Worker for Telegram:
   `celery -A app.tasks.celery_app.celery_app worker -Q telegram --loglevel=info`
6. Add all Telegram environment variables.
7. Open worker logs and confirm hourly tasks are scheduled and completed.

## VPS

1. Install Docker and Docker Compose.
2. Copy the project to the server.
3. Put production values in `backend/.env`.
4. Run:

```bash
docker compose --profile workers up --build -d
```

5. Confirm containers:

```bash
docker compose --profile workers ps
docker compose logs --tail 100 alert-worker
docker compose logs --tail 100 telegram-worker
```

## How To Confirm It Works When Your PC Is Off

1. Deploy the backend and workers to the server.
2. Open Telegram and wait for the hourly market pulse.
3. Turn off your local computer.
4. After the next full hour, check Telegram again.
5. If a new message arrives, alerts are running from the hosted backend.

The Telegram chart image is generated inside the backend using the server-side chart renderer. It does not need localhost, your browser, or the frontend page to be open.
