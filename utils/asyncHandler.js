/**
 * Wraps async controller functions to automatically forward
 * rejected promises / thrown errors to Express's error middleware.
 * Avoids repetitive try/catch blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
