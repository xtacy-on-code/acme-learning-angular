const jwt = require('jsonwebtoken');

// auth middleware to verify JWT token  runs before the route handler
const authMiddleware = (req, res, next) => {
    try {
        // get token from req headers
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // verify token, extract user data 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attach user info to req
        req.user = decoded;

        next(); // pass req to next handler

    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;