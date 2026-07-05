const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to the database link we put in the .env file
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If it fails (e.g., database is turned off), print the error and stop the server
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;