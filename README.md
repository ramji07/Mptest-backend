# MPTest Backend

Production-ready Node.js/Express backend for the **MPTest** React Native education app.

## Tech Stack
Node.js · Express.js · MongoDB + Mongoose · JWT · bcryptjs · Nodemailer (Gmail SMTP) · Google OAuth · express-validator · multer · helmet · cors · morgan · compression · express-rate-limit

## Project Structure
```
src/
├── config/        # env, db, nodemailer, google client, multer
├── constants/      # OTP purposes, providers, HTTP status codes
├── controllers/     # request handlers (thin, delegate to services)
├── helpers/        # email templates etc.
├── middlewares/     # auth, error handling, rate limiting, validation, sanitize
├── models/         # Mongoose schemas (User, Otp)
├── routes/         # Express routers
├── services/        # business logic (auth, otp, email, google)
├── utils/          # jwt, asyncHandler, apiResponse, appError, generateOtp
├── validators/       # express-validator chains
├── app.js
└── server.js
```

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```

   - `MONGO_URI` — your MongoDB connection string
   - `JWT_SECRET` — a long, random secret
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — a Gmail address + [App Password](https://myaccount.google.com/apppasswords) (requires 2FA enabled on the Google account)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` — OAuth client IDs from Google Cloud Console for your Expo app

3. Run in development:
   ```bash
   npm run dev
   ```

4. Run in production:
   ```bash
   npm start
   ```

## API Endpoints

All responses follow the shape: `{ success, message, data, token }`.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Validates input, emails a 6-digit OTP. Does **not** create the user yet. |
| POST | `/verify-signup-otp` | Public | Verifies OTP, creates the user, returns JWT (auto-login). |
| POST | `/resend-signup-otp` | Public | Resends a fresh OTP for a pending signup. |
| POST | `/login` | Public | Email + password login. |
| POST | `/google-login` | Public | Accepts a Google `idToken`; logs in or creates the account. |
| POST | `/forgot-password` | Public | Emails a 6-digit OTP for password reset. |
| POST | `/verify-forgot-password-otp` | Public | Verifies OTP, returns a short-lived `resetToken`. |
| POST | `/reset-password` | Public | Resets password using `email` + `resetToken` + `newPassword`. |
| GET | `/me` | Private | Returns the authenticated user's profile. |
| POST | `/logout` | Private | Clears the auth cookie (if used). |

`GET /api/health` — uptime health check (no auth, no DB dependency).

### Auth header
```
Authorization: Bearer <token>
```
JWTs are valid for 30 days by default (`JWT_EXPIRES_IN` in `.env`).

## Security Notes
- Passwords are hashed with bcrypt (12 salt rounds) and never stored in plaintext — including during the signup OTP window, where only the **hash** is temporarily stored.
- OTPs are hashed with bcrypt before being persisted; only the raw OTP is emailed.
- OTP/reset-token documents auto-expire via a MongoDB TTL index (5 minutes by default).
- `helmet`, rate limiting (global + stricter auth-route limiter), request sanitization, and `express-validator` are applied throughout.
- All list/detail responses strip `password` and `__v` via `User.toJSON()`.

## Future Work Hooks Already Wired
- `src/config/multer.js` — disk storage config ready for a `PATCH /api/auth/profile-image` route.
- `src/middlewares/sanitize.js` — lightweight NoSQL-injection guard.
