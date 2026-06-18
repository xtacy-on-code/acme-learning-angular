const router = require('express').Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');

router.get('/', auth, async(req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

router.post('/', auth, async(req, res) => {
    try {
        const newStudent = await Student.create(req.body);
        res.status(201).json({ message: 'Created successfully!', student: newStudent});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

router.put('/:id', auth, async(req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Edited successfully!', student: updatedStudent});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

router.delete('/:id', auth, async(req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted successfully!'});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

module.exports = router;