const Statistics = require('../models/Statistics');
const Url = require('../models/Url');

/**
 * Initializes statistics for a new URL
 * 
 * @param {string} urlId - The ID of the URL document
 * @param {string} shortCode - The short code for the URL
 * @returns {Promise<Object>} - A promise that resolves to the created Statistics document
 */
const initializeStatistics = async (urlId, shortCode) => {
  try {
    const statistics = new Statistics({
      urlId,
      shortCode,
      totalClicks: 0,
      clicksByDay: [],
      referrers: [],
      browsers: [],
      countries: [],
    });

    await statistics.save();
    return statistics;
  } catch (error) {
    console.error('Error initializing statistics:', error);
    throw new Error('Failed to initialize statistics');
  }
};

/**
 * Gets statistics for a specific URL by its short code
 * 
 * @param {string} shortCode - The short code for the URL
 * @returns {Promise<Object|null>} - A promise that resolves to the Statistics document or null if not found
 */
const getStatisticsByShortCode = async (shortCode) => {
  try {
    const statistics = await Statistics.findOne({ shortCode });
    return statistics;
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    throw new Error('Failed to retrieve statistics');
  }
};

/**
 * Updates statistics when a URL is clicked
 * 
 * @param {string} shortCode - The short code for the URL
 * @param {Object} clickInfo - Information about the click
 * @param {string} clickInfo.referrer - The referrer URL
 * @param {string} clickInfo.browser - The browser used
 * @param {string} clickInfo.country - The country code
 * @returns {Promise<Object>} - A promise that resolves to the updated Statistics document
 */
const recordClick = async (shortCode, clickInfo) => {
  try {
    const { referrer = 'Direct', browser = 'Unknown', country = 'Unknown' } = clickInfo;

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    let statistics = await Statistics.findOne({ shortCode });

    if (!statistics) {
      // If no statistics document exists yet, find the URL and create one
      const url = await Url.findOne({ shortCode });
      if (!url) {
        throw new Error('URL not found');
      }
      statistics = await initializeStatistics(url._id, shortCode);
    }

    // Update total clicks
    statistics.totalClicks += 1;

    // Update clicks by day
    const dayIndex = statistics.clicksByDay.findIndex(day => day.date === today);
    if (dayIndex >= 0) {
      statistics.clicksByDay[dayIndex].clicks += 1;
    } else {
      statistics.clicksByDay.push({ date: today, clicks: 1 });
    }

    // Update referrer
    const referrerIndex = statistics.referrers.findIndex(r => r.source === referrer);
    if (referrerIndex >= 0) {
      statistics.referrers[referrerIndex].count += 1;
    } else {
      statistics.referrers.push({ source: referrer, count: 1 });
    }

    // Update browser
    const browserIndex = statistics.browsers.findIndex(b => b.name === browser);
    if (browserIndex >= 0) {
      statistics.browsers[browserIndex].count += 1;
    } else {
      statistics.browsers.push({ name: browser, count: 1 });
    }

    // Update country
    const countryIndex = statistics.countries.findIndex(c => c.name === country);
    if (countryIndex >= 0) {
      statistics.countries[countryIndex].count += 1;
    } else {
      statistics.countries.push({ name: country, count: 1 });
    }

    await statistics.save();
    return statistics;
  } catch (error) {
    console.error('Error recording click:', error);
    throw new Error('Failed to record click statistics');
  }
};

/**
 * Gets statistics for all URLs owned by a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - A promise that resolves to an array of Statistics documents
 */
const getStatisticsByUserId = async (userId) => {
  try {
    // Find all URLs for the user
    const userUrls = await Url.find({ userId });
    const shortCodes = userUrls.map(url => url.shortCode);
    
    // Get statistics for all these URLs
    const statistics = await Statistics.find({ shortCode: { $in: shortCodes } });
    return statistics;
  } catch (error) {
    console.error('Error retrieving user statistics:', error);
    throw new Error('Failed to retrieve user statistics');
  }
};

module.exports = {
  initializeStatistics,
  getStatisticsByShortCode,
  recordClick,
  getStatisticsByUserId,
};
