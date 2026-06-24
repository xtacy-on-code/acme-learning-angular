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

// Bulk delete (multi-select). Distinct path from DELETE /:id, so no conflict.
router.post('/bulk-delete', requireRole('professor'), async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
        if (!ids.length) return res.status(400).json({ error: 'No ids provided' });
        const result = await Professor.deleteMany({ _id: { $in: ids } });
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Deleted successfully!', deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete professors', details: err.message });
    }
});

// Bulk update (multi-select) — set the SAME field values on many professors at
// once. updateMany applies one $set to every matched doc, so all selected rows
// end up identical on the edited fields. Whitelisted fields, only $set the ones
// provided. runValidators enforces the designation enum on the $set value.
router.post('/bulk-update', requireRole('professor'), async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
        const update = (req.body.update && typeof req.body.update === 'object') ? req.body.update : {};
        if (!ids.length) return res.status(400).json({ error: 'No ids provided' });

        const ALLOWED = ['department', 'designation'];
        const set = {};
        ALLOWED.forEach((field) => {
            if (update[field] !== undefined && update[field] !== '') set[field] = update[field];
        });
        if (!Object.keys(set).length) return res.status(400).json({ error: 'No fields to update' });

        const result = await Professor.updateMany({ _id: { $in: ids } }, { $set: set }, { runValidators: true });
        await invalidatePattern('professors:*');  // ← bust the cache
        res.status(200).json({ message: 'Updated successfully!', modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: 'Failed to update professors', details: err.message });
    }
});

module.exports = router;
