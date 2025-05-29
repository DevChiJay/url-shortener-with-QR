const rateLimit = require('express-rate-limit');

// Create rate limiters for different routes
const redirectRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 30 requests per hour
  message: {
    success: false,
    message: 'Too many redirect requests. Please try again later.'
  },
  standardHeaders: true, // Send standard rate limit headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 contact requests per hour
  message: {
    success: false,
    message: 'Too many contact requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  redirectRateLimiter,
  contactRateLimiter,
  registerRateLimiter,
  loginRateLimiter
};
