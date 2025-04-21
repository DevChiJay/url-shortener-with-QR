const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const urlRoutes = require('./routes/urlRoutes');

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
app.use('/', urlRoutes); // For redirection using short codes

// Base route
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Shortener API is running',
    endpoints: {
      shortenUrl: 'POST /api/url/shorten',
      updateExpiration: 'PATCH /api/url/:shortCode/expiration',
      getQRCode: 'GET /api/url/:shortCode/qr',
      redirect: 'GET /:shortCode'
    }
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
