/**
 * Input Sanitization Middleware
 * Defends against Cross-Site Scripting (XSS) and script injection
 * across req.body, req.query, and req.params.
 */

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      // Remove explicit <script> tags and enclosed script content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove inline event handlers (e.g. onerror=, onclick=, onload=)
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      // Remove javascript: pseudoprotocol
      .replace(/javascript\s*:/gi, '')
      // Sanitize raw HTML tags while allowing standard punctuation
      .replace(/<[^>]*>?/gm, '');
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitizedObj = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeValue(value[key]);
    }
    return sanitizedObj;
  }

  return value;
}

export const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

export default sanitizeInputs;
