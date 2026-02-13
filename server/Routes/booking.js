const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { 
    createBooking, 
    getDoctorBookings, 
    getPatientBookings, 
    cancelBooking, 
    getAllBookings,
    getAvailableSlots,
    completeBooking
} = require('../Controllers/bookingController');

// Get available slots for a doctor (public - patient needs to see available slots)
router.get('/doctor/:doctorId/slots', getAvailableSlots);

// Create a new booking (patient only)
router.post('/', [
    body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
    body('slotId').isMongoId().withMessage('Valid slot ID is required')
], auth, authorize('patient'), createBooking);

// Get all bookings for the logged-in doctor
router.get('/doctor', auth, authorize('doctor'), getDoctorBookings);

// Get all bookings for the logged-in patient
router.get('/patient', auth, authorize('patient'), getPatientBookings);

// Get all bookings (admin only)
router.get('/', auth, authorize('admin'), getAllBookings);

// Cancel a booking
router.patch('/:bookingId/cancel', auth, authorize('patient', 'doctor', 'admin'), cancelBooking);

// Complete a booking (doctor only)
router.patch('/:bookingId/complete', auth, authorize('doctor'), completeBooking);

module.exports = router;
