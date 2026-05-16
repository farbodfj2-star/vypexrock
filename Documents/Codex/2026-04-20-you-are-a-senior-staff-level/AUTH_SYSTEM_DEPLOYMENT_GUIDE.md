# Vypexrock Authentication System - Deployment Guide

## 🎯 Overview

This guide covers deploying the production-grade authentication system with:
- ✅ Gmail-only registration with email verification
- ✅ Secure password reset with 6-digit codes
- ✅ Social login buttons (Google, GitHub, Apple, Email)
- ✅ OAuth infrastructure (ready for implementation)
- ✅ Phone verification (SMS ready)
- ✅ Bcrypt password hashing
- ✅ Rate limiting and account lockout
- ✅ Security best practices

---

## 📋 Prerequisites

### Required
- PostgreSQL database
- Redis (for rate limiting)
- SMTP server (Gmail, SendGrid, AWS SES, etc.)

### Optional (for full OAuth)
- Google OAuth credentials
- GitHub OAuth credentials
- Apple ID credentials
- Twilio/Firebase for SMS

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/vypexrock
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMTP Configuration (Required for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=security@vypexrock.com
SMTP_FROM_NAME=Vypexrock Security
SMTP_USE_TLS=true

# OAuth - Google (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback

# OAuth - GitHub (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://your-domain.com/api/v1/auth/github/callback

# OAuth - Apple (Optional)
APPLE_CLIENT_ID=com.vypexrock.service
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/apple/callback

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=10
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30

# Token Expiration
EMAIL_VERIFICATION_EXPIRE_MINUTES=60
PASSWORD_RESET_EXPIRE_MINUTES=15
PHONE_VERIFICATION_EXPIRE_MINUTES=10
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 🚀 Deployment Steps

### 1. Run Database Migration

```bash
cd backend
alembic upgrade head
```

This creates all new columns:
- `email_verified`, `email_verification_token_hash`, `email_verification_expires_at`
- `password_reset_token_hash`, `password_reset_expires_at`
- `auth_provider`, `google_id`, `github_id`, `apple_id`
- `phone_number`, `phone_verified`, `phone_verification_code_hash`, `phone_verification_expires_at`
- `last_login_at`, `failed_login_attempts`, `account_locked_until`

### 2. Configure SMTP (Gmail Example)

#### Using Gmail:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Use in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

#### Using SendGrid:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Using AWS SES:
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

### 3. Test Email Sending

```bash
# In development, verification codes are printed to console
# Check backend logs for: [DEV] Email verification code for user@gmail.com: 123456
```

### 4. Deploy Backend

#### Railway:
```bash
# Push to GitHub
git add .
git commit -m "feat: Add production-grade auth system"
git push origin main

# Railway will auto-deploy
# Add environment variables in Railway dashboard
```

#### Manual:
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Deploy Frontend

#### Vercel:
```bash
cd frontend
npm run build
# Push to GitHub - Vercel auto-deploys
```

#### Manual:
```bash
cd frontend
npm install
npm run build
npm start
```

---

## 🔐 OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Configure:
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/v1/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

### Apple ID

1. Go to [Apple Developer](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Create a new Services ID
4. Enable "Sign in with Apple"
5. Configure domains and return URLs
6. Create a private key for Sign in with Apple
7. Copy credentials to `.env`

---

## 🧪 Testing

### 1. Test Registration (Gmail Only)

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "SecurePass123",
    "full_name": "Test User"
  }'
```

Expected: 201 Created + verification email sent

### 2. Test Email Verification

```bash
# Request code
curl -X POST http://localhost:8000/api/v1/auth/verify-email/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'

# Verify with code
curl -X POST http://localhost:8000/api/v1/auth/verify-email/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "code": "123456"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "SecurePass123"
  }'
```

Expected: JWT token

### 4. Test Password Reset

```bash
# Request reset
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'

# Reset with code
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "code": "123456",
    "new_password": "NewSecurePass123"
  }'
```

### 5. Test Non-Gmail Rejection

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yahoo.com",
    "password": "SecurePass123"
  }'
```

Expected: 400 Bad Request - "Currently only Gmail accounts are supported"

---

## 🔒 Security Features

### Implemented

✅ **Bcrypt password hashing** (12 rounds)
✅ **Rate limiting** (10 requests/minute configurable)
✅ **Account lockout** (5 failed attempts → 30 min lockout)
✅ **Secure token generation** (cryptographically secure)
✅ **Token expiration** (email: 60min, password: 15min, phone: 10min)
✅ **One-way token hashing** (tokens stored as bcrypt hashes)
✅ **Gmail-only validation** (frontend + backend + database)
✅ **CSRF protection** (via JWT)
✅ **Secure cookies** (httpOnly, secure, sameSite)

