const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { OTP_PURPOSES } = require('../constants');

/**
 * The Otp collection is a temporary, purpose-driven store used for:
 *  - Signup verification (holds tempSignupData + hashedPassword until OTP is verified)
 *  - Password reset (holds resetToken once OTP has been verified)
 *
 * Documents auto-expire via a TTL index on `expiresAt`, so stale/abandoned
 * flows are cleaned up automatically by MongoDB.
 */
const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      select: false, // OTP hash should never be returned in normal queries
    },
    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSES),
      required: true,
    },
    // Only populated for purpose = SIGNUP
    tempSignupData: {
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
    hashedPassword: {
      type: String,
      default: null,
      select: false,
    },
    // Only populated for purpose = RESET_PASSWORD, after OTP has been verified
    resetToken: {
      type: String,
      default: null,
      select: false,
    },
    // Marks that the OTP step of the flow has been completed
    // (used mainly in the forgot-password flow to gate the reset-password step)
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: MongoDB automatically deletes the document once expiresAt passes
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookups by email + purpose
OtpSchema.index({ email: 1, purpose: 1 });

// Hash the OTP before saving so raw OTPs are never persisted in the DB
OtpSchema.pre('save', async function hashOtp(next) {
  if (!this.isModified('otp')) return next();
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
  return next();
});

// Compare a plaintext OTP against the stored hash
OtpSchema.methods.compareOtp = async function compareOtp(candidateOtp) {
  return bcrypt.compare(candidateOtp, this.otp);
};

// Hash reset tokens the same way (defense in depth, same as OTPs)
OtpSchema.methods.setResetToken = async function setResetToken(rawToken) {
  const salt = await bcrypt.genSalt(10);
  this.resetToken = await bcrypt.hash(rawToken, salt);
};

OtpSchema.methods.compareResetToken = async function compareResetToken(candidateToken) {
  if (!this.resetToken) return false;
  return bcrypt.compare(candidateToken, this.resetToken);
};

module.exports = mongoose.model('Otp', OtpSchema);
