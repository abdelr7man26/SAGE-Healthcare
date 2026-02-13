const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { updateProfile, setAvailability, getAllDoctors, getDoctorBookings } = require('../Controllers/doctorController');
const { body } = require('express-validator');
const { approveDoctor } = require('../Controllers/doctorController');

router.get('/', getAllDoctors);

router.patch('/approve/:doctorId', auth, authorize('admin'), approveDoctor);

// Doctor profile update route with validation
router.put('/profile', [
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('bio').notEmpty().withMessage('Bio is required'),
    body('consultationFee').isNumeric().withMessage('Consultation fee must be a number')
], auth, authorize('doctor'), updateProfile);

// Set availability route with validation
router.post('/availability', [
    body('slots').isArray({ min: 1 }).withMessage('At least one slot is required'),
    body('slots.*.date').isISO8601().withMessage('Valid date is required for each slot'),
    body('slots.*.startTime').notEmpty().withMessage('Start time is required for each slot'),
    body('slots.*.endTime').notEmpty().withMessage('End time is required for each slot')
], auth, authorize('doctor'), setAvailability);

// Get bookings for the logged-in doctor
router.get('/bookings', auth, authorize('doctor'), getDoctorBookings);

module.exports = router;
