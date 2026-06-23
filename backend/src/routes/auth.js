const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');


// POST route for user signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate role: only the two known roles are accepted (default 'student'
        // if omitted, matching the schema default).
        const allowedRoles = ['student', 'professor'];
        const userRole = role || 'student';
        if (!allowedRoles.includes(userRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // hash the pass
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user and save
        const user = new User({ name, email, password: hashedPassword, role: userRole });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Signup failed', details: err.message });
    }
});

// POST route for user login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // find user's email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // check pass 
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // create JWT token. Embed role so requireRole() can read req.user.role
        // on every authenticated request without an extra DB lookup.
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        // role is also returned at the top level so the frontend has it
        // synchronously at login time, before any /api/profile fetch resolves.
        res.json ({ message: 'Login successful', token, role: user.role });

    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

module.exports = router;