const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generates a signed JWT for the given user id.
 * Token is valid for 30 days by default (configurable via JWT_EXPIRES_IN).
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws a jsonwebtoken error if invalid/expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
