const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { PROVIDERS } = require('../constants');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be under 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      // Not required for Google-provider accounts
      required: function () {
        return this.provider === PROVIDERS.LOCAL;
      },
      select: false, // never returned by default in queries
      minlength: [6, 'Password must be at least 6 characters'],
    },
    provider: {
      type: String,
      enum: Object.values(PROVIDERS),
      default: PROVIDERS.LOCAL,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Hash password before saving, only if it has been modified.
// `skipPasswordHash` is an explicit escape hatch for flows (like signup-via-OTP)
// where the password has already been hashed upstream and must not be re-hashed.
UserSchema.pre('save', async function hashPassword(next) {
  if (this.$locals.skipPasswordHash) {
    return next();
  }

  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Instance method to compare a plaintext password against the stored hash
UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields whenever a user document is serialized to JSON
UserSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
