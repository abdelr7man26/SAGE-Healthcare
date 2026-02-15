const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
    user: {
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
    address: { 
        city: { type: String, required: true, trim: true }, 
        area: { type: String, required: true, trim: true }, 
        fullAddress: { type: String, required: true, trim: true }
        // شلنا الـ required والـ trim اللي كانوا تايهين هنا
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
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

doctorProfileSchema.virtual('availableSlots', {
    ref: 'Slot',            
    localField: 'user',     
    foreignField: 'doctor'  
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
