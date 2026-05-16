# OAuth Authentication Deployment Guide

## Overview

This guide covers the complete setup and deployment of production-grade OAuth authentication for Vypexrock, including Google, GitHub, and Apple Sign In.

## ✅ What's Implemented

### Backend (FastAPI)
- ✅ **OAuth Service** (`backend/app/services/oauth_service.py`)
  - Google OAuth 2.0 implementation
  - GitHub OAuth implementation
  - Apple Sign In structure (requires additional setup)
  - Gmail-only validation for all providers
  - Automatic account creation and linking
  - JWT token generation

- ✅ **Auth Routes** (`backend/app/api/routes/auth.py`)
  - `/api/v1/auth/google/login` - Initiate Google OAuth
  - `/api/v1/auth/google/callback` - Handle Google callback
  - `/api/v1/auth/github/login` - Initiate GitHub OAuth
  - `/api/v1/auth/github/callback` - Handle GitHub callback
  - `/api/v1/auth/apple/login` - Initiate Apple Sign In
  - `/api/v1/auth/apple/callback` - Handle Apple callback
  - Email verification routes
  - Password reset routes
  - Phone verification routes

- ✅ **Configuration** (`backend/app/core/config.py`)
  - OAuth client credentials
  - Redirect URIs
  - Frontend URL for redirects
  - Token expiration settings

### Frontend (Next.js)
- ✅ **Social Auth Buttons** (`frontend/components/auth/social-auth-buttons.tsx`)
  - Premium glassmorphism design
  - Loading states
  - Error handling
  - Hover animations

- ✅ **OAuth Callback Page** (`frontend/app/auth/callback/page.tsx`)
  - Receives JWT token from backend
  - Fetches user data
  - Stores session
  - Redirects to terminal

- ✅ **OAuth Error Page** (`frontend/app/auth/error/page.tsx`)
  - Displays error messages
  - Provides retry options
  - Shows common issues

## 🔧 Setup Instructions

### 1. Google OAuth Setup

#### Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Vypexrock
   - User support email: your-email@gmail.com
   - Authorized domains: vypexrock.com (or your domain)
   - Developer contact: your-email@gmail.com
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Vypexrock Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://vypexrock.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:8000/api/v1/auth/google/callback` (development)
     - `https://api.vypexrock.com/api/v1/auth/google/callback` (production)

#### Add to Backend `.env`
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

#### Production Environment Variables (Railway)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.vypexrock.com/api/v1/auth/google/callback
FRONTEND_URL=https://vypexrock.com
```

### 2. GitHub OAuth Setup

#### Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in details:
   - Application name: Vypexrock
   - Homepage URL: `http://localhost:3000` (dev) or `https://vypexrock.com` (prod)
   - Authorization callback URL:
     - Development: `http://localhost:8000/api/v1/auth/github/callback`
     - Production: `https://api.vypexrock.com/api/v1/auth/github/callback`
4. Click **Register application**
5. Generate a new client secret

#### Add to Backend `.env`
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/auth/github/callback
```

#### Production Environment Variables (Railway)
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://api.vypexrock.com/api/v1/auth/github/callback
```

### 3. Apple Sign In Setup (Optional)

#### Create Apple Service ID
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Enroll in Apple Developer Program ($99/year)
3. Go to **Certificates, Identifiers & Profiles**
4. Create an **App ID**:
   - Description: Vypexrock
   - Bundle ID: com.vypexrock.app
   - Enable **Sign in with Apple**
5. Create a **Services ID**:
   - Description: Vypexrock Web
   - Identifier: com.vypexrock.service
   - Enable **Sign in with Apple**
   - Configure:
     - Primary App ID: com.vypexrock.app
     - Domains: vypexrock.com
     - Return URLs: `https://api.vypexrock.com/api/v1/auth/apple/callback`
6. Create a **Key**:
   - Key Name: Vypexrock Sign In Key
   - Enable **Sign in with Apple**
   - Download the key file (.p8)

