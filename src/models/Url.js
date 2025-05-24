const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    domain: {
      type: String,
      trim: true,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    qrCode: {
      type: String, // Stores the QR code as base64 string
      required: [true, 'QR code is required'],
    },
    clicks: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Default expiration is 7 days from creation
        const now = new Date();
        return new Date(now.setDate(now.getDate() + 7));
      }
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Create index for faster lookups
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic document expiration

module.exports = mongoose.model('Url', urlSchema);
