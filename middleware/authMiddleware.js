const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Gate 1: Check if the user is logged in (has a valid token badge)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token from the header text string
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature against our secret key locker
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Grab the user data from the database, but leave out the encrypted password
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User profile not found' });
      }

      return next(); // Token is valid! Let the user pass to the route.
    } catch (error) {
      return res.status(401).json({ message: 'Session expired or invalid login badge' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied, missing login badge token' });
  }
};

// Gate 2: Check if the user's role matches the required permission clearance level
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Permission denied: Role [${req.user?.role || 'Guest'}] cannot perform this action` 
      });
    }
    next(); // Role is verified! Let the admin proceed.
  };
};

module.exports = { protect, authorize };