const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'], 
        default: 'patient'
    },
    gender: { 
        type: String, 
        enum: ['male', 'female'],
        default: 'male'
    },
    phone: { 
        type: String, 
        trim: true ,
        require: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date }
    
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);