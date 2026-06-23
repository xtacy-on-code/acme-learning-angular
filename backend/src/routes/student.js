const router = require('express').Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const { getOrSet, invalidate, invalidatePattern } = require('../utils/cache');

const ALLOWED_SORT_FIELDS = ['name', 'rollno', 'email', 'grade', 'phone', 'gender', 'createdAt'];

router.get('/', auth, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const search = (req.query.search || '').trim();

        const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const cacheKey = `students:${page}:${limit}:${search}:${sortBy}:${sortOrder}:${req.query.grade || ''}:${req.query.gender || ''}`;

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

        const result = await getOrSet(cacheKey, async () => {
            const [students, total] = await Promise.all([
                Student.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
                Student.countDocuments(query)
            ]);

            return { students, total, page, limit, totalPages: Math.ceil(total / limit)};
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

// Whole-collection counts for the dashboard. Computed on the DB (countDocuments
// + a $group aggregation) so we never ship every document to the client. Defined
// before the '/:id' routes so 'stats' isn't mistaken for an id.
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await getOrSet(
            'students:stats', async () => {
                const [total, byGender, byGrade] = await Promise.all([
                    Student.countDocuments({}),
                    Student.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
                    // Grade distribution for the dashboard bar chart. Skip blank grades and
                    // sort by grade so the bars come back in a stable order.
                    Student.aggregate([
                        { $match: { grade: { $ne: '' } } },
                        { $group: { _id: '$grade', count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ])
                ]);

                const counts = { male: 0, female: 0, other: 0 };
                byGender.forEach((g) => {
                    if (g._id && counts[g._id] !== undefined) counts[g._id] = g.count;
                });

                const grades = byGrade.map((g) => ({ grade: g._id, count: g.count }));

                // Students with an empty gender count toward `total` but no bucket.
                return ({ total, ...counts, byGrade: grades });
            }, 120
        );

        res.json(stats);

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
    }
});

router.post('/', auth, requireRole('professor'), async (req, res) => {
    try {
        const newStudent = await Student.create(req.body);
        await invalidatePattern('students:*');  // ← bust the cache
        res.status(201).json({ message: 'Created successfully!', student: newStudent });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create student', details: err.message });
    }
});

router.put('/:id', auth, requireRole('professor'), async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await invalidatePattern('students:*');  // ← bust the cache
        res.status(200).json({ message: 'Edited successfully!', student: updatedStudent });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update student', details: err.message });
    }
});

router.delete('/:id', auth, requireRole('professor'), async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        await invalidatePattern('students:*');  // ← bust the cache
        res.status(200).json({ message: 'Deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete student', details: err.message });
    }
});

module.exports = router;