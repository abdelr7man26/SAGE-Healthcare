const Booking = require('../models/Booking');
const DoctorProfile = require('../models/DoctorProfile');
const { validationResult } = require('express-validator');

// Create a new booking (Atomic operation)
const createBooking = async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const { doctorId, slotId } = request.body;
    const patientId = request.user.id;

    try {
        // Find doctor profile
        const doctorProfile = await DoctorProfile.findById(doctorId);
        if (!doctorProfile) {
            return response.status(404).json({ message: 'Doctor not found' });
        }

        // Find the specific slot in the doctor's slots array
        const slot = doctorProfile.slots.id(slotId);
        if (!slot) {
            return response.status(404).json({ message: 'Slot not found' });
        }

        // Check if slot is available
        if (!slot.isAvailable) {
            return response.status(400).json({ message: 'الموعد محجوز بالفعل' });
        }

        // ATOMIC UPDATE: Use findOneAndUpdate with conditions to prevent race conditions
        // Only update if isAvailable is still true
        const updatedDoctorProfile = await DoctorProfile.findOneAndUpdate(
            {
                _id: doctorId,
                'slots._id': slotId,
                'slots.isAvailable': true
            },
            {
                $set: {
                    'slots.$.isAvailable': false
                }
            },
            { new: true }
        );

        // If update didn't happen, another patient booked it first
        if (!updatedDoctorProfile) {
            return response.status(400).json({ message: 'الموعد محجوز بالفعل' });
        }

        // Get the updated slot details
        const updatedSlot = updatedDoctorProfile.slots.id(slotId);

        // Create booking record with current consultationFee (for analytics)
        const booking = new Booking({
            patient: patientId,
            doctor: doctorProfile.user,
            doctorProfile: doctorId,
            slotId: slotId,
            slotDetails: {
                date: updatedSlot.date,
                startTime: updatedSlot.startTime,
                endTime: updatedSlot.endTime
            },
            status: 'confirmed',
            consultationFee: doctorProfile.consultationFee // Store fee at booking time for analytics
        });

        await booking.save();

        // Populate patient and doctor details for response
        await booking.populate([
            { path: 'patient', select: 'name email' },
            { path: 'doctor', select: 'name email' }
        ]);

        response.status(201).json({
            message: 'Booking created successfully',
            booking: booking
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get all bookings for a doctor
const getDoctorBookings = async (request, response) => {
    try {
        const doctorProfile = await DoctorProfile.findOne({ user: request.user.id });
        
        if (!doctorProfile) {
            return response.status(404).json({ message: 'Doctor profile not found' });
        }

        const bookings = await Booking.find({ doctorProfile: doctorProfile._id })
            .populate('patient', 'name email')
            .sort({ createdAt: -1 });

        response.status(200).json({
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching doctor bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get all bookings for a patient
const getPatientBookings = async (request, response) => {
    try {
        const bookings = await Booking.find({ patient: request.user.id })
            .populate('doctor', 'name email')
            .populate('doctorProfile', 'specialization degree')
            .sort({ createdAt: -1 });

        response.status(200).json({
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching patient bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Cancel a booking
const cancelBooking = async (request, response) => {
    try {
        const { bookingId } = request.params;

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return response.status(404).json({ message: 'Booking not found' });
        }

        // Check if the user is the patient or doctor associated with this booking
        const doctorProfile = await DoctorProfile.findOne({ user: booking.doctor });
        
        if (booking.patient.toString() !== request.user.id && 
            booking.doctor.toString() !== request.user.id &&
            request.user.role !== 'admin') {
            return response.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return response.status(400).json({ message: 'Booking cannot be cancelled' });
        }

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();

        // Release the slot back to available
        await DoctorProfile.findOneAndUpdate(
            {
                _id: booking.doctorProfile,
                'slots._id': booking.slotId
            },
            {
                $set: {
                    'slots.$.isAvailable': true
                }
            }
        );

        response.status(200).json({
            message: 'Booking cancelled successfully',
            booking: booking
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get all bookings (Admin only)
const getAllBookings = async (request, response) => {
    try {
        const { patientId, doctorId, status, startDate, endDate } = request.query;
        
        let query = {};

        // Search by patientId
        if (patientId) {
            query.patient = patientId;
        }

        // Search by doctorId
        if (doctorId) {
            query.doctor = doctorId;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const bookings = await Booking.find(query)
            .populate('patient', 'name email')
            .populate('doctor', 'name email')
            .populate('doctorProfile', 'specialization degree')
            .sort({ createdAt: -1 });

        response.status(200).json({
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching all bookings:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Get available slots for a doctor
const getAvailableSlots = async (request, response) => {
    try {
        const { doctorId } = request.params;

        const doctorProfile = await DoctorProfile.findById(doctorId);
        
        if (!doctorProfile) {
            return response.status(404).json({ message: 'Doctor not found' });
        }

        // Filter only available slots
        const availableSlots = doctorProfile.slots.filter(slot => slot.isAvailable);

        response.status(200).json({
            doctor: {
                id: doctorProfile._id,
                specialization: doctorProfile.specialization,
                consultationFee: doctorProfile.consultationFee
            },
            availableSlots: availableSlots
        });

    } catch (error) {
        console.error('Error fetching available slots:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Complete a booking (doctor marks it as completed)
const completeBooking = async (request, response) => {
    try {
        const { bookingId } = request.params;

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return response.status(404).json({ message: 'Booking not found' });
        }

        // Only the doctor can complete a booking
        if (booking.doctor.toString() !== request.user.id) {
            return response.status(403).json({ message: 'Not authorized to complete this booking' });
        }

        if (booking.status !== 'confirmed') {
            return response.status(400).json({ message: 'Only confirmed bookings can be completed' });
        }

        booking.status = 'completed';
        await booking.save();

        response.status(200).json({
            message: 'Booking marked as completed',
            booking: booking
        });

    } catch (error) {
        console.error('Error completing booking:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createBooking,
    getDoctorBookings,
    getPatientBookings,
    cancelBooking,
    getAllBookings,
    getAvailableSlots,
    completeBooking
};
