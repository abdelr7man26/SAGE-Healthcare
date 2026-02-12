const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (request, response) => {
    try {
        const { name, email, password, role } = request.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const allowedRoles = ['patient', 'doctor'];
        const finalRole = allowedRoles.includes(role) ? role : 'patient';

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: finalRole 
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

const updateUserRole = async (req, res) => {
    try {
        const { userid, newRole, adminSecret } = req.body;

        if (newRole === 'admin') {
            if (adminSecret !== process.env.ADMIN_UPGRADE_SECRET) {
                return res.status(403).json({ 
                    message: "Forbidden: You need the Super Admin Secret Key to promote someone to Admin." 
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            userid, 
            { role: newRole }, 
            { new: true }
        ).select('-password'); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: `User role has been successfully updated to ${newRole}`, 
            user 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports = { register, login, getProfile, updateProfile, updateUserRole };
