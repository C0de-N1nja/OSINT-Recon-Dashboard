const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

const { ensureGuest } = require('../middleware/auth'); 

// Routes for Local Username/Password Authentication  
router.get('/login', ensureGuest, authController.renderLogin);
router.post('/login', ensureGuest, authController.loginUser);
router.get('/register', ensureGuest, authController.renderRegister);
router.post('/register', authController.registerUser);
router.get('/logout', authController.logoutUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/login' }), 
    authController.googleCallback
);

module.exports = router;