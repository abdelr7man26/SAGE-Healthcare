const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (request, response) => {
    try {
        const { name, email, password } = request.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'patient' 
        });

        await user.save();

        response.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
};

const login = async (request, response) => {
    try {
        const { email, password } = request.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return response.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.status(400).json({ message: 'Wrong password' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            response.json({ token });
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error, please try again' });
    }
    
};

const getProfile = async (request, response) => {
    try {
        const user = await User.findById(request.user.id).select('-password'); 
        response.json(user);
    } catch (error) {
        response.status(500).send('Server Error');
    }
};

const updateProfile = async (request, response) => {
    const { name, email } = request.body;
    try {
        let user = await User.findById(request.user.id);
        if (!user) return response.status(404).json({ message: 'User not found' });

        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();
        const updatedUser = await User.findById(user._id).select('-password');

        response.json({ message: 'Profile updated successfully', updatedUser });
    } catch (error) {
        response.status(500).send('Server Error');
    }
};  

module.exports = { register, login, getProfile, updateProfile };
