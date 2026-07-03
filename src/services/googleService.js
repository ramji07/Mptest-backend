const { googleClient, GOOGLE_AUDIENCE } = require('../config/googleClient');
const AppError = require('../utils/appError');

/**
 * Verifies a Google ID token (issued to the Expo/React Native client)
 * and returns the relevant profile fields.
 */
const verifyGoogleIdToken = async (idToken) => {
  if (!idToken) {
    throw new AppError('Google idToken is required', 400);
  }

  if (GOOGLE_AUDIENCE.length === 0) {
    throw new AppError('Google Sign-In is not configured on the server', 500);
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_AUDIENCE,
    });
  } catch (error) {
    throw new AppError('Invalid or expired Google token', 401);
  }

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new AppError('Unable to retrieve Google account details', 401);
  }

  if (!payload.email_verified) {
    throw new AppError('Google email is not verified', 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    profileImage: payload.picture || null,
  };
};

module.exports = { verifyGoogleIdToken };
