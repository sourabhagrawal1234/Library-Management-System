/**
 * Middleware to restrict route access by role
 * Usage: authorize('admin') or authorize('staff', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    const effectiveRoles = [...roles];
    if (roles.includes('user') && !effectiveRoles.includes('student')) effectiveRoles.push('student');
    if (roles.includes('student') && !effectiveRoles.includes('user')) effectiveRoles.push('user');

    if (!req.user || !effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'guest'}) is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { authorize };
