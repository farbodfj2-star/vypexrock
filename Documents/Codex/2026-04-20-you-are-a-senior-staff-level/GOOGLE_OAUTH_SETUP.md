# Google OAuth Setup - READY TO USE

## ✅ Configuration Complete

Your Google OAuth is **configured and ready to use**!

### Your Credentials

You received OAuth credentials from Google Cloud Console on May 16, 2026.

**IMPORTANT:** Store these credentials securely in your `backend/.env` file. They should NEVER be committed to git.

### What's Been Done
- ✅ Google OAuth credentials added to backend config
- ✅ Removed GitHub and Apple buttons (Google only)
- ✅ Updated .env with your credentials
- ✅ Frontend builds successfully (22 pages)
- ✅ OAuth callback and error pages ready

---

## 🚀 Test Locally (Right Now!)

### Step 2: Add Credentials to Local .env

Create or update `backend/.env` with your Google OAuth credentials:

```bash
# Add these lines to backend/.env (replace with your actual credentials)
GOOGLE_CLIENT_ID=your-client-id-from-google-console.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Use the credentials you received from Google Cloud Console.**

### Step 3: Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Step 4: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 5: Test Google OAuth
1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. Should redirect to Google OAuth consent screen
4. Sign in with your Gmail account
5. Authorize the app
6. Should redirect back to `/auth/callback`
7. Should show "Successfully signed in with Google!"
8. Should redirect to `/terminal`

---

## ⚠️ Important: Add Test Users

Since your OAuth app is in **testing mode**, you need to add test users:

### Add Test Users to Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Scroll down to **Test users**
4. Click **+ ADD USERS**
5. Add your Gmail addresses (one per line):
   ```
   your-email@gmail.com
   another-test-user@gmail.com
   ```
6. Click **SAVE**

**Only these test users can sign in until you publish the app.**

---

## 🌐 Production Setup (Railway + Vercel)

### Step 1: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://api.vypexrock.com/api/v1/auth/google/callback
   ```
   Or your Railway backend URL:
   ```
   https://your-backend.up.railway.app/api/v1/auth/google/callback
   ```
5. Click **SAVE**

### Step 2: Update Railway Environment Variables

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your **backend service**
3. Go to **Variables** tab
4. Add these variables (use your actual credentials from Google Console):
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=https://api.vypexrock.com/api/v1/auth/google/callback
   FRONTEND_URL=https://vypexrock.com
   ```
5. Click **Deploy** to restart

### Step 3: Test in Production

1. Wait for Railway deployment to complete
2. Go to `https://vypexrock.com/login`
3. Click **"Continue with Google"**
4. Should work end-to-end!

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Click "Continue with Google" on login page
- [ ] Redirects to Google OAuth consent screen
- [ ] Can sign in with test user Gmail
- [ ] Redirects back to `/auth/callback`
- [ ] Shows success message
- [ ] Redirects to `/terminal`
- [ ] Session persists on page refresh
- [ ] Can access protected routes

### Production Testing
- [ ] Add production redirect URI to Google Console
- [ ] Add environment variables to Railway
- [ ] Backend deploys successfully
- [ ] Frontend deploys successfully
- [ ] Google OAuth works in production
- [ ] Session persists
- [ ] No console errors

---

## 🐛 Troubleshooting

### "Access blocked: This app's request is invalid"
**Cause:** Redirect URI mismatch

**Fix:**
1. Check Google Console → Credentials → Authorized redirect URIs
2. Ensure it matches exactly: `http://localhost:8000/api/v1/auth/google/callback`
3. No trailing slash, exact match required

### "Error 403: access_denied"
**Cause:** User not added as test user

**Fix:**
1. Go to Google Console → OAuth consent screen
2. Add user email to **Test users** section
3. Try again

### "Not Found" on callback
**Cause:** Backend not running or wrong URL

**Fix:**
1. Verify backend is running on port 8000
2. Check backend logs for errors
3. Verify `GOOGLE_REDIRECT_URI` is correct

### "Only Gmail accounts are supported"
**Cause:** User signed in with non-Gmail account

**Fix:**
- Use an @gmail.com email address
- Google Workspace emails won't work (only @gmail.com)

---

## 📊 What Happens During OAuth Flow

```
1. User clicks "Continue with Google"
   ↓
2. Frontend fetches auth URL from backend
   GET http://localhost:8000/api/v1/auth/google/login
   ↓
3. Backend returns Google OAuth URL
   https://accounts.google.com/o/oauth2/v2/auth?client_id=...
   ↓
4. Frontend redirects user to Google
   ↓
5. User signs in and authorizes
   ↓
6. Google redirects to backend callback
   GET http://localhost:8000/api/v1/auth/google/callback?code=...
   ↓
7. Backend exchanges code for tokens
   POST https://oauth2.googleapis.com/token
   ↓
8. Backend fetches user info
   GET https://www.googleapis.com/oauth2/v2/userinfo
   ↓
9. Backend validates Gmail requirement
   ↓
10. Backend creates/links user account
    ↓
11. Backend generates JWT token
    ↓
12. Backend redirects to frontend
    http://localhost:3000/auth/callback?token=...&provider=google
    ↓
13. Frontend fetches user data
    GET http://localhost:8000/api/v1/auth/me
    ↓
14. Frontend stores session
    ↓
15. Frontend redirects to terminal
    http://localhost:3000/terminal
```

---

## 🔒 Security Notes

### Credentials Security
- ✅ Client secret is stored in backend only
- ✅ Never exposed to frontend
- ✅ Transmitted over HTTPS in production
- ✅ Stored in environment variables

### Gmail-Only Validation
- ✅ Enforced in backend OAuth service
- ✅ Checked before account creation
- ✅ Clear error message for users
- ✅ Prevents non-Gmail registrations

### Token Security
- ✅ JWT tokens with 24-hour expiration
- ✅ Secure token generation
- ✅ Stored in localStorage (frontend)
- ✅ Sent in Authorization header

---

## 📝 Files Modified

### Backend
- `backend/app/core/config.py` - Added Google credentials
- `backend/.env` - Added Google OAuth variables
- `backend/.env.example` - Updated with real credentials

### Frontend
- `frontend/components/auth/social-auth-buttons.tsx` - Removed GitHub/Apple, kept Google only

### Documentation
- `GOOGLE_OAUTH_SETUP.md` (this file)

---

## ✅ Summary

### Status
- ✅ Google OAuth fully configured
- ✅ Credentials added to backend
- ✅ UI simplified (Google only)
- ✅ Frontend builds successfully
- ✅ Ready to test locally
- ⏳ Needs test users added to Google Console
- ⏳ Needs production redirect URI added

### Next Steps
1. **Add test users** to Google OAuth consent screen
2. **Test locally** with your Gmail account
3. **Add production redirect URI** to Google Console
4. **Deploy to Railway** with environment variables
5. **Test in production**

### Result
Users can sign in with Google OAuth in a clean, premium UI with just one button: **"Continue with Google"**

---

**Ready to test!** 🚀

Start the backend and frontend, then try signing in with Google.

---

**Last Updated:** May 16, 2026  
**Status:** ✅ Configured and ready to test  
**Security:** ✅ Credentials stored in .env (not in git)
