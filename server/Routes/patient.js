const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById } = require('../Controllers/patientController');

// Get all approved doctors
router.get('/doctors', getAllDoctors);

// Get specific doctor by ID
router.get('/doctors/:id', getDoctorById);

module.exports = router;
