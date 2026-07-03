const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { PROVIDERS } = require('../constants');

/**
 * Checks whether an email is already registered as a fully-created user.
 */
const isEmailTaken = async (email) => {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  return !!existing;
};

/**
 * Hashes a plaintext password with bcrypt (used before temporarily
 * storing it on the Otp document during signup, so no plaintext
 * password ever touches the database).
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Creates a new local user from verified signup OTP data.
 * The password is already hashed at this point, so we set it directly
 * and skip re-hashing in the pre-save hook.
 */
const createLocalUser = async ({ name, email, hashedPassword }) => {
  const user = new User({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    provider: PROVIDERS.LOCAL,
    isVerified: true,
    lastLogin: new Date(),
  });

  // Prevent the pre-save hook from re-hashing an already-hashed password
  user.$locals.skipPasswordHash = true;

  await user.save();
  return user;
};

/**
 * Finds a user by email including the password field (needed for login).
 */
const findUserByEmailWithPassword = async (email) => {
  return User.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

/**
 * Finds or creates a user from verified Google profile data.
 */
const findOrCreateGoogleUser = async ({ googleId, email, name, profileImage }) => {
  const normalizedEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Link Google identity to an existing account if not already linked
    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = googleId;
      shouldSave = true;
    }
    if (!user.profileImage && profileImage) {
      user.profileImage = profileImage;
      shouldSave = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    user.lastLogin = new Date();
    shouldSave = true;

    if (shouldSave) await user.save({ validateBeforeSave: false });

    return { user, isNewUser: false };
  }

  user = await User.create({
    name,
    email: normalizedEmail,
    provider: PROVIDERS.GOOGLE,
    googleId,
    profileImage,
    isVerified: true,
    lastLogin: new Date(),
  });

  return { user, isNewUser: true };
};

/**
 * Updates a user's password (used at the end of the forgot-password flow).
 * Relies on the pre-save hook to hash the new plaintext password.
 */
const updateUserPassword = async (userId, newPlainPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.password = newPlainPassword;
  await user.save();
  return user;
};

module.exports = {
  isEmailTaken,
  hashPassword,
  createLocalUser,
  findUserByEmailWithPassword,
  findOrCreateGoogleUser,
  updateUserPassword,
};
