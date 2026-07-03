/**
 * Sends a uniform API response shape across the whole application:
 * { success, message, data, token }
 */
const sendResponse = (res, { statusCode = 200, success = true, message = '', data = null, token = null }) => {
  const body = { success, message };

  // Only include keys when relevant, but always keep the required shape
  body.data = data;
  if (token) {
    body.token = token;
  }

  return res.status(statusCode).json(body);
};

module.exports = sendResponse;
