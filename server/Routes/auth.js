const express = require('express');
const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', (req, res) => {
    res.send('Register endpoint is ready - waiting for controller logic');
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', (req, res) => {
    res.send('Login endpoint is ready - waiting for controller logic');
});

module.exports = router;