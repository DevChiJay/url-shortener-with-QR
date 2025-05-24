const { nanoid } = require('nanoid');
const Url = require('../models/Url');
const { generateQRCode } = require('./qrCodeService');
const { initializeStatistics } = require('./statisticsService');

/**
 * Generates a unique short code for a URL
 * 
 * @param {number} length - The length of the short code (default: 6)
 * @returns {string} - A unique short code
 */
const generateShortCode = (length = 6) => {
  return nanoid(length);
};

/**
 * Calculates expiration date based on days from now
 * 
 * @param {number} days - Number of days until expiration
 * @returns {Date} - Calculated expiration date
 */
const calculateExpirationDate = (days = 7) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
};

/**
 * Creates a shortened URL with QR code
 * 
 * @param {string} originalUrl - The original URL to shorten
 * @param {string} baseUrl - The base URL for the shortened URL (e.g., http://yourdomain.com)
 * @param {number} expirationDays - Number of days until URL expiration (default: 7)
 * @param {string} description - Optional description for the URL
 * @param {string} domain - Optional custom domain for the URL
 * @param {string} userId - Optional user ID to associate with the URL
 * @returns {Promise<Object>} - A promise that resolves to the created URL document
 */
const createShortUrl = async (originalUrl, baseUrl, expirationDays = 7, description = null, domain = null, userId = null) => {
  try {
    // Generate a unique short code
    const shortCode = generateShortCode();
    
    // Create the full shortened URL
    const shortUrl = `${baseUrl}/${shortCode}`;
    
    // Generate QR code for the shortened URL
    const qrCode = await generateQRCode(shortUrl);
    
    // Calculate expiration date
    const expiresAt = calculateExpirationDate(expirationDays);
      // Create and save the URL document
    const newUrl = new Url({
      originalUrl,
      shortCode,
      description,
      domain,
      userId,
      qrCode,
      expiresAt
    });
    
    await newUrl.save();
    
    // Initialize statistics for this URL
    await initializeStatistics(newUrl._id, shortCode);
    
    return newUrl;
  } catch (error) {
    console.error('Error creating short URL:', error);
    throw new Error('Failed to create short URL');
  }
};

/**
 * Retrieves a URL document by its short code
 * 
 * @param {string} shortCode - The short code to look up
 * @returns {Promise<Object|null>} - A promise that resolves to the URL document or null if not found
 */
const getUrlByShortCode = async (shortCode) => {
  try {
    const url = await Url.findOne({ 
      shortCode, 
      active: true,
      expiresAt: { $gt: new Date() } // Check if URL has not expired
    });
    return url;
  } catch (error) {
    console.error('Error retrieving URL:', error);
    throw new Error('Failed to retrieve URL');
  }
};

/**
 * Increments the click count for a URL
 * 
 * @param {string} shortCode - The short code of the URL to update
 * @returns {Promise<void>} - A promise that resolves when the click count is updated
 */
const incrementClickCount = async (shortCode) => {
  try {
    await Url.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } }
    );
  } catch (error) {
    console.error('Error updating click count:', error);
    throw new Error('Failed to update click count');
  }
};

/**
 * Updates the expiration date for a URL
 * 
 * @param {string} shortCode - The short code of the URL to update
 * @param {number} expirationDays - Number of days until URL expiration
 * @returns {Promise<Object|null>} - A promise that resolves to the updated URL document or null if not found
 */
const updateUrlExpiration = async (shortCode, expirationDays) => {
  try {
    const expiresAt = calculateExpirationDate(expirationDays);
    
    const updatedUrl = await Url.findOneAndUpdate(
      { shortCode, active: true },
      { expiresAt },
      { new: true }
    );
    
    return updatedUrl;
  } catch (error) {
    console.error('Error updating URL expiration:', error);
    throw new Error('Failed to update URL expiration');
  }
};

module.exports = {
  generateShortCode,
  createShortUrl,
  getUrlByShortCode,
  incrementClickCount,
  updateUrlExpiration,
  calculateExpirationDate
};
