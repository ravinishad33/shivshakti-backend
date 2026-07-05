const mongoose = require('mongoose');

const cashbookSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: [true, 'Transaction date string is required.'] 
  }, // Format: dd:mm:yy (aligned with payroll string match mechanics)
  
  description: { 
    type: String, 
    required: [true, 'Please log an operational description tracking transaction details.'],
    trim: true
  }, // e.g., "Advance cash issued to worker Ramesh Kumar (ID: L-101)"
  
  type: { 
    type: String, 
    enum: ['Income', 'Debit', 'Credit', 'Expense'], // Updated to match financial ledger variants
    required: [true, 'Transaction type parameter is required.'] 
  },
  
  amount: { 
    type: Number, 
    required: [true, 'Please specify the exact currency transaction value.'],
    min: [1, 'Amount must be greater than zero.']
  },
  
  category: { 
    type: String, 
    enum: [
      'Materials', 
      'Labour Advance', // ⚡ Core category scanned by the automated salary ledger
      'Fuel / Transport', 
      'Misc / Food', 
      'Capital', 
      'Client Running Bill',
      'Site Expense',
      'Owner Capital',
      'Other'
    ], 
    required: [true, 'Please select a valid cashbook tracking category.'] 
  },
  
  site: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Site', 
    required: [true, 'Connects the money transaction directly to a specific project site.'] 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Cashbook', cashbookSchema);