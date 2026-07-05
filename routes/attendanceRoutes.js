const express = require('express');
const router = express.Router();
const { saveDailyAttendance, getDailyAttendanceSummary, getMyAttendanceSummary, getLabourSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Seed route for testing environment creation
router.post('/seed-site', async (req, res) => {
  try {
    const Site = require('../models/siteModel');
    const newSite = await Site.create({
      name: "Shakti Residency Project",
      location: "Surat, Gujarat"
    });
    res.status(201).json({ message: "Site created successfully!", newSite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Endpoints
router.post('/save', protect, authorize('admin'), saveDailyAttendance);
router.get('/summary', protect, authorize('admin'), getDailyAttendanceSummary); // 🆕 Attached summary fetching line

// Labour Endpoint
router.get('/my-summary', protect, authorize('labour'), getMyAttendanceSummary);


router.get('/my-dashboard', protect, authorize('labour'),getLabourSummary);

module.exports = router;