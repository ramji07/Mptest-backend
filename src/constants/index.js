const OTP_PURPOSES = Object.freeze({
  SIGNUP: 'signup',
  RESET_PASSWORD: 'reset_password',
});

const PROVIDERS = Object.freeze({
  LOCAL: 'local',
  GOOGLE: 'google',
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
});

module.exports = { OTP_PURPOSES, PROVIDERS, HTTP_STATUS };
