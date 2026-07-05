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
// Configured to allow both Netlify production deployment and local development environment ports
const allowedOrigins = [
  'https://shiv-shakti-construction.netlify.app',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173' // Added Vite default port just in case your frontend runs here locally
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
})); 

app.use(express.json()); 
// Serve static images folder to public browsers safely
app.use('/uploads', express.static('uploads'));

// 5. Connect Module Routing Networks
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/cashbook', require('./routes/cashbookRoutes')); 
app.use('/api/sites', require('./routes/siteRoutes'));

// 6. Basic app health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'Shivshakti server is awake!' });
});

// 7. Boot listening matrix
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🛰️ Server spinning on port ${PORT}`));