#### Add to Backend `.env`
```bash
APPLE_CLIENT_ID=com.vypexrock.service
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/apple/callback
```

**Note:** Apple Sign In requires JWT verification implementation. The current code has a placeholder that returns a "not yet available" message.

### 4. Frontend Environment Variables

Create/update `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Production (Vercel):
```bash
NEXT_PUBLIC_API_URL=https://api.vypexrock.com
```

## 🚀 Deployment Steps

### Step 1: Update Backend Environment Variables

#### Railway Backend
1. Go to Railway dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Add OAuth credentials:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://api.vypexrock.com/api/v1/auth/google/callback
   
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   GITHUB_REDIRECT_URI=https://api.vypexrock.com/api/v1/auth/github/callback
   
   FRONTEND_URL=https://vypexrock.com
   ```
5. Click **Deploy** to restart with new variables

### Step 2: Deploy Backend

```bash
# Commit changes
git add backend/app/services/oauth_service.py
git add backend/app/api/routes/auth.py
git add backend/app/core/config.py
git add backend/.env.example
git commit -m "feat: implement production OAuth authentication"

# Push to GitHub (Railway auto-deploys)
git push origin main
```

### Step 3: Deploy Frontend

```bash
# Commit changes
git add frontend/app/auth/
git add frontend/components/auth/social-auth-buttons.tsx
git commit -m "feat: add OAuth callback and error pages"

# Push to GitHub (Vercel auto-deploys)
git push origin main
```

### Step 4: Verify Deployment

1. **Check Backend Health**
   ```bash
   curl https://api.vypexrock.com/health
   ```

2. **Test OAuth Endpoints**
   ```bash
   # Google login endpoint
   curl https://api.vypexrock.com/api/v1/auth/google/login
   
   # GitHub login endpoint
   curl https://api.vypexrock.com/api/v1/auth/github/login
   ```

3. **Test Frontend**
   - Visit `https://vypexrock.com/login`
   - Click "Continue with Google"
   - Should redirect to Google OAuth consent screen
   - After approval, should redirect back to `/auth/callback`
   - Should redirect to `/terminal` with active session

## 🧪 Testing OAuth Flow

### Local Testing

1. **Start Backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Google OAuth**
   - Go to `http://localhost:3000/login`
   - Click "Continue with Google"
   - Authorize with Gmail account
   - Should redirect to terminal

4. **Test GitHub OAuth**
   - Go to `http://localhost:3000/login`
   - Click "Continue with GitHub"
   - Authorize with GitHub account (must have Gmail)
   - Should redirect to terminal

### Production Testing

1. **Test Google OAuth**
   - Go to `https://vypexrock.com/login`
   - Click "Continue with Google"
   - Verify redirect to Google
   - Verify callback works
   - Verify session persists

2. **Test GitHub OAuth**
   - Go to `https://vypexrock.com/login`
   - Click "Continue with GitHub"
   - Verify redirect to GitHub
   - Verify callback works
   - Verify session persists

3. **Test Gmail Validation**
   - Try GitHub account without Gmail
   - Should show error: "No Gmail address found"

4. **Test Account Linking**
   - Sign up with email (Gmail)
   - Sign out
   - Sign in with Google using same Gmail
   - Should link accounts automatically

## 🔒 Security Considerations

### HTTPS Required
- OAuth providers require HTTPS in production
- Use Railway/Vercel default HTTPS domains
- Or configure custom domain with SSL

### CORS Configuration
- Backend CORS must allow frontend domain
- Already configured in `backend/app/core/config.py`
- Vercel domains are whitelisted via regex

### Token Security
- JWT tokens stored in localStorage
- Tokens expire after 24 hours (configurable)
- Refresh tokens not implemented (optional enhancement)

### Gmail-Only Validation
- Enforced at 3 layers:
  1. Frontend validation
  2. Backend validation
  3. Database constraint
