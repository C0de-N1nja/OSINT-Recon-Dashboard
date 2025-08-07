const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/auth/google/callback'
            },

            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value
                };

                try {
                    // Check if this user already exists in our database
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        // If they exist, we're done. Pass the user object to Passport.
                        done(null, user);
                    } else {
                        // If they don't exist, create a new user in our database.
                        user = await User.create(newUser);
                        done(null, user);
                    }
                } catch (err) {
                    console.error(err);
                    done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};