const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a construction site name'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please specify the site location'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Site', siteSchema);