- Prevents non-Gmail registrations

## 🐛 Troubleshooting

### "Not Found" Error on OAuth Callback
**Cause:** Backend routes not deployed or incorrect redirect URI

**Solution:**
1. Verify backend is deployed
2. Check Railway logs: `railway logs`
3. Verify redirect URI matches OAuth provider settings
4. Ensure `FRONTEND_URL` is set correctly

### "Only Gmail accounts are supported"
**Cause:** User's primary email is not Gmail

**Solution:**
1. For Google: User must use @gmail.com account
2. For GitHub: User must add Gmail to GitHub account
3. For Apple: User must use Gmail as Apple ID

### CORS Errors
**Cause:** Frontend domain not whitelisted

**Solution:**
1. Add domain to `CORS_ORIGINS` in backend config
2. Or ensure domain matches `cors_origin_regex` pattern
3. Redeploy backend

### Session Not Persisting
**Cause:** Token not stored correctly

**Solution:**
1. Check browser console for errors
2. Verify `/auth/callback` page stores token
3. Check `useAuthStore` implementation
4. Clear localStorage and retry

### OAuth Provider Returns Error
**Cause:** Invalid credentials or misconfigured app

**Solution:**
1. Verify client ID and secret are correct
2. Check redirect URI matches exactly
3. Ensure OAuth app is not in testing mode
4. Check provider-specific requirements

## 📊 Monitoring

### Backend Logs (Railway)
```bash
railway logs --tail
```

Look for:
- OAuth token exchange requests
- User creation/linking events
- Error messages

### Frontend Logs (Vercel)
1. Go to Vercel dashboard
2. Select deployment
3. View **Functions** logs
4. Check for OAuth callback errors

### Database Queries
```sql
-- Check OAuth users
SELECT id, email, auth_provider, google_id, github_id, email_verified
FROM users
WHERE auth_provider IN ('google', 'github', 'apple');

-- Check recent logins
SELECT email, last_login_at, auth_provider
FROM users
ORDER BY last_login_at DESC
LIMIT 10;
```

## 🎯 Next Steps

### Immediate
1. ✅ Deploy backend with OAuth credentials
2. ✅ Deploy frontend with callback pages
3. ✅ Test all OAuth providers in production
4. ✅ Monitor for errors

### Short-term
1. Implement Apple Sign In JWT verification
2. Add refresh token support
3. Add "Remember me" functionality
4. Implement session management dashboard

### Long-term
1. Add more OAuth providers (Microsoft, Twitter)
2. Implement 2FA (TOTP)
3. Add device management
4. Add login activity tracking

## 📝 Summary

### Files Modified
- `backend/app/services/oauth_service.py` (NEW)
- `backend/app/api/routes/auth.py` (UPDATED)
- `backend/app/core/config.py` (UPDATED)
- `backend/.env.example` (UPDATED)
- `frontend/app/auth/callback/page.tsx` (NEW)
- `frontend/app/auth/error/page.tsx` (NEW)
- `frontend/components/auth/social-auth-buttons.tsx` (EXISTING)

### Environment Variables Required
**Backend:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `FRONTEND_URL`

**Frontend:**
- `NEXT_PUBLIC_API_URL`

### OAuth Providers Status
- ✅ Google OAuth - Fully implemented
- ✅ GitHub OAuth - Fully implemented
- ⚠️ Apple Sign In - Structure ready, needs JWT verification

### Testing Checklist
- [ ] Google OAuth works locally
- [ ] GitHub OAuth works locally
- [ ] Gmail validation works
- [ ] Account linking works
- [ ] Error handling works
- [ ] Google OAuth works in production
- [ ] GitHub OAuth works in production
- [ ] Session persistence works
- [ ] Mobile responsive
- [ ] No console errors

---

**Last Updated:** May 16, 2026
**Status:** Ready for deployment
**Next Action:** Deploy to production and test
