const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const User = require('../models/User'); // Import the User model

const { createShortUrl, getUrlByShortCode, incrementClickCount, findByOriginalUrl } = require('../services/shortenerService');
const Url = require('../models/Url'); // Import the Url model
const Statistics = require('../models/Statistics'); // Import the Statistics model

/**
 * Create a shortened URL and QR code
 * @route POST /api/url/shorten
 * @access Public/Private (based on if user is authenticated)
 */
const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, expirationDays, description, domain, customSlug } = req.validatedData;
    
    // Get base URL from request or environment variable
    // const baseUrl = `${req.protocol}://${req.get('host')}`;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Get user ID if user is authenticated
    const userId = req.user ? req.user.id : null;

    // Check if the URL has been shortened before
    const existingUrl = await findByOriginalUrl(originalUrl, userId);
    
    if (existingUrl) {
      // If URL already exists, return the existing details
      return res.status(200).json({
        success: true,
        message: 'URL has already been shortened',
        data: {
          originalUrl: existingUrl.originalUrl,
          shortUrl: `${baseUrl}/${existingUrl.shortCode}`,
          shortCode: existingUrl.shortCode,
          description: existingUrl.description,
          domain: existingUrl.domain,
          userId: existingUrl.userId,
          qrCode: existingUrl.qrCode,
          expiresAt: existingUrl.expiresAt,
          clicks: existingUrl.clicks
        }
      });
    }

    // If user is authenticated, check their plan and URL limit
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.plan === 'free') {
        const urlCount = await Url.countDocuments({ userId: userId });
        if (urlCount >= user.urlLimit) {
          return res.status(403).json({
            success: false,
            message: 'You have reached your URL limit for the free plan.'
          });
        }
      }
    }
    
    // If domain is provided, ensure user is authenticated
    if (domain && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to use custom domains'
      });
    }
    
    // If customSlug is provided, ensure it's not already taken
    if (customSlug) {
      const existingUrl = await getUrlByShortCode(customSlug);
      if (existingUrl) {
        return res.status(409).json({
          success: false,
          message: 'Custom slug is already in use'
        });
      }
    }
    
    // Create short URL and QR code with expiration
    const result = await createShortUrl(originalUrl, baseUrl, expirationDays, description, domain, userId, customSlug);
    
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
 * Update URL properties
 * @route PATCH /api/url/:shortCode
 * @access Private
 */
const updateUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { expiresAt, description, customSlug } = req.body;
    
    // Get the URL document first to check ownership
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }
    
    // Check if the URL belongs to the authenticated user
    if (urlDoc.userId) {
      // Convert both IDs to strings for proper comparison
      const urlUserId = urlDoc.userId.toString();
      const requestUserId = req.user.id.toString();
      
      if (urlUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this URL'
        });
      }
    }
    
    // Prepare update data object
    const updateData = {};
    
    // Add expiresAt if provided
    if (expiresAt !== undefined) {
      // Validate that expiresAt is a valid date
      const expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiration date format'
        });
      }
      updateData.expiresAt = expirationDate;
    }
    
    // Add description if provided
    if (description !== undefined) {
      updateData.description = description;
    }
    
    // Handle custom slug if provided
    if (customSlug !== undefined && customSlug !== shortCode) {
      // Check if the new custom slug is already taken
      const existingUrl = await getUrlByShortCode(customSlug);
      if (existingUrl) {
        return res.status(409).json({
          success: false,
          message: 'Custom slug is already in use'
        });
      }
      updateData.shortCode = customSlug;
    }
    
    // If no valid update fields are provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided'
      });
    }
    
    // Update URL with all provided fields
    const updatedUrl = await Url.findOneAndUpdate(
      { shortCode },
      {
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.expiresAt !== undefined && { expiresAt: updateData.expiresAt }),
        ...(updateData.shortCode !== undefined && { shortCode: updateData.shortCode })
      },
      { new: true }
    );
    
    if (!updatedUrl) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or already expired'
      });
    }
    
    // If shortCode was updated, also update it in the Statistics collection
    if (updateData.shortCode) {
      await Statistics.findOneAndUpdate(
        { shortCode },
        { shortCode: updateData.shortCode }
      );
    }
    
    return res.status(200).json({
      success: true,
      data: {
        shortCode: updatedUrl.shortCode,
        originalUrl: updatedUrl.originalUrl,
        description: updatedUrl.description,
        expiresAt: updatedUrl.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in updateUrl controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating URL',
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

/**
 * Delete a URL by short code
 * @route DELETE /api/url/:shortCode
 * @access Private
 */
const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Get URL document by short code to check ownership
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }
    
    // Check if the URL belongs to the authenticated user
    if (urlDoc.userId) {
      const urlUserId = urlDoc.userId.toString();
      const requestUserId = req.user.id.toString();
      
      if (urlUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this URL'
        });
      }
    }
    
    // Delete both the URL and its matching statistics
    await Promise.all([
      Url.findOneAndDelete({ shortCode }),
      Statistics.findOneAndDelete({ shortCode })
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'URL and associated statistics successfully deleted',
      data: {
        shortCode
      }
    });
  } catch (error) {
    console.error('Error in deleteUrl controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting URL',
      error: error.message
    });
  }
};

// Update module.exports to include the deleteUrl function
module.exports = {
  shortenUrl,
  redirectToUrl,
  updateUrl,
  getQRCode,
  getUserUrls,
  deleteUrl
};
