const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.ensureAuth = async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            // Case where user was deleted but token is still valid
            return res.redirect('/auth/login');
        }

        next(); // User is authenticated, proceed to the next function (the controller)
    } catch (error) {
        console.error("Authentication Error:", error);
        return res.redirect('/auth/login');
    }
};

exports.ensureGuest = async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    // If there is no token, they are definitely a guest.
    if (!token) {
        return next();
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in the database
        const user = await User.findById(decoded.id);

        if (user) {
            // User is valid and logged in, redirect them from login/register page
            return res.redirect('/');
        } else {
            // User does not exist, but token is present. Treat as a guest.
            // Clear the invalid cookie to prevent this loop from happening again.
            res.cookie('jwt', 'none', {
                expires: new Date(Date.now() + 1),
                httpOnly: true
            });
            return next();
        }
    } catch (error) {
        // Token is invalid (expired, malformed, etc.). Treat as a guest.
        return next();
    }
};