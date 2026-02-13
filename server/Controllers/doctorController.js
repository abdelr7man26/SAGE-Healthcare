const DoctorProfile = require('../models/DoctorProfile');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

// Update doctor profile
const updateProfile = async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const { specialization, degree, bio, consultationFee } = request.body;

    try {
        const profile = await DoctorProfile.findOneAndUpdate(
            { user: request.user.id },
            { specialization, degree, bio, consultationFee },
            { new: true, upsert: true }
        );

        response.status(200).json({
        message: 'Profile updated successfully',
        profile: profile 
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

// Set availability slots
const setAvailability = async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const { slots } = request.body;

    try {
        const profile = await DoctorProfile.findOne({ user: request.user.id });
        if (!profile) {
            return response.status(404).json({ message: 'Doctor profile not found' });
        }

        // Add new slots
        profile.slots = slots;
    
        await profile.save();

        response.status(200).json({
            message: 'Availability set successfully',
            slots: profile.slots
        });
    } catch (error) {
        console.error('Error setting availability:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

const approveDoctor = async (request, response) => {
    try {
        const { doctorId } = request.params; // send the id in the link 
        
        const profile = await DoctorProfile.findByIdAndUpdate(
            doctorId,
            { isApproved: true },
            { new: true }
        );

        if (!profile) {
            return response.status(404).json({ message: 'Doctor profile not found' });
        }

        response.status(200).json({
            message: 'Doctor approved successfully',
            profile
        });
    } catch (error) {
        console.error('Error approving doctor:', error);
        response.status(500).json({ message: 'Server error' });
    }
};

const getAllDoctors = async (req, res) => {
    try {
        const { specialty, name } = req.query;
        let query = { isApproved: true }; 

        
        if (specialty) {
            query.specialization = { $regex: specialty, $options: 'i' }; 
        }

        
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        
        const doctors = await DoctorProfile.find(query)
            .populate('user', 'name email') 
            .select('specialization degree consultationFee slots bio');

        res.status(200).json({
            count: doctors.length,
            doctors
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get bookings for the logged-in doctor
const getDoctorBookings = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const bookings = await Booking.find({ doctor: doctorId })
            .populate('patient', 'name email')
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Bookings retrieved successfully',
            bookings
        });
    } catch (error) {
        console.error('Error retrieving doctor bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { updateProfile, setAvailability, approveDoctor, getAllDoctors, getDoctorBookings };
