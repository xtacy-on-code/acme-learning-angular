const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    rollno: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    grade: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', ''],
        default: ''
    },
    bloodGroup: {
        type: String,
        default: ''
    },
    section: {
        type: String,
        default: ''
    },
    dob: {
        type: Date,
        required: false
    },
    address: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);