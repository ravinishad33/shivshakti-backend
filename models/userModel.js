const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  mobile: { 
    type: String, 
    required: true, 
    unique: true 
  },
  identityId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'labour'], 
    default: 'labour' 
  },
  dailyWage: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['Active', 'On Break'], 
    default: 'Active' 
  },
  // 🆕 NEW COMPLIANCE FIELDS FOR ONDEMAND IDENTITY VERIFICATION
  adharNumber: {
    type: String,
    required: true,
    unique: true
  },
  aadhaarPhoto: {
    type: String, // Stores file path destination string (e.g., "uploads/aadhaar-1719834.jpg")
    required: true
  },
  profilePhoto: {
    type: String, // Stores file path destination string (e.g., "uploads/profile-1719834.jpg")
    default: ""
  }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);