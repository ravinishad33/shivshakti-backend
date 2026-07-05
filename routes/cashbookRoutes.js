const express = require('express');
const router = express.Router();
const { addTransaction, getLedgerSummary, createCashbookEntry } = require('../controllers/cashbookController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Cashbook accounting routes (Protected: Admin access only)
router.route('/')
  .post(protect, authorize('admin'), addTransaction)   // Add income or expense
  .get(protect, authorize('admin'), getLedgerSummary); // View totals and history
  router.route('/entry')
  .post(protect, authorize('admin'), createCashbookEntry);

module.exports = router;