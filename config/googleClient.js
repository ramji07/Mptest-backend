const { OAuth2Client } = require('google-auth-library');
const env = require('./env');

/**
 * Google OAuth2 client used to verify ID tokens sent from the
 * React Native (Expo) app after a successful Google Sign-In.
 */
const googleClient = new OAuth2Client();

// All client IDs the app may issue tokens for (web/expo, android, ios)
const GOOGLE_AUDIENCE = [
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_ANDROID_CLIENT_ID,
  env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);

module.exports = { googleClient, GOOGLE_AUDIENCE };
