const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
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
}, { timestamps: true });

//indexing the slots for each doctor
slotSchema.index({ doctor: 1, date: 1, isAvailable: 1 });

module.exports = mongoose.model('Slot', slotSchema);