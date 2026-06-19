const router = require('express').Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const search = (req.query.search || '').trim();

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { rollno: { $regex: search, $options: 'i' } }
            ];
        }

        // Exact-match filters: dropdown values, so an exact match is correct
        if (req.query.grade) query.grade = req.query.grade;
        if (req.query.gender) query.gender = req.query.gender.toLowerCase(); // <- fixes Male/Female vs male/female mismatch

        // Partial-match filters: free-text inputs, so use regex like search does
        ['rollno', 'phone', 'email'].forEach((field) => {
            if (req.query[field]) {
                query[field] = { $regex: req.query[field], $options: 'i' };
            }
        });

        const skip = (page - 1) * limit;

        const [students, total] = await Promise.all([
            Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Student.countDocuments(query)
        ]);

        res.json({ students, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const newStudent = await Student.create(req.body);
        res.status(201).json({ message: 'Created successfully!', student: newStudent });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create student', details: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Edited successfully!', student: updatedStudent });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update student', details: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete student', details: err.message });
    }
});

module.exports = router;