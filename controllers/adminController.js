const User = require('../models/userModel');
const crypto = require('crypto'); // Built into Node.js to generate random strings



/**
 * @desc    Admin Adds a New Worker with Uploaded Identity Files
 * @route   POST /api/auth/workers
 */
const addLabour = async (req, res) => {
  try {
    const { name, mobile, dailyWage, adharNumber } = req.body; // text data fields
   
    // 1. Validate if essential fields are provided
    if (!name || !mobile || !adharNumber) {
      return res.status(400).json({ message: 'Name, mobile, and Aadhaar number are required.' });
    }


    // 2. Validate if files were successfully uploaded by Multer
    if (!req.files || !req.files['aadhaarPhoto']) {
      return res.status(400).json({ message: 'Please upload the Aadhaar card photo file.' });
    }

    // 3. Prevent duplicate mobile or Aadhaar accounts
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) return res.status(400).json({ message: 'Mobile number already registered.' });

    const adharExists = await User.findOne({ adharNumber });
    if (adharExists) return res.status(400).json({ message: 'Aadhaar number already registered.' });

    // 4. Capture file paths saved on our disk
    const aadhaarPhotoPath = req.files['aadhaarPhoto'][0].path; // e.g., "uploads/aadhaarPhoto-17198..."
    const profilePhotoPath = req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : "";


    // 5. Generate automated identity ID and safe temporary password
    const totalWorkersCount = await User.countDocuments({ role: 'labour' });
    const autoWorkerId = `L-${101 + totalWorkersCount}`;
    const temporaryPassword = crypto.randomBytes(4).toString('hex').toUpperCase();

    // 6. Save data to database
    const newWorker = await User.create({
      name,
      mobile,
      identityId: autoWorkerId,
      password: temporaryPassword,
      role: 'labour',
      dailyWage: dailyWage ? Number(dailyWage) : 400,
      status: 'Active',
      adharNumber,
      aadhaarPhoto: aadhaarPhotoPath,
      profilePhoto: profilePhotoPath
    });

    return res.status(201).json({
      message: 'Labour profile with image records onboarding completed',
      worker: {
        _id: newWorker._id,
        name: newWorker.name,
        identityId: newWorker.identityId,
        temporaryPassword
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to onboard worker via multipart data pipeline.' });
  }
};




/**
 * @desc    2. Admin Views All Workers
 * @route   GET /api/auth/workers
 */
const getAllWorkers = async (req, res) => {
  try {
    // Fetch all records where role is 'labour', hide password fields
    const workers = await User.find({ role: 'labour' }).select('-password').sort({ identityId: 1 });
    return res.status(200).json(workers);
  } catch (error) {
    return res.status(500).json({ message: 'Error pulling workforce records' });
  }
};



/**
 * @desc    Admin Updates an Existing Worker Profile (Text & Optional Images)
 * @route   PUT /api/auth/workers/:id
 */
const updateWorkerProfile = async (req, res) => {
  console.log(req.body)
  try {
    const { id } = req.params; // The MongoDB _id of the worker
    const { name, mobile, dailyWage, adharNumber, status } = req.body;

    // 1. Find the worker first to verify existence and check existing files
    const worker = await User.findById(id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    // 2. Prevent duplicate mobile or identification numbers across other workers
    if (mobile && mobile !== worker.mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) return res.status(400).json({ message: 'Mobile number is already in use by another profile.' });
      worker.mobile = mobile;
    }

    if (adharNumber && adharNumber !== worker.adharNumber) {
      const adharExists = await User.findOne({ adharNumber });
      if (adharExists) return res.status(400).json({ message: 'Identification number is already registered to another profile.' });
      worker.adharNumber = adharNumber;
    }

    // 3. Update core text parameters if provided
    if (name) worker.name = name;
    if (dailyWage) worker.dailyWage = Number(dailyWage);
    if (status) worker.status = status;

    // 4. Check for optional file replacements processed by Multer
    if (req.files) {
      // If a new document photo is uploaded, map its new destination path
      if (req.files['aadhaarPhoto'] && req.files['aadhaarPhoto'][0]) {
        worker.aadhaarPhoto = req.files['aadhaarPhoto'][0].path;
      }
      // If a new profile photo is uploaded, map its new destination path
      if (req.files['profilePhoto'] && req.files['profilePhoto'][0]) {
        worker.profilePhoto = req.files['profilePhoto'][0].path;
      }
    }

    // 5. Commit modified document layers to the database collection ledger
    await worker.save();

    return res.status(200).json({
      message: 'Worker profile modified and synchronized successfully',
      worker: {
        _id: worker._id,
        name: worker.name,
        identityId: worker.identityId,
        mobile: worker.mobile,
        dailyWage: worker.dailyWage,
        status: worker.status
      }
    });

  } catch (error) {
    console.error("❌ PROFILE UPDATE ERROR:", error);
    return res.status(500).json({ message: 'Failed to update worker details via data pipeline.' });
  }
};

/**
 * @desc    4. Admin Removes a Worker
 * @route   DELETE /api/auth/workers/:id
 */
const removeWorker = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    await worker.deleteOne();
    return res.status(200).json({ message: `Worker ${worker.identityId} successfully removed` });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting database record' });
  }
};

module.exports = { addLabour, getAllWorkers, updateWorkerProfile, removeWorker };