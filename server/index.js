require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // security
const compression = require('compression'); // performance
const rateLimit = require('express-rate-limit'); // stop attacks

const authRoutes = require('./Routes/authRouts'); 

const app = express();

// (Security)
app.use(helmet()); 
app.use(cors());   // channel between frot and back

// منع الطلبات الكثيرة (Rate Limiting) لحماية الـ Login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "out of tries,please try again later"
});
app.use('/api/', limiter);

// (Performance) 
app.use(compression()); // compress the data
app.use(express.json({ limit: '10kb' })); 

// Routes 
app.use('/api/auth', authRoutes);

// data base
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
      console.log("SAGE System: Secure Database Connected!");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log("DB Connection Error: ", err));