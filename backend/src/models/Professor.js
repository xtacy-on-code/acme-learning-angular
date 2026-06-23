const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ''
    },
    department: {
        type: String,
        default: '',
        trim: true
    },
    designation: {
        type: String,
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'],
        required: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    specialization: {
        type: String,
        default: '',
        trim: true
    },
    experience: {
        type: Number,
        default: 0
    },
    joiningDate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Professor', professorSchema);
