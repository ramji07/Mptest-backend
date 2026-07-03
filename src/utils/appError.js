/**
 * Custom operational error class.
 * Use this for all predictable/handled errors (validation, auth, not found, etc.)
 * so the global error handler can distinguish them from unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.success = false;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
