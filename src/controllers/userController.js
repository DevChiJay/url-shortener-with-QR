const User = require('../models/User');
const { generateTokens, verifyToken } = require('../utils/authUtils');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, rememberMe } = req.validatedData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      rememberMe: !!rememberMe, // Convert to boolean if not already
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update user with refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Return success response with tokens
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error in registerUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while registering user',
      error: error.message
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.validatedData;
    
    // Find user by email and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update rememberMe if provided
    if (rememberMe !== undefined) {
      user.rememberMe = rememberMe;
      await user.save();
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update user with refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Return success response with tokens
    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rememberMe: user.rememberMe
      }
    });
  } catch (error) {
    console.error('Error in loginUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging in',
      error: error.message
    });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rememberMe: user.rememberMe,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Find user with matching refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update user with new refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    // Return success response with new tokens
    return res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Error in refreshToken controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while refreshing token',
      error: error.message
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logoutUser = async (req, res) => {
  try {
    // Find user and clear refresh token
    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: null
    });
    
    return res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Error in logoutUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging out',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  refreshToken,
  logoutUser
};
