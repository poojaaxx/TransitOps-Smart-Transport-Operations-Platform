const { Op } = require('sequelize');
const { Expense, Vehicle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/expenses?vehicle=&category=&from=&to=
const listExpenses = asyncHandler(async (req, res) => {
  const { vehicle, category, from, to } = req.query;
  const where = {};
  if (vehicle) where.vehicleId = vehicle;
  if (category) where.category = category;
  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = new Date(from);
    if (to) where.date[Op.lte] = new Date(to);
  }

  const expenses = await Expense.findAll({
    where,
    include: [{ model: Vehicle, as: 'vehicle', attributes: ['_id', 'registrationNumber', 'name'] }],
    order: [['date', 'DESC']],
  });
  res.json(expenses);
});

// POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const { vehicle, category, amount, date, notes } = req.body;
  if (!category || amount == null) {
    return res.status(400).json({ message: 'category and amount are required' });
  }

  const expense = await Expense.create({
    vehicleId: vehicle || null,
    category,
    amount,
    date: date || new Date(),
    notes,
    createdBy: req.user._id,
  });
  res.status(201).json(expense);
});

// DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  await expense.destroy();
  res.json({ message: 'Expense deleted' });
});

module.exports = { listExpenses, createExpense, deleteExpense };
