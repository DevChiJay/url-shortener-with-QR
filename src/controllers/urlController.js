const { createShortUrl, getUrlByShortCode, incrementClickCount, updateUrlExpiration } = require('../services/shortenerService');

/**
 * Create a shortened URL and QR code
 * @route POST /api/url/shorten
 * @access Public
 */
const shortenUrl = async (req, res) => {
  try {
    const { url, expirationDays } = req.validatedData;
    
    // Get base URL from request or environment variable
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Create short URL and QR code with expiration
    const result = await createShortUrl(url, baseUrl, expirationDays);
    
    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        originalUrl: result.originalUrl,
        shortUrl: `${baseUrl}/${result.shortCode}`,
        shortCode: result.shortCode,
        qrCode: result.qrCode,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in shortenUrl controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating shortened URL',
      error: error.message
    });
  }
};

/**
 * Redirect to original URL from short code
 * @route GET /:shortCode
 * @access Public
 */
const redirectToUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Get URL document by short code
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }
    
    // Increment click count
    await incrementClickCount(shortCode);
    
    // Redirect to original URL
    return res.redirect(urlDoc.originalUrl);
  } catch (error) {
    console.error('Error in redirectToUrl controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while redirecting',
      error: error.message
    });
  }
};

/**
 * Update URL expiration
 * @route PATCH /api/url/:shortCode/expiration
 * @access Public
 */
const updateExpiration = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { expirationDays } = req.body;
    
    if (!expirationDays || typeof expirationDays !== 'number' || expirationDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid expiration days required (positive number)'
      });
    }
    
    const updatedUrl = await updateUrlExpiration(shortCode, expirationDays);
    
    if (!updatedUrl) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or already expired'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        shortCode: updatedUrl.shortCode,
        expiresAt: updatedUrl.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in updateExpiration controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating expiration',
      error: error.message
    });
  }
};

/**
 * Get QR code for a short URL
 * @route GET /api/url/:shortCode/qr
 * @access Public
 */
const getQRCode = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Get URL document by short code
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }
    
    // The QR code is already stored as a base64 data URL in the database
    // Extract the actual base64 data by removing the prefix
    const qrCodeData = urlDoc.qrCode;
    const base64Data = qrCodeData.replace(/^data:image\/png;base64,/, '');
    
    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${shortCode}.png"`);
    
    // Send the QR code as a buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    return res.send(imageBuffer);
  } catch (error) {
    console.error('Error retrieving QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving QR code',
      error: error.message
    });
  }
};

module.exports = {
  shortenUrl,
  redirectToUrl,
  updateExpiration,
  getQRCode
};
