require("dotenv").config();
const connectDB = require('./config/db');

const app = require('./app');
const transporter = require("./config/nodemailer");

// const dns = require("dns");



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


// console.log("Node:", process.version);
// console.log("MONGO_URI:", process.env.MONGO_URI);
// console.log("PORT:", process.env.PORT);


// dns.resolveSrv("_mongodb._tcp.cluster0.9ns0ku6.mongodb.net", (err, addresses) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log(addresses);
//   }
// });

startServer();


