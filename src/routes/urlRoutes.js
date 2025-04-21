const express = require('express');
const router = express.Router();
const { shortenUrl, redirectToUrl, updateExpiration, getQRCode } = require('../controllers/urlController');
const { validateUrlInput } = require('../middleware/validateInput');

// POST endpoint to create a shortened URL
router.post('/shorten', validateUrlInput, shortenUrl);

// PATCH endpoint to update URL expiration
router.patch('/:shortCode/expiration', updateExpiration);

// GET endpoint to retrieve QR code for a short URL
router.get('/:shortCode/qr', getQRCode);

// GET endpoint to redirect to original URL
router.get('/:shortCode', redirectToUrl);

module.exports = router;
