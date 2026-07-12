const { User, Role } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const flatten = (user) => {
  user.role = user.RoleRef.name;
  return user.toSafeObject();
};

// GET /api/users (FleetManager only)
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    include: [{ model: Role, as: 'RoleRef' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(users.map(flatten));
});

// POST /api/users (FleetManager only) - provisions accounts for staff.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, driver } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, and role are required' });
  }

  const roleRow = await Role.findOne({ where: { name: role } });
  if (!roleRow) {
    return res.status(400).json({ message: `Unknown role: ${role}` });
  }

  const user = await User.create({
    name,
    email,
    password,
    roleId: roleRow._id,
    driverId: driver || null,
  });
  user.RoleRef = roleRow;
  res.status(201).json(flatten(user));
});

// PATCH /api/users/:id (FleetManager only)
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive, driver } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (isActive !== undefined) update.isActive = isActive;
  if (driver !== undefined) update.driverId = driver;

  if (role !== undefined) {
    const roleRow = await Role.findOne({ where: { name: role } });
    if (!roleRow) {
      return res.status(400).json({ message: `Unknown role: ${role}` });
    }
    update.roleId = roleRow._id;
  }

  const user = await User.findByPk(req.params.id, { include: [{ model: Role, as: 'RoleRef' }] });
  if (!user) return res.status(404).json({ message: 'User not found' });

  await user.update(update);
  await user.reload({ include: [{ model: Role, as: 'RoleRef' }] });
  res.json(flatten(user));
});

module.exports = { listUsers, createUser, updateUser };
