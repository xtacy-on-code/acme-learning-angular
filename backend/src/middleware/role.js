// Role-gate middleware factory. Runs AFTER the auth middleware (which sets
// req.user from the JWT), so req.user.role is available here. Usage:
//   router.post('/', auth, requireRole('professor'), handler)
//   router.use(requireRole('professor', 'admin'))  // multiple allowed roles
const requireRole = (...allowedRoles) => (req, res, next) => {
    if (allowedRoles.includes(req.user?.role)) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
};

module.exports = requireRole;
