// Admin middleware - checks if user is an admin
const checkAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Hardcoded admin email
  const ADMIN_EMAIL = 'abdulazizalbadi91@gmail.com';

  // Check if user is admin by email or isAdmin flag
  if (req.user.email === ADMIN_EMAIL || req.user.isAdmin) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
};

module.exports = { checkAdmin };
