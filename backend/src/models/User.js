const mongoose = require('mongoose');

// define user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true  // automatically removes extra spaces
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'professor'],
        required: true,
        default: 'student'
    },
    profileImage: {
        type: String,
        default: '',
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    bio: {
        type: String,
        default: '',
        trim: true
    },
    dob: {
        type: Date
    },
    address: {
        type: String,
        default: '',
        trim: true
    }
}, { timestamps: true});

module.exports = mongoose.model('User', userSchema);