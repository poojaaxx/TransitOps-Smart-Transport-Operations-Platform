const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/expenses?vehicle=&category=&from=&to=
const listExpenses = asyncHandler(async (req, res) => {
  const { vehicle, category, from, to } = req.query;
  const query = {};
  if (vehicle) query.vehicle = vehicle;
  if (category) query.category = category;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const expenses = await Expense.find(query).populate('vehicle', 'registrationNumber name').sort({ date: -1 });
  res.json(expenses);
});

// POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const { vehicle, category, amount, date, notes } = req.body;
  if (!category || amount == null) {
    return res.status(400).json({ message: 'category and amount are required' });
  }

  const expense = await Expense.create({
    vehicle: vehicle || null,
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
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
});

module.exports = { listExpenses, createExpense, deleteExpense };
