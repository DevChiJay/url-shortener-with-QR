const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    clicksByDay: [
      {
        date: {
          type: String, // Format: YYYY-MM-DD
          required: true,
        },
        clicks: {
          type: Number,
          default: 0,
        },
      },
    ],
    referrers: [
      {
        source: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    browsers: [
      {
        name: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    countries: [
      {
        name: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for faster querying
statisticsSchema.index({ urlId: 1 });
statisticsSchema.index({ shortCode: 1 });

module.exports = mongoose.model('Statistics', statisticsSchema);
