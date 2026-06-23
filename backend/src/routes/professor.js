const router = require('express').Router();
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const { getOrSet, invalidatePattern } = require('../utils/cache');

// Any authenticated user can READ professors; only professors may mutate them.
// auth sets req.user from the JWT; requireRole('professor') gates the writes.
router.use(auth);

// Return the full list — the frontend AG Grid does sorting/filtering/pagination
// client-side, so no query params are needed. Cached under a single key.
router.get('/', async (req, res) => {
    try {
        const professors = await getOrSet(
            'professors:all',
            () => Professor.find().sort({ createdAt: -1 }),
            60
        );
        res.json({ professors });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch professors', details: err.message });
    }
});

router.post('/', requireRole('professor'), async (req, res) => {
    try {
        const newProfessor = await Professor.create(req.body);
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(201).json({ message: 'Created successfully!', professor: newProfessor });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create professor', details: err.message });
    }
});

router.put('/:id', requireRole('professor'), async (req, res) => {
    try {
        const updatedProfessor = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Edited successfully!', professor: updatedProfessor });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update professor', details: err.message });
    }
});

router.delete('/:id', requireRole('professor'), async (req, res) => {
    try {
        await Professor.findByIdAndDelete(req.params.id);
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete professor', details: err.message });
    }
});

module.exports = router;
