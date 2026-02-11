const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// Get all approved doctors
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await DoctorProfile.find({ isApproved: true })
            .populate('userId', 'name email')
            .select('specialization degree bio consultationFee slots');

        res.status(200).json({
            message: 'Doctors retrieved successfully',
            doctors
        });
    } catch (error) {
        console.error('Error retrieving doctors:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get specific doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await DoctorProfile.findOne({ _id: id, isApproved: true })
            .populate('userId', 'name email')
            .select('specialization degree bio consultationFee slots');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({
            message: 'Doctor retrieved successfully',
            doctor
        });
    } catch (error) {
        console.error('Error retrieving doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById
};
