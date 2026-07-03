const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

const {
  signupValidator,
  verifySignupOtpValidator,
  resendOtpValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  verifyForgotPasswordOtpValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

// ---------- Signup (OTP-based) ----------
router.post('/signup', authLimiter, signupValidator, validateRequest, authController.signup);
router.post(
  '/verify-signup-otp',
  authLimiter,
  verifySignupOtpValidator,
  validateRequest,
  authController.verifySignupOtp
);
router.post('/resend-signup-otp', authLimiter, resendOtpValidator, validateRequest, authController.resendSignupOtp);

// ---------- Login ----------
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/google-login', authLimiter, googleLoginValidator, validateRequest, authController.googleLogin);

// ---------- Forgot / Reset Password ----------
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  validateRequest,
  authController.forgotPassword
);
router.post(
  '/verify-forgot-password-otp',
  authLimiter,
  verifyForgotPasswordOtpValidator,
  validateRequest,
  authController.verifyForgotPasswordOtp
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidator,
  validateRequest,
  authController.resetPassword
);

// ---------- Authenticated ----------
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
