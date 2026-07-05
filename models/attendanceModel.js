const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true 
  }, // We save dates cleanly as text strings: "YYYY-MM-DD"
  worker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Points directly to the worker profile in our User database
  site: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Site', 
    required: true 
  }, // Points directly to the construction site location profile
  status: { 
    type: String, 
    enum: ['Present', 'Half-Day', 'Absent'], 
    required: true 
  }
}, { timestamps: true });

// Critical Check: This ensures you cannot log a worker's attendance twice on the exact same date
attendanceSchema.index({ date: 1, worker: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);