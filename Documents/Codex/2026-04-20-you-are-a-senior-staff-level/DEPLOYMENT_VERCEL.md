# Vypexrock Frontend Deployment on Vercel

This project is a split frontend/backend app.

- Frontend: `frontend` folder, deployed to Vercel.
- Backend API/workers: `backend` folder, deployed separately to Railway/Render/Fly/VPS.
- Current production backend URL: `https://vypexrock-api-production.up.railway.app`

## Vercel Project Settings

Use these settings when importing the GitHub repository into Vercel:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Install Command | Auto / `npm install` |
| Output Directory | Auto / `.next` |

## Environment Variables

Add these in Vercel under Project Settings -> Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://vypexrock-api-production.up.railway.app/api/v1
NEXT_PUBLIC_WS_URL=wss://vypexrock-api-production.up.railway.app/api/v1/market/ws/market
```

Select Production, Preview, and Development unless you want different backend URLs per environment.

## Click-by-Click Vercel Deployment

1. Go to https://vercel.com/dashboard.
2. Click `Add New...`.
3. Click `Project`.
4. Import the GitHub repository for Vypexrock.
5. In `Framework Preset`, choose `Next.js`.
6. Set `Root Directory` to `frontend`.
7. Confirm `Build Command` is `npm run build`.
8. Open `Environment Variables`.
9. Add `NEXT_PUBLIC_API_URL`.
10. Add `NEXT_PUBLIC_WS_URL`.
11. Click `Deploy`.
12. After deploy finishes, open the generated `.vercel.app` URL.
13. Optionally rename the project to `vypexrock` so the URL can be `https://vypexrock.vercel.app` if available.

## Backend Requirement

Vercel should host only the frontend. The FastAPI backend, Redis, Postgres, Celery Beat, and Telegram worker must stay deployed on Railway/Render/Fly/VPS.

The frontend calls the backend through:

- REST API: `NEXT_PUBLIC_API_URL`
- WebSocket: `NEXT_PUBLIC_WS_URL`

If the backend URL changes, update both variables in Vercel and redeploy.
