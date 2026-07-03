const rateLimit = require('express-rate-limit');
require("dotenv").config();

/**
 * General-purpose limiter applied to the whole API.
 */
const globalLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    data: null,
  },
});

/**
 * Stricter limiter for sensitive auth endpoints (signup, login, OTP,
 * forgot/reset password) to mitigate brute force and OTP-spam abuse.
 */
const authLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
    data: null,
  },
});

module.exports = { globalLimiter, authLimiter };
