const express = require('express');
const router = express.Router();

const { register, login, getProfile, updateProfile, updateUserRole } = require('../Controllers/authController');

const { auth, authorize} = require('../middleware/auth'); 

// @route    PATCH api/auth/update-role
router.patch('/update-role', auth, authorize('admin'), updateUserRole);

// @route   POST api/auth/register
router.post('/register', register);

// @route   POST api/auth/login
router.post('/login', login);

// @route    GET api/auth/profile
router.get('/profile', auth, getProfile);

// @route    PUT api/auth/profile
router.put('/profile', auth, updateProfile);

module.exports = router;