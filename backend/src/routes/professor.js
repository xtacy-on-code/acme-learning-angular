const router = require('express').Router();
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const { getOrSet, invalidatePattern } = require('../utils/cache');

// The whole Professors API is professor-only — students can't reach it even by
// bypassing the UI. auth sets req.user from the JWT; requireRole gates on role.
router.use(auth);
router.use(requireRole('professor'));

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

router.post('/', async (req, res) => {
    try {
        const newProfessor = await Professor.create(req.body);
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(201).json({ message: 'Created successfully!', professor: newProfessor });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create professor', details: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedProfessor = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Edited successfully!', professor: updatedProfessor });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update professor', details: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Professor.findByIdAndDelete(req.params.id);
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete professor', details: err.message });
    }
});

module.exports = router;
