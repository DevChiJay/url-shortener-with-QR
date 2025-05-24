const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const urlRoutes = require('./routes/urlRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/url', urlRoutes);
app.use('/api/auth', userRoutes);
app.use('/', urlRoutes); // For redirection using short codes

// Base route
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Shortener API is running',
    endpoints: {
      // URL shortening endpoints
      shortenUrl: 'POST /api/url/shorten',
      updateUrl: 'PATCH /api/url/:shortCode',
      deleteUrl: 'DELETE /api/url/:shortCode',
      getQRCode: 'GET /api/url/:shortCode/qr',
      redirect: 'GET /:shortCode',
      
      // Statistics endpoints
      urlStatistics: 'GET /api/url/:shortCode/stats',
      userStatistics: 'GET /api/url/user/stats',
      
      // URL management endpoints
      getUserUrls: 'GET /api/url/user/urls',
      
      // Authentication endpoints
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      refreshToken: 'POST /api/auth/refresh-token',
      getUserProfile: 'GET /api/auth/profile',
      logout: 'POST /api/auth/logout'
    }
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
