const transporter = require('../config/nodemailer');
require("dotenv").config();
const otpEmailTemplate = require('../helpers/otpEmailTemplate');
const AppError = require('../utils/appError');

/**
 * Sends an OTP email via Gmail SMTP.
 * Throws an AppError if the email fails to send, so calling code
 * (controllers/services) can roll back or respond appropriately.
 */
const sendOtpEmail = async ({ to, name, otp, purpose, expiryMinutes = process.env.OTP_EXPIRY_MINUTES }) => {
  const subject =
    purpose === 'reset_password' ? 'MPTest - Password Reset Code' : 'MPTest - Email Verification Code';

  const html = otpEmailTemplate({ name, otp, purpose, expiryMinutes });

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

   
  } catch (error) {
    console.error('[MAILER] Failed to send OTP email:', error.message);
    throw new AppError('Failed to send OTP email. Please try again later.', 500);
  }
};

module.exports = { sendOtpEmail };
