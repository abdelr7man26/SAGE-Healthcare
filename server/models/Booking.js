const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorProfile',
        required: true
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    slotDetails: {
        date: {
            type: Date,
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    consultationFee: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
bookingSchema.pre('save', async function() {
    this.updatedAt = Date.now();
});

// Index for efficient queries
bookingSchema.index({ patient: 1, createdAt: -1 });
bookingSchema.index({ doctor: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
