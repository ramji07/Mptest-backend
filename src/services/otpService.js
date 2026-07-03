const crypto = require('crypto');
const Otp = require('../models/Otp');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('./emailService');
const env = require('../config/env');
const AppError = require('../utils/appError');
const { OTP_PURPOSES } = require('../constants');

/**
 * Creates (or replaces) an OTP record for a given email + purpose,
 * then emails the raw OTP to the user. Only the hashed OTP is persisted.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.purpose - one of OTP_PURPOSES
 * @param {string} [params.name] - used for the email greeting
 * @param {Object} [params.tempSignupData] - { name, email } for signup flow
 * @param {string} [params.hashedPassword] - pre-hashed password for signup flow
 */
const createAndSendOtp = async ({ email, purpose, name, tempSignupData, hashedPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const rawOtp = generateOtp();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove any existing OTP for this email + purpose so only one is ever active
  await Otp.deleteMany({ email: normalizedEmail, purpose });

  const otpDoc = new Otp({
    email: normalizedEmail,
    otp: rawOtp, // will be hashed by the pre-save hook
    purpose,
    expiresAt,
    tempSignupData: purpose === OTP_PURPOSES.SIGNUP ? tempSignupData : undefined,
    hashedPassword: purpose === OTP_PURPOSES.SIGNUP ? hashedPassword : undefined,
  });

  await otpDoc.save();

  await sendOtpEmail({
    to: normalizedEmail,
    name: name || tempSignupData?.name || 'there',
    otp: rawOtp,
    purpose,
    expiryMinutes: env.OTP_EXPIRY_MINUTES,
  });

  return otpDoc;
};

/**
 * Finds and validates an OTP record: existence, expiry, and hash match.
 * Returns the Mongoose document (with select:false fields included)
 * on success, or throws an AppError on any failure.
 */
const verifyOtp = async ({ email, otp, purpose }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await Otp.findOne({ email: normalizedEmail, purpose }).select(
    '+otp +hashedPassword +resetToken'
  );

  if (!otpDoc) {
    throw new AppError('OTP not found or already used. Please request a new one.', 400);
  }

  if (otpDoc.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const isMatch = await otpDoc.compareOtp(otp);
  if (!isMatch) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  return otpDoc;
};

/**
 * Generates a secure, random reset token, stores its hash on the OTP
 * document (marking it verified), and returns the RAW token to send
 * back to the client for the final reset-password step.
 */
const issueResetToken = async (otpDoc) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await otpDoc.setResetToken(rawToken);
  otpDoc.isVerified = true;
  await otpDoc.save();
  return rawToken;
};

/**
 * Validates a reset token against a stored, verified OTP document
 * for the given email + RESET_PASSWORD purpose.
 */
const verifyResetToken = async ({ email, resetToken }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await Otp.findOne({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.RESET_PASSWORD,
    isVerified: true,
  }).select('+resetToken');

  if (!otpDoc) {
    throw new AppError('Reset session not found or not verified. Please restart the password reset process.', 400);
  }

  if (otpDoc.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new AppError('Reset session has expired. Please restart the password reset process.', 400);
  }

  const isMatch = await otpDoc.compareResetToken(resetToken);
  if (!isMatch) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  return otpDoc;
};

const deleteOtp = async (otpId) => {
  await Otp.deleteOne({ _id: otpId });
};

module.exports = {
  createAndSendOtp,
  verifyOtp,
  issueResetToken,
  verifyResetToken,
  deleteOtp,
};
