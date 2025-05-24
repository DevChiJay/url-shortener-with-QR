const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const { createShortUrl, getUrlByShortCode, incrementClickCount, updateUrlExpiration } = require('../services/shortenerService');
const Url = require('../models/Url'); // Import the Url model

/**
 * Create a shortened URL and QR code
 * @route POST /api/url/shorten
 * @access Public/Private (based on if user is authenticated)
 */
const shortenUrl = async (req, res) => {
  try {
    const { url, expirationDays, description, domain } = req.validatedData;
    
    // Get base URL from request or environment variable
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Get user ID if user is authenticated
    const userId = req.user ? req.user.id : null;
    
    // If domain is provided, ensure user is authenticated
    if (domain && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to use custom domains'
      });
    }
    
    // Create short URL and QR code with expiration
    const result = await createShortUrl(url, baseUrl, expirationDays, description, domain, userId);
    
    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        originalUrl: result.originalUrl,
        shortUrl: `${baseUrl}/${result.shortCode}`,
        shortCode: result.shortCode,
        description: result.description,
        domain: result.domain,
        userId: result.userId,
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

const { recordClick } = require('../services/statisticsService');

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
    
    // Extract information for statistics
    const address = req.get('x-forwarded-for') || req.ip;
    const referrer = req.get('referer') || 'Direct';
    const userAgent = req.get('user-agent') || '';

  const client = address.split(",")[0].trim();

  // Parse the user agent string
  const parser = new UAParser();
  const ua = parser.setUA(userAgent).getResult();
  const geo = geoip.lookup(client);
    
  const browser = ua.browser.name || 'Unknown';
  const country = geo ? geo.country : 'Unknown';
    
    // Record click statistics asynchronously (don't wait for it to complete)
    recordClick(shortCode, { referrer, browser, country }).catch(err => {
      console.error('Error recording click statistics:', err);
    });
    
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
 * @access Private
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
    
    // Get the URL document first to check ownership
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }
    
    // Check if the URL belongs to the authenticated user
    if (urlDoc.userId && urlDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this URL'
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

/**
 * Get all URLs for the authenticated user
 * @route GET /api/url/user/urls
 * @access Private
 */
const getUserUrls = async (req, res) => {
  try {
    // Fetch all URLs belonging to the authenticated user
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: urls.length,
      data: urls
    });
  } catch (error) {
    console.error('Error in getUserUrls controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user URLs',
      error: error.message
    });
  }
};

module.exports = {
  shortenUrl,
  redirectToUrl,
  updateExpiration,
  getQRCode,
  getUserUrls
};
