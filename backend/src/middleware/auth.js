const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Requires a valid JWT on every request. No route in the app is reachable
// without this middleware except /api/auth/login and /api/health.
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated: no token provided' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authenticated: user not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated: invalid or expired token' });
  }
};

// Usage: authorize('FleetManager', 'SafetyOfficer')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role permissions' });
  }
  next();
};

module.exports = { protect, authorize };
