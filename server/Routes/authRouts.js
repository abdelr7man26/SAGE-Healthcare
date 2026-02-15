const express = require('express');
const router = express.Router();

const { register, login, getProfile, updateProfile, updateUserRole, verifyEmail, resendVerificationCode, forgotPassword, resetPassword } = require('../Controllers/authController');
const { auth, authorize} = require('../middleware/auth'); 

//lazm ykon el role admin w el tooken saleem 

// @route    PATCH api/authRouts/update-role
router.patch('/update-role', auth, authorize('admin'), updateUserRole);



//m4 bt7tag middleware 

// @route   POST api/authRouts/register
router.post('/register', register);

// @route   POST api/authRouts/login
router.post('/login', login);

// @route   POST api/authRouts/verify-email
router.post('/verify-email', verifyEmail);

// @route   POST api/authRouts/resend-code
router.post('/resend-code', resendVerificationCode);

// @route   POST api/authRouts/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST api/authRouts/reset-password
router.post('/reset-password', resetPassword);



// lazm ykon el tooken saleem

// @route    GET api/authRouts/profile
router.get('/profile', auth, getProfile);

// @route    PUT api/authRouts/profile
router.put('/profile', auth, updateProfile);

module.exports = router;