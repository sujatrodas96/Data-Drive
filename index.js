const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

// routes
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');

// middlewares
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

dotenv.config();
const app = express();

// Database connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ["https://data-drive-iota.vercel.app", "http://localhost:3000"],
  credentials: true
}));

// rate limiter middleware
app.use(generalLimiter);

// serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// serve uploaded files
app.use('/uploads', express.static('uploads'));

// api routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

// Connect to database before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// For Vercel deployment
module.exports = app;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  });
}