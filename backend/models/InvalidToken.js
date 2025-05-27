const mongoose = require('mongoose');

const invalidTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Document will be automatically deleted after 24 hours (86400 seconds)
  }
});

module.exports = mongoose.model('InvalidToken', invalidTokenSchema); 