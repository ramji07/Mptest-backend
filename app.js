const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');




require("dotenv").config();
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { globalLimiter } = require('./middlewares/rateLimiter');
const sanitizeMiddleware = require('./middlewares/sanitize');
const app = express();

app.set("trust proxy", 1); // Trust the first proxy (e.g., if behind a load balancer)

// ---------- Security & Core Middlewares ----------
app.use(helmet());

app.use(
  cors({
    origin: "*",
  })
);

app.use(compression());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
console.log("Morgan logging format:", process.env.NODE_ENV === 'production' ? 'combined' : 'dev');
console.log("Global rate limit:", process.env.RATE_LIMIT_MAX_REQUESTS);
console.log("Auth rate limit:", process.env.AUTH_RATE_LIMIT_MAX_REQUESTS);  

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(sanitizeMiddleware);

// Global rate limiting (sensitive auth routes have their own stricter limiter)
// app.use('/api', globalLimiter);

// ---------- Static files (future profile images) ----------
app.use('/uploads', express.static('uploads'));

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the MPTest API',
    data: { version: '1.0.0' },
  });
});

app.use('/api', routes);

// ---------- Error Handling ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
