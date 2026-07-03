require("dotenv").config();
const connectDB = require('./config/db');
const app = require('./app');

const transporter = require("./config/nodemailer");




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


app.get("/test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "ramjee.node@example.com",
      subject: "Test Email",
      text: "Hello server is started and nodemailer is working fine.",
    });

    res.send("Email Sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email Failed");
  }
});
