const env = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
  await connectDB();

  const server = app.listen(process.env.PORT, () => {
    console.log(`[SERVER] MPTest API running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
  });

  // Gracefully handle unexpected errors instead of crashing silently
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down...', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION] Shutting down...', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
  });
};

startServer();
