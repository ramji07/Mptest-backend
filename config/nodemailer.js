const nodemailer = require('nodemailer');
const env = require('./env');

/**
 * Gmail SMTP transporter using an App Password.
 * Docs: https://support.google.com/mail/answer/185833
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter connectivity on boot (non-blocking)
transporter.verify((error) => {
  if (error) {
    console.error('[MAILER] SMTP configuration error:', error.message);
  } else {
    console.log('[MAILER] SMTP server is ready to send emails');
  }
});

module.exports = transporter;
