const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, refreshToken, logoutUser } = require('../controllers/userController');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validateInput');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validateRegisterInput, registerUser);
router.post('/login', validateLoginInput, loginUser);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);

module.exports = router;
