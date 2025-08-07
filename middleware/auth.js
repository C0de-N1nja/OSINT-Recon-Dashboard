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

exports.ensureGuest = (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
            // If token is valid, they are a logged-in user, redirect them.
            return res.redirect('/');
        } catch (error) {
            // If token is invalid/expired, treat them as a guest.
            return next();
        }
    } else {
        // No token, they are a guest.
        next();
    }
};