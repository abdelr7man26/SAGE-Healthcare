const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ SAGE Database Connected Successfully!"))
  .catch((err) => console.log("❌ DB Connection Error: ", err));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const authRoutes = require('./Routes/auth');
const doctorRoutes = require('./Routes/doctor');
const patientRoutes = require('./Routes/patient');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
