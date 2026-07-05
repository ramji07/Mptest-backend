const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS),

  standardHeaders: true,
  legacyHeaders: false,

  validate: {
    xForwardedForHeader: false,
  },

  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
    data: null,
  },
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS),

  standardHeaders: true,
  legacyHeaders: false,

  validate: {
    xForwardedForHeader: false,
  },

  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
    data: null,
  },
});

module.exports = { globalLimiter, authLimiter };