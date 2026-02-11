const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    degree: {
        type: String,
        required: true,
        trim: true
    },
    bio: {
        type: String,
        required: true,
        trim: true
    },
    consultationFee: {
        type: Number,
        required: true,
        min: 0
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    slots: [{
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
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    }],
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
doctorProfileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
