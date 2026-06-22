const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Fields the user is allowed to edit. We deliberately do NOT trust req.body
// wholesale — copying only these keys stops someone from sneaking in
// `password`, `profileImage`, `_id`, etc. via the request body.
const EDITABLE_FIELDS = ['name', 'email', 'phone', 'bio', 'dob', 'address'];

// GET /api/profile  -> the logged-in user's own profile.
// `auth` runs first and sets req.user = { userId }. `.select('-password')`
// makes sure the password hash never leaves the server.
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
    }
});

// PUT /api/profile  -> update the editable text fields.
router.put('/', auth, async (req, res) => {
    try {
        const updates = {};
        EDITABLE_FIELDS.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // An empty date string ('') can't be cast to a Date and would throw a
        // CastError. Treat "no date" as clearing the field instead.
        if (updates.dob === '') {
            updates.dob = null;
        }

        const user = await User.findByIdAndUpdate(req.user.userId, updates, {
            new: true,           // return the updated document, not the old one
            runValidators: true  // re-run schema validators on the update
        }).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully!', user });
    } catch (err) {
        // A duplicate email trips the unique index -> Mongo error code 11000.
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
});

// POST /api/profile/image  -> upload/replace the profile photo.
// `upload.single('image')` runs the multer middleware: it parses the
// multipart body, validates the file (images only, <= 2 MB), saves it to disk,
// and puts the saved file info on req.file. If multer rejects the file it
// throws, which lands in the catch block below.
router.post('/image', auth, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            // fileFilter / size-limit rejections arrive here.
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        try {
            // Store only the public URL path in the DB — never the bytes.
            const imagePath = `/uploads/profile-images/${req.file.filename}`;
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                { profileImage: imagePath },
                { new: true }
            ).select('-password');

            res.json({ message: 'Profile image updated successfully!', user });
        } catch (saveErr) {
            res.status(500).json({ error: 'Failed to save image', details: saveErr.message });
        }
    });
});

module.exports = router;
