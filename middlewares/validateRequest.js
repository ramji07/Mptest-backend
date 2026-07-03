const { validationResult } = require('express-validator');

/**
 * Runs after express-validator validation chains.
 * Collects all validation errors and returns a single, uniform response.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      data: { errors: formattedErrors },
    });
  }

  return next();
};

module.exports = validateRequest;
