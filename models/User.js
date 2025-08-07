const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true
    },
    password: { 
        type: String,
        required: false 
    },
    googleId: { 
        type: String,
        required: false 
    }
}, {
    timestamps: true
});

UserSchema.pre('save', async function(next) {
    // Only hash the password if it's a new user or the password is being changed
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    
    try {
        // Generate a "salt" - a random string to make the hash unique
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);