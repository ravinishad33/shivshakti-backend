const express = require('express');
const router = express.Router();
const User=require("../models/userModel")
const bcrypt = require('bcryptjs');

const {
  loginUser,
  getAdminProfile,
  updateAdminProfile,
  rotateAdminPassword,
  requestProfileOtp,
  verifyOtpAndResetPassword,
  getLabourProfile
} = require('../controllers/authController'); // 🔄 Consolidated to authController as updated previously

const { addLabour, getAllWorkers, updateWorkerProfile, removeWorker } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @desc    Fast-Track URL Admin Seeding Endpoint with Schema Compliance Validation
 * @route   POST /api/auth/seed-admin
 * @access  Public
 */
router.post('/seed-admin', async (req, res) => {
  try {
    // 1. Prevent duplicates: Check if an admin already exists by identityId or role
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ 
        message: `Initialization blocked. Admin already exists.` 
      });
    }

    // 2. 🚀 FIXED: Pass the plaintext password directly. 
    // Your userSchema.pre('save') hook will hash this cleanly once!
    const createdAdmin = await User.create({
      identityId: 'ADMIN-01',
      name: 'Ravi Ramesh Nishad',
      mobile: '9999999999',
      password: 'AdminPassword123', // Clean, plaintext string
      role: 'admin',
      dailyWage: 0,
      adharNumber: '000011112222', // Standard required mock validation placeholder
      aadhaarPhoto: 'https://placehold.co/600x400/png?text=Admin+Aadhaar+Placeholder',
      status: 'Active'
    });

    return res.status(201).json({
      message: 'Shivshakti Core Operations Hub Admin seeded successfully! 🚀',
      credentials: {
        identityId: createdAdmin.identityId,
        mobile: createdAdmin.mobile,
        password: 'AdminPassword123',
        role: createdAdmin.role
      }
    });

  } catch (error) {
    console.error("❌ ROUTE SEEDING RUNTIME CRASH:", error.message);
    return res.status(500).json({ 
      message: 'Seeding route matrix execution failed.',
      error: error.message 
    });
  }
});














// 🔐 Authentication Gateways
router.post('/login', loginUser);

// 👷 Workforce Management Pipeline
router.route('/workers')
  .post(protect, authorize('admin'), upload, addLabour)
  .get(protect, authorize('admin'), getAllWorkers);

router.route('/workers/:id')
  .put(protect, authorize('admin'), upload, updateWorkerProfile)
  .delete(protect, authorize('admin'), removeWorker);



// 👤 Admin General Identity Core Routes
router.route('/profile')
  .get(protect, authorize('admin'), getAdminProfile)
  .put(protect, authorize('admin'), updateAdminProfile);

router.route('/me')
  .get(protect, authorize('labour'), getLabourProfile)

// 🔐 Admin Security Operations & Password Rotation Matrix
router.put('/profile/password', protect, authorize('admin', 'labour'), rotateAdminPassword);
router.post('/profile/request-otp', protect, authorize('admin', 'labour'), requestProfileOtp);
router.put('/profile/verify-otp-reset', protect, authorize('admin', 'labour'), verifyOtpAndResetPassword);

module.exports = router;