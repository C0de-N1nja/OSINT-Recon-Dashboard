const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    // The payload is the data we store inside the token. We only need the user's ID.
    const payload = { id };
    // We sign the payload with our secret key and set an expiration time.
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};


const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);
    const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode)
       .cookie('jwt', token, options)
       .redirect('/');
};

// --- Route Handlers ---

exports.renderLogin = (req, res) => res.render('login', { pageName: 'login' });
exports.renderRegister = (req, res) => res.render('register', { pageName: 'register' });

exports.registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).render('register', { error: 'Please fill in all fields.', pageName: 'register' });
    }
    if (password !== confirmPassword) {
        return res.status(400).render('register', { error: 'Passwords do not match.', pageName: 'register' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).render('register', { error: 'User with that email already exists.', pageName: 'register' });
        }

        // The password will be hashed automatically by the .pre('save') hook in User.js
        const user = await User.create({ name, email, password });
        sendTokenResponse(user, 201, res);

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).render('register', { error: 'Something went wrong. Please try again.', pageName: 'register' });
    }
};

// Handles POST request from the login form
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).render('login', { error: 'Please provide email and password.', pageName: 'login' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).render('login', { error: 'Invalid credentials.', pageName: 'login' });
        }
        sendTokenResponse(user, 200, res);

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).render('login', { error: 'Something went wrong. Please try again.', pageName: 'login' });
    }
};

// Handles the redirect from Google after successful login
exports.googleCallback = (req, res) => {
    sendTokenResponse(req.user, 200, res);
};

// Handles logout
exports.logoutUser = (req, res) => {
    // Clear the cookie by setting its content to nothing and expiring it immediately
    res.cookie('jwt', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.redirect('/auth/login');
};