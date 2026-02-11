const DoctorProfile = require('../models/DoctorProfile');
const { validationResult } = require('express-validator');

// Update doctor profile
const updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { specialization, degree, bio, consultationFee } = req.body;

    try {
        const profile = await DoctorProfile.findOneAndUpdate(
            { userId: req.user.id },
            { specialization, degree, bio, consultationFee },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: 'Profile updated successfully',
            profile: {
                specialization: profile.specialization,
                degree: profile.degree,
                bio: profile.bio,
                consultationFee: profile.consultationFee
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Set availability slots
const setAvailability = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { slots } = req.body;

    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // Add new slots
        profile.slots.push(...slots);
        await profile.save();

        res.status(200).json({
            message: 'Availability set successfully',
            slots: profile.slots
        });
    } catch (error) {
        console.error('Error setting availability:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    updateProfile,
    setAvailability
};
