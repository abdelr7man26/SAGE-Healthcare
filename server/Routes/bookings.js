const express = require('express');
const router = express.Router();
const { bookAppointment, getAllBookings } = require('../Controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');

// Book an appointment (patients only)
router.post('/', auth, authorize('patient'), bookAppointment);

// Get all bookings (admin only)
router.get('/', auth, authorize('admin'), getAllBookings);

module.exports = router;
