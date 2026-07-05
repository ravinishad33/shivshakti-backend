const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 1. Load environment parameters
dotenv.config();

// 2. Fire up database connection pool
connectDB();

// 3. Initialize Express framework
const app = express();

// 4. Request standard filters
app.use(cors()); 
app.use(express.json()); 
// Serve static images folder to public browsers safely
app.use('/uploads', express.static('uploads'));

// 5. Connect Module Routing Networks
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/cashbook', require('./routes/cashbookRoutes')); // <-- ADD THIS LINE HERE
app.use('/api/sites', require('./routes/siteRoutes'));


// 6. Basic app health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'Shivshakti server is awake!' });
});

// 7. Boot listening matrix
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🛰️ Server spinning on port ${PORT}`));