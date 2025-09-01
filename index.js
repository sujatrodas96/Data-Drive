const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const port = process.env.PORT || 3000;
const connection = require('./config/db');
const cors = require('cors');

// routes
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');

// middlewares
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

dotenv.config();
const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: "*", // or "https://data-drive-iota.vercel.app"
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

// start server after DB connection
connection
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