### Best Practices

- Passwords never stored in plain text
- Tokens never stored in plain text
- Failed login attempts tracked
- Account lockout prevents brute force
- Generic error messages (don't reveal if email exists)
- Verification codes expire
- Old reset tokens invalidated after use

---

## 📊 Database Schema

### New Columns in `users` table:

```sql
-- Email verification
email_verified BOOLEAN DEFAULT FALSE
email_verification_token_hash VARCHAR(255)
email_verification_expires_at TIMESTAMP WITH TIME ZONE

-- Password reset
password_reset_token_hash VARCHAR(255)
password_reset_expires_at TIMESTAMP WITH TIME ZONE

-- OAuth
auth_provider VARCHAR(50) DEFAULT 'email'
google_id VARCHAR(255)
github_id VARCHAR(255)
apple_id VARCHAR(255)

-- Phone verification
phone_number VARCHAR(20)
phone_verified BOOLEAN DEFAULT FALSE
phone_verification_code_hash VARCHAR(255)
phone_verification_expires_at TIMESTAMP WITH TIME ZONE

-- Security
last_login_at TIMESTAMP WITH TIME ZONE
failed_login_attempts INTEGER DEFAULT 0
account_locked_until TIMESTAMP WITH TIME ZONE
```

---

## 🎨 Frontend Routes

### New Pages

- `/verify-email` - Email verification with code input
- `/login` - Login with social auth buttons
- `/register` - Register with social auth buttons
- `/forgot-password` - Password reset (existing, enhanced)

### Social Auth Flow

1. User clicks "Continue with Google"
2. Frontend calls `/api/v1/auth/google/login`
3. Backend returns OAuth URL
4. User redirects to Google
5. Google redirects back to `/api/v1/auth/google/callback`
6. Backend creates/logs in user
7. Frontend receives JWT token

---

## 🐛 Troubleshooting

### Email not sending

**Check:**
1. SMTP credentials are correct
2. App password (not regular password) for Gmail
3. 2FA enabled for Gmail
4. Firewall allows port 587
5. Check backend logs for errors

**Test SMTP:**
```python
import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg["Subject"] = "Test"
msg["From"] = "your-email@gmail.com"
msg["To"] = "test@gmail.com"
msg.set_content("Test email")

with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
    smtp.starttls()
    smtp.login("your-email@gmail.com", "your-app-password")
    smtp.send_message(msg)
```

### OAuth not working

**Check:**
1. Client ID and Secret are correct
2. Redirect URI matches exactly (including https://)
3. OAuth app is not in testing mode (for production)
4. Scopes are correct

### Account locked

**Reset manually:**
```sql
UPDATE users 
SET failed_login_attempts = 0, account_locked_until = NULL 
WHERE email = 'user@gmail.com';
```

---

## 📈 Monitoring

### Key Metrics to Track

- Registration success rate
- Email verification rate
- Login success rate
- Failed login attempts
- Account lockouts
- Password reset requests
- OAuth usage by provider

### Logs to Monitor

```
[INFO] User registered: user@gmail.com
[INFO] Email verification sent: user@gmail.com
[INFO] Email verified: user@gmail.com
[INFO] Login successful: user@gmail.com
[WARNING] Failed login attempt: user@gmail.com (3/5)
[WARNING] Account locked: user@gmail.com
[INFO] Password reset requested: user@gmail.com
[INFO] Password reset successful: user@gmail.com
```

---

## 🚦 Production Checklist

### Before Launch

- [ ] Run database migration
- [ ] Configure SMTP with production credentials
- [ ] Set strong SECRET_KEY
- [ ] Enable rate limiting
- [ ] Test email sending
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test password reset
- [ ] Test Gmail validation
- [ ] Test account lockout
- [ ] Configure OAuth (if using)
- [ ] Update CORS origins
- [ ] Set up monitoring/logging
- [ ] Test on staging environment

### After Launch

- [ ] Monitor error logs
- [ ] Check email delivery rates
- [ ] Monitor failed login attempts
- [ ] Track registration conversions
- [ ] Monitor OAuth usage
- [ ] Set up alerts for high failure rates

---

## 📞 Support

For issues or questions:
1. Check backend logs: `docker logs vypexrock-api`
2. Check frontend logs: Browser console
3. Review this guide
4. Check environment variables
5. Test SMTP connection

---

**Status**: ✅ Production-ready authentication system deployed
**Last Updated**: May 16, 2026
