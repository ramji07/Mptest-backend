const crypto = require('crypto');
require("dotenv").config();

/**
 * Generates a numeric OTP of configurable length (default 6 digits)
 * using a cryptographically secure random source.
 */
const generateOtp = (length = process.env.OTP_LENGTH) => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i += 1) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }

  return otp;
};

module.exports = generateOtp;
