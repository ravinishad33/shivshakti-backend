const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock memory engine to track dispatched OTP strings for validation loops
const activeOtpCache = new Map();

// Helper function to sign a secure digital entry pass (JWT Token)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @desc    1. Handles User Logins (Admin & Labour)
 * @route   POST /api/auth/login
 */
const loginUser = async (req, res) => {
  const { identityId, password } = req.body;
  console.log(req.body)

  try {
    if (!identityId || !password) {
      return res.status(400).json({ message: 'Please enter both identity ID and password' });
    }

    const user = await User.findOne({ identityId });
    console.log(user)

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        identityId: user.identityId,
        role: user.role,
        token: generateToken(user._id)
      });
    }

    return res.status(401).json({ message: 'Invalid identity ID or password' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login process' });
  }
};

// labour profile 
const getLabourProfile = async (req, res) => {
  try {
    // req.user._id is populated dynamically by your 'protect' JWT verification middleware
    const userProfile = await User.findById(req.user._id).select('-password');
    
    if (!userProfile) {
      return res.status(404).json({ message: 'Requested user profile records are missing.' });
    }

    // Return the complete sanitized document to the frontend
    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("❌ PROFILE RETRIEVAL SYSTEM ERROR:", error.message);
    return res.status(500).json({ message: 'Failed to retrieve profile data metrics from database.' });
  }
};




/**
 * @desc    2. Fetch Current Logged-In Admin Profile Parameters
 * @route   GET /api/auth/profile
 */
const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Administrative profile records missing.' });
    }
    return res.status(200).json(admin);
  } catch (error) {
    return res.status(500).json({ message: 'Error pulling administrative structural layers.' });
  }
};

/**
 * @desc    3. Modify Text Components (Name, Mobile) Safely
 * @route   PUT /api/auth/profile/update
 */
const updateAdminProfile = async (req, res) => {
  const { name, mobile } = req.body;
  try {
    const adminId = req.user._id;

    if (!name && !mobile) {
      return res.status(400).json({ message: 'Please provide a name or mobile number to update.' });
    }

    if (mobile) {
      const mobileExists = await User.findOne({ mobile, _id: { $ne: adminId } });
      if (mobileExists) {
        return res.status(400).json({ message: 'Mobile number is already registered to another user.' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin account not detected.' });
    }

    return res.status(200).json({ 
      message: 'Profile details updated successfully.',
      user: updatedAdmin
    });
  } catch (error) {
    console.error("❌ ADMIN TEXT UPDATE FAULT:", error);
    return res.status(500).json({ message: 'Failed to synchronize text detail parameters.' });
  }
};

/**
 * @desc    4. Method 1: Rotate Password via Traditional Verification Layers Safely
 * @route   PUT /api/auth/profile/password
 */
const rotateAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please enter both current and new passwords.' });
    }

    const admin = await User.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: 'Admin file not found.' });

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Authentication failed. Current password is incorrect.' });
    }

    // Hash the new password string manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update atomically to bypass validation blocks
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { password: hashedPassword } },
      { runValidators: false }
    );

    return res.status(200).json({ message: 'Security password variant rotated cleanly.' });
  } catch (error) {
    console.error("❌ ADMIN PASSWORD ROTATION FAULT:", error);
    return res.status(500).json({ message: 'Failed to commit security key configuration variations.' });
  }
};

/**
 * @desc    5. Method 2 Part A: Issue 6-Digit Verification OTP Code
 * @route   POST /api/auth/profile/request-otp
 */
const requestProfileOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Target email validation field required.' });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    activeOtpCache.set(req.user._id.toString(), {
      code: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    console.log(`[SECURITY OUTBOX] Secure OTP generated for Admin ID [${req.user._id}]: ${generatedOtp}`);
    
    return res.status(200).json({ message: 'Verification code dispatched to targeted node inbox.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to construct server challenge validation keys.' });
  }
};

/**
 * @desc    6. Method 2 Part B: Verify Outbox OTP & Process Forced Password Override Safely
 * @route   PUT /api/auth/profile/verify-otp-reset
 */
const verifyOtpAndResetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  try {
    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'Please enter both the OTP code and your new password.' });
    }

    const cachedRecord = activeOtpCache.get(req.user._id.toString());
    
    if (!cachedRecord) {
      return res.status(400).json({ message: 'No active verification sequence detected. Please request a new code.' });
    }

    if (Date.now() > cachedRecord.expiresAt) {
      activeOtpCache.delete(req.user._id.toString());
      return res.status(400).json({ message: 'Verification key expired. Request a refreshed token payload.' });
    }

    if (cachedRecord.code !== otp) {
      return res.status(400).json({ message: 'Authentication mismatch. Invalid token entries provided.' });
    }

    // 🚀 Hash the new password string manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 🚀 Force atomic update override to bypass missing properties validation rules completely
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { password: hashedPassword } },
      { runValidators: false }
    );
    
    activeOtpCache.delete(req.user._id.toString());
    return res.status(200).json({ message: 'Credentials overridden securely via verification token.' });
  } catch (error) {
    console.error("❌ ADMIN OTP RESET FAULT:", error);
    return res.status(500).json({ message: 'Failed to authorize system passkey changes.' });
  }
};

module.exports = { 
  generateToken,
  loginUser,
  getAdminProfile, 
  getLabourProfile,
  updateAdminProfile, 
  rotateAdminPassword, 
  requestProfileOtp, 
  verifyOtpAndResetPassword 
};