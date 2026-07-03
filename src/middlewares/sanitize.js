/**
 * Lightweight recursive sanitizer to strip keys containing "$" or "."
 * from request bodies/params/query — a minimal defense against
 * NoSQL injection without adding an extra dependency.
 */
const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeObject);
    return obj;
  }

  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.includes('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        sanitizeObject(obj[key]);
      } else {
        sanitizeObject(obj[key]);
      }
    });
  }

  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
};

module.exports = sanitizeMiddleware;
