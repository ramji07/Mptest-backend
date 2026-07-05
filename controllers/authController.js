const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');
const { OTP_PURPOSES, HTTP_STATUS } = require('../constants');

const authService = require('../services/authService');
const otpService = require('../services/otpService');
const { verifyGoogleIdToken } = require('../services/googleService');
const Otp = require('../models/Otp');

/**
 * @desc    Step 1 of signup: validate input, stash temp data + hashed
 *          password + OTP, and email the OTP. Does NOT create the user yet.
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  // Collect the registration details entered by the user.
  const { name, email, password } = req.body;

  // Check whether the submitted email is already registered.
  const emailTaken = await authService.isEmailTaken(email);
  if (emailTaken) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash the password before keeping it temporarily for verification.
  const hashedPassword = await authService.hashPassword(password);

  // Save a temporary signup record and send the verification email.
  await otpService.createAndSendOtp({
    email,
    purpose: OTP_PURPOSES.SIGNUP,
    name,
    tempSignupData: { name, email: email.toLowerCase().trim() },
    hashedPassword,
  });

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Signup details saved successfully. Please verify your email.',
    data: { email: email.toLowerCase().trim() },
  });
});

/**
 * @desc    Step 2 of signup: verify OTP, create the user, delete the OTP,
 *          issue a JWT, and log the user in automatically.
 * @route   POST /api/auth/verify-signup-otp
 * @access  Public
 */
const verifySignupOtp = asyncHandler(async (req, res) => {
  // Read the email and OTP submitted for verification.
  const { email, otp } = req.body;

  // Validate the email verification code before creating the account.
  const otpDoc = await otpService.verifyOtp({ email, otp, purpose: OTP_PURPOSES.SIGNUP });

  if (!otpDoc.tempSignupData?.name || !otpDoc.hashedPassword) {
    throw new AppError('Signup session is invalid. Please sign up again.', 400);
  }

  // Guard against a race where the user was somehow created in the meantime
  const emailTaken = await authService.isEmailTaken(otpDoc.email);
  if (emailTaken) {
    await otpService.deleteOtp(otpDoc._id);
    throw new AppError('An account with this email already exists', 409);
  }

  // Save the verified user data to the database.
  const user = await authService.createLocalUser({
    name: otpDoc.tempSignupData.name,
    email: otpDoc.email,
    hashedPassword: otpDoc.hashedPassword,
  });

  // Remove the temporary OTP record after the record is saved.
  await otpService.deleteOtp(otpDoc._id);

  const token = generateToken(user._id);

  return sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: 'Account created successfully. You can now log in.',
    data: { user },
    token,
  });
});

/**
 * @desc    Resend a signup OTP (e.g. if the original expired or was lost).
 * @route   POST /api/auth/resend-signup-otp
 * @access  Public
 */
const resendSignupOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existing = await Otp.findOne({ email: email.toLowerCase().trim(), purpose: OTP_PURPOSES.SIGNUP }).select(
    '+hashedPassword'
  );

  if (!existing) {
    throw new AppError('No pending signup found for this email. Please sign up again.', 400);
  }

  await otpService.createAndSendOtp({
    email,
    purpose: OTP_PURPOSES.SIGNUP,
    name: existing.tempSignupData?.name,
    tempSignupData: existing.tempSignupData,
    hashedPassword: existing.hashedPassword,
  });

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'OTP sent successfully',
    data: { email: email.toLowerCase().trim() },
  });
});

/**
 * @desc    Login with email + password.
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.findUserByEmailWithPassword(email);
  if (!user || user.provider !== 'local') {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Login successful',
    data: { user },
    token,
  });
});

/**
 * @desc    Login or register via Google Sign-In (Expo / React Native).
 * @route   POST /api/auth/google-login
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  const profile = await verifyGoogleIdToken(idToken);

  const { user, isNewUser } = await authService.findOrCreateGoogleUser(profile);

  const token = generateToken(user._id);

  return sendResponse(res, {
    statusCode: isNewUser ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
    message: isNewUser ? 'Account created and logged in successfully' : 'Login successful',
    data: { user },
    token,
  });
});

/**
 * @desc    Step 1 of forgot password: send an OTP to the user's email.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await authService.findUserByEmailWithPassword(email);
  if (!user) {
    throw new AppError('No account found with this email address', 404);
  }

  if (user.provider !== 'local') {
    throw new AppError(`This account uses ${user.provider} sign-in. Password reset is not applicable.`, 400);
  }

  await otpService.createAndSendOtp({
    email,
    purpose: OTP_PURPOSES.RESET_PASSWORD,
    name: user.name,
  });

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'OTP sent successfully',
    data: { email: email.toLowerCase().trim() },
  });
});

/**
 * @desc    Step 2 of forgot password: verify OTP and issue a short-lived
 *          reset token the client must present to actually reset the password.
 * @route   POST /api/auth/verify-forgot-password-otp
 * @access  Public
 */
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpDoc = await otpService.verifyOtp({ email, otp, purpose: OTP_PURPOSES.RESET_PASSWORD });

  const resetToken = await otpService.issueResetToken(otpDoc);

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'OTP verified successfully',
    data: { email: otpDoc.email, resetToken },
  });
});

/**
 * @desc    Step 3 of forgot password: reset the password using the
 *          reset token issued after OTP verification, then delete the OTP.
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  const otpDoc = await otpService.verifyResetToken({ email, resetToken });

  const user = await authService.findUserByEmailWithPassword(email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await authService.updateUserPassword(user._id, newPassword);
  await otpService.deleteOtp(otpDoc._id);

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
    data: null,
  });
});

/**
 * @desc    Get the currently authenticated user's profile.
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'User fetched successfully',
    data: { user: req.user },
  });
});

/**
 * @desc    Logout — clears the auth cookie if one was set.
 *          (Stateless JWTs remain valid until expiry; client should also
 *          discard the token from storage.)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');

  return sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

module.exports = {
  signup,
  verifySignupOtp,
  resendSignupOtp,
  login,
  googleLogin,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  getMe,
  logout,
};
