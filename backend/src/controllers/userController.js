const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users (FleetManager only)
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/users (FleetManager only) - provisions accounts for staff.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, driver } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, and role are required' });
  }
  const user = await User.create({ name, email, password, role, driver: driver || null });
  res.status(201).json(user.toSafeObject());
});

// PATCH /api/users/:id (FleetManager only)
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive, driver } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;
  if (driver !== undefined) update.driver = driver;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user.toSafeObject());
});

module.exports = { listUsers, createUser, updateUser };
