const { getStatisticsByShortCode, getStatisticsByUserId } = require('../services/statisticsService');
const { getUrlByShortCode } = require('../services/shortenerService');

/**
 * Get statistics for a specific URL
 * @route GET /api/url/:shortCode/stats
 * @access Private
 */
const getUrlStatistics = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // First check if the URL exists and if the user has access to it
    const urlDoc = await getUrlByShortCode(shortCode);
    
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or has expired'
      });
    }

    // If the URL belongs to a user, check if the current user has permission
    if (urlDoc.userId) {
      const urlUserId = urlDoc.userId.toString();
      const requestUserId = req.user.id.toString();
      
      if (urlUserId !== requestUserId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access these statistics'
        });
      }
    }

    // Get statistics for the URL
    const statistics = await getStatisticsByShortCode(shortCode);

    if (!statistics) {
      return res.status(404).json({
        success: false,
        message: 'No statistics found for this URL'
      });
    }

    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error in getUrlStatistics controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

/**
 * Get statistics for all URLs owned by the user
 * @route GET /api/url/user/stats
 * @access Private
 */
const getUserUrlStatistics = async (req, res) => {
  try {
    // Get statistics for all URLs owned by the user
    const statistics = await getStatisticsByUserId(req.user.id);

    return res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    console.error('Error in getUserUrlStatistics controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: error.message
    });
  }
};

module.exports = {
  getUrlStatistics,
  getUserUrlStatistics
};
