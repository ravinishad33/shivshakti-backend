const Cashbook = require('../models/cashbookModel');

/**
 * @desc    1. Create a new transaction entry inside the site cashbook registry ledger
 * @route   POST /api/cashbook/entry (Also supports fallback /api/cashbook)
 * @access  Protected (Admin Only)
 */
const createCashbookEntry = async (req, res) => {
  // Pulling parameters directly matching both frontend payload variants
  const { date, description, type, amount, category, siteId, site } = req.body;

  try {
    // Resolve variable names coming from different structural frontends gracefully
    const finalSiteId = siteId || site;
    const finalAmount = Number(amount);

    // Strict validation gate checking against your Mongoose Schema constraints
    if (!date || !description || !type || !finalAmount || !category || !finalSiteId) {
      return res.status(400).json({ 
        message: 'Missing structural parameters. Ensure date, site, description, type, category, and amount are all provided.' 
      });
    }

    // Persist cleanly to MongoDB collection instance
    const newEntry = await Cashbook.create({
      date,
      description,
      type, // 'Income', 'Debit', 'Credit', 'Expense'
      amount: finalAmount,
      category,
      site: finalSiteId // Binds to your project Site reference ObjectId
    });

    return res.status(201).json({
      message: 'Cashbook ledger entry committed successfully.',
      entry: newEntry
    });

  } catch (error) {
    console.error("❌ CASHBOOK WRITE EXCEPTION:", error.message);
    return res.status(500).json({ 
      message: 'Failed to record secure cash log transaction.',
      errorDetails: error.message 
    });
  }
};

/**
 * @desc    2. Admin Views All Ledger Entries with Live Calculations (Total Balance, Income, Outflow)
 * @route   GET /api/cashbook
 * @access  Protected (Admin Only)
 */
const getLedgerSummary = async (req, res) => {
  try {
    // Fetch logs, include the site name details, sort with newest entries first
    const transactions = await Cashbook.find({})
      .sort({ date: -1, createdAt: -1 })
      .populate('site', 'name');

    // Run safe math aggregation processing loops across the historical log records
    const totals = transactions.reduce((summary, item) => {
      if (!item || !item.amount) return summary;

      const txType = String(item.type).trim();
      const txAmount = Number(item.amount) || 0;

      // Accrues totals dynamically across both legacy and new ledger notation string tokens
      if (txType === 'Income' || txType === 'Credit') {
        summary.totalIncome += txAmount;
      } else if (txType === 'Expense' || txType === 'Debit') {
        summary.totalExpense += txAmount;
      }
      return summary;
    }, { totalIncome: 0, totalExpense: 0 });

    return res.status(200).json({
      netAvailableBalance: totals.totalIncome - totals.totalExpense,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      ledgerHistory: transactions // Passes full history to hydrate your tables instantly
    });

  } catch (error) {
    console.error("❌ CASHBOOK FETCH EXCEPTION:", error.message);
    return res.status(500).json({ message: 'Error compiling transactional matrix logs' });
  }
};

module.exports = { 
  createCashbookEntry, // Primary unified creation handler
  addTransaction: createCashbookEntry, // Maintained legacy alias to prevent server boot route failure breaks
  getLedgerSummary 
};