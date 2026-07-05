const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');

/**
 * @desc    1. Admin Saves Daily Attendance for an entire roster of workers
 * @route   POST /api/attendance/save
 * @access  Protected (Admin Only)
 */
const saveDailyAttendance = async (req, res) => {
  const { date, records, siteId } = req.body; 

  try {
    if (!date || !records || !siteId) {
      return res.status(400).json({ message: 'Missing date, site ID, or record data' });
    }

    // Prepare a bulk operational batch to write everything efficiently in one go
    const operations = records.map(record => ({
      updateOne: {
        filter: { date, worker: record.workerId },
        update: { status: record.status, site: siteId },
        upsert: true 
      }
    }));

    await Attendance.bulkWrite(operations);
    return res.status(200).json({ message: `Daily attendance committed successfully for date: ${date}` });

  } catch (error) {
    console.error("❌ BULK WRITE ATTENDANCE ERROR:", error.message);
    return res.status(500).json({ message: 'Failed to write attendance roster ledger updates' });
  }
};

/**
 * @desc    2. Admin Fetches Saved Daily Attendance for a Specific Date & Site
 * @route   GET /api/attendance/summary
 * @access  Protected (Admin Only)
 */
const getDailyAttendanceSummary = async (req, res) => {
  const { date, siteId } = req.query;

  try {
    // If query params exist, filter strictly by them (used by the daily entry sheet sync)
    let query = {};
    if (date && siteId) {
      query = { date, site: siteId };
    }

    // Find saved logs matching the computed query constraints
    const records = await Attendance.find(query);
    
    // Map date and siteId explicitly into the array payload so the frontend analytics engine can read them!
    const formattedRecords = records.map(rec => ({
      date: rec.date,
      siteId: rec.site,
      workerId: rec.worker,
      status: rec.status
    }));

    return res.status(200).json({ records: formattedRecords });
  } catch (error) {
    console.error("❌ GET SUMMARY ERROR:", error.message);
    return res.status(500).json({ message: 'Error pulling administrative roster logs' });
  }
};

/**
 * @desc    3. Labour Views Their Own Attendance Logs with Total Hours
 * @route   GET /api/attendance/my-summary
 * @access  Protected (Labour Only)
 */
const getMyAttendanceSummary = async (req, res) => {
  try {
    // 1. Fetch all attendance entries linked to the logged-in worker
    const records = await Attendance.find({ worker: req.user._id }).sort({ date: -1 });
    
    // 2. Reduce the dataset to aggregate counts and calculate cumulative operational hours concurrently
    const initialAccumulator = { 
      Present: 0, 
      'Half-Day': 0, 
      Absent: 0,
      totalHours: 0 
    };

    const analytics = records.reduce((totals, item) => {
      if (!item || !item.status) return totals;

      const statusKey = item.status.trim();
      
      // Increment standard status metric maps if they match the valid keys
      if (totals.hasOwnProperty(statusKey)) {
        totals[statusKey]++;
      }

      // Hours Distribution Calculation Mapping (Aligned to 9-Hour Rule)
      if (statusKey === 'Present') {
        totals.totalHours += 9;
      } else if (statusKey === 'Half-Day') {
        totals.totalHours += 4.5;
      }

      return totals;
    }, initialAccumulator);

    // 3. Destructure total hours from counts to return a clean payload object
    const { totalHours, ...summary } = analytics;

    // 4. Dispatch status payload containing individual fields
    return res.status(200).json({ 
      summary, 
      totalHours, 
      history: records 
    });

  } catch (error) {
    console.error("❌ PERSONAL SUMMARY FREQUENCY EXCEPTION:", error.message);
    return res.status(500).json({ message: 'Error pulling personal attendance analytics logs' });
  }
};

/**
 * @desc    4. Get Consolidated Dashboard Metrics & Logs for Logged-In Worker Safely with Total Present Units
 * @route   GET /api/attendance/my-summary
 * @access  Protected (Labour Dashboard Linkage)
 */
const getLabourSummary = async (req, res) => {
  try {
    // 1. Verify token context population safety checkpoint
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication layer failed to pass user identity parameters.' });
    }

    const workerId = req.user._id;

    // 2. Fetch worker profile details from the database
    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile records missing in database.' });
    }

    // Safely extract daily wage constant parameters
    const dailyWageRate = Number(worker.dailyWage) || 0;

    // 3. Query worker attendance history array entries safely
    const databaseLogs = await Attendance.find({ worker: workerId }).sort({ date: -1 });
    
    // Force variable transformation into a clean array format if database drops a null status map
    const safeLogs = Array.isArray(databaseLogs) ? databaseLogs : [];

    // 4. Initialize calculations counters securely
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let advanceTaken = 0;

    // 5. Run calculation aggregation pipeline with deep property existence validation checks
    safeLogs.forEach(log => {
      if (!log || !log.status) return; // Skip broken or malformed log lines dynamically
      
      const statusValue = String(log.status).trim();
      if (statusValue === 'Present') {
        presentCount++;
      } else if (statusValue === 'Half-Day') {
        halfDayCount++;
      } else if (statusValue === 'Absent') {
        absentCount++;
      }
      
      // Force calculation parameters to read as true numbers to avoid string concatenation issues
      if (log.advanceGiven) {
        const parsedAdvance = Number(log.advanceGiven);
        if (!isNaN(parsedAdvance)) {
          advanceTaken += parsedAdvance;
        }
      }
    });

    // 6. Compute Net Present Unit Metrics (Full days + 0.5 for Half days)
    const totalDaysPresentWeighted = presentCount + (halfDayCount * 0.5);

    // 🚀 Compute Cumulative Shift Hours using the updated 9-Hour Matrix standard rule
    const totalHoursWorked = (presentCount * 9) + (halfDayCount * 4.5);

    // 7. Compute gross financial ledgers safely
    const grossEarned = (presentCount * dailyWageRate) + (halfDayCount * (dailyWageRate * 0.5));
    const netPayable = grossEarned - advanceTaken;

    // 8. Map logs array cleanly into the exact naming layout the frontend expects
    const recentLogs = safeLogs.map((log, index) => {
      return {
        date: log && log.date ? String(log.date) : `Day-${index + 1}`,
        status: log && log.status ? String(log.status) : 'Absent'
      };
    });

    // 9. Return final verified JSON response matrix
    return res.status(200).json({
      presentCount,
      halfDayCount,
      absentCount,
      totalDaysPresent: totalDaysPresentWeighted,
      totalHours: totalHoursWorked, // 🆕 Returning aligned total shift hours metric directly to dashboard
      advanceTaken,
      grossEarned,
      netPayable,
      recentLogs
    });

  } catch (error) {
    console.error("❌ LABOUR METRICS RUNTIME CRASH DETAILS:", error.message);
    console.error(error.stack); 
    
    return res.status(500).json({ 
      message: 'Server encountered a calculation mapping error.',
      errorDebugDetails: error.message 
    });
  }
};

module.exports = { 
  saveDailyAttendance, 
  getDailyAttendanceSummary, 
  getMyAttendanceSummary, 
  getLabourSummary 
};