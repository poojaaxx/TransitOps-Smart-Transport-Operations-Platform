const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { login, me };
