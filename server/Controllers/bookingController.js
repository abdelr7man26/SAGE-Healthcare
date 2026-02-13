const Booking = require('../models/Booking');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// Book an appointment (for patients)
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, slotId } = req.body;
        const patientId = req.user.id;

        // Find the doctor profile
        const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Find the slot and check availability
        const slot = doctorProfile.slots.id(slotId);
        if (!slot || !slot.isAvailable) {
            return res.status(400).json({ message: 'Slot not available' });
        }

        // Atomically update the slot to unavailable
        const updateResult = await DoctorProfile.findOneAndUpdate(
            { user: doctorId, 'slots._id': slotId, 'slots.isAvailable': true },
            { $set: { 'slots.$.isAvailable': false } },
            { new: true }
        );

        if (!updateResult) {
            return res.status(400).json({ message: 'Slot already booked' });
        }

        // Create the booking record
        const booking = new Booking({
            patient: patientId,
            doctor: doctorId,
            slotId: slotId,
            consultationFee: doctorProfile.consultationFee
        });

        await booking.save();

        res.status(201).json({
            message: 'Appointment booked successfully',
            booking: await booking.populate('patient', 'name email').populate('doctor', 'name email').execPopulate()
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all bookings (for admin)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('patient', 'name email')
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Bookings retrieved successfully',
            bookings
        });
    } catch (error) {
        console.error('Error retrieving bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    bookAppointment,
    getAllBookings
};
