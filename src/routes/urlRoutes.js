const express = require('express');
const router = express.Router();
const { shortenUrl, redirectToUrl, updateExpiration, getQRCode, getUserUrls } = require('../controllers/urlController');
const { getUrlStatistics, getUserUrlStatistics } = require('../controllers/statisticsController');
const { validateUrlInput } = require('../middleware/validateInput');
const { protect } = require('../middleware/authMiddleware');
const { verifyToken } = require('../utils/authUtils');
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

// GET endpoint to redirect to original URL
router.get('/:shortCode', redirectToUrl);

// GET endpoint to retrieve QR code for a short URL
router.get('/:shortCode/qr', getQRCode);

// Protected endpoints (require authentication)
// PATCH endpoint to update URL expiration
router.patch('/:shortCode/expiration', protect, updateExpiration);

// GET endpoint to get all URLs for the authenticated user
router.get('/user/urls', protect, getUserUrls);

// GET endpoint to get statistics for a specific URL
router.get('/:shortCode/stats', protect, getUrlStatistics);

// GET endpoint to get statistics for all URLs owned by the user
router.get('/user/stats', protect, getUserUrlStatistics);

module.exports = router;
