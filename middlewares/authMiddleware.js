const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT, sent either as:
 *   Authorization: Bearer <token>
 * or as an httpOnly cookie named "token".
 * Attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new AppError('Not authorized. Please log in to access this resource.', 401);
  }

  const decoded = verifyToken(token); // throws if invalid/expired -> caught by asyncHandler

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
