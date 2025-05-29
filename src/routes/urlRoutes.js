const express = require('express');
const router = express.Router();
const { shortenUrl, redirectToUrl, updateUrl, getQRCode, getUserUrls, deleteUrl } = require('../controllers/urlController');
const { getUrlStatistics, getUserUrlStatistics } = require('../controllers/statisticsController');
const contactUs = require("../controllers/contact.controller");
const { validateUrlInput } = require('../middleware/validateInput');
const { protect } = require('../middleware/authMiddleware');
const { verifyToken } = require('../utils/authUtils');
const { redirectRateLimiter, contactRateLimiter } = require('../middleware/rateLimitMiddleware');
const User = require('../models/User');

// Public endpoints
// POST endpoint to create a shortened URL (works with or without authentication)
router.post('/shorten', validateUrlInput, (req, res, next) => {
  // Try to authenticate but continue even if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      if (decoded) {
        User.findById(decoded.id)
          .then(user => {
            if (user) {
              req.user = {
                id: user._id,
                name: user.name,
                email: user.email,
              };
            }
            next();
          })
          .catch(() => next()); // Continue even if error
      } else {
        next();
      }
    } catch (error) {
      next(); // Continue even if error
    }
  } else {
    next(); // No token, continue anonymously
  }
}, shortenUrl);

// GET endpoint to redirect to original URL (rate limited)
router.get('/:shortCode', redirectRateLimiter, redirectToUrl);

// GET endpoint to retrieve QR code for a short URL
router.get('/:shortCode/qr', getQRCode);

// Protected endpoints (require authentication)
// PATCH endpoint to update URL properties
router.patch('/:shortCode', protect, updateUrl);

// DELETE endpoint to delete a URL
router.delete('/:shortCode', protect, deleteUrl);

// GET endpoint to get all URLs for the authenticated user
router.get('/user/urls', protect, getUserUrls);

// GET endpoint to get statistics for a specific URL
router.get('/:shortCode/stats', protect, getUrlStatistics);

// GET endpoint to get statistics for all URLs owned by the user
router.get('/user/stats', protect, getUserUrlStatistics);

// Apply rate limiting to contact us endpoint
router.post("/contact", contactRateLimiter, contactUs);

module.exports = router;
