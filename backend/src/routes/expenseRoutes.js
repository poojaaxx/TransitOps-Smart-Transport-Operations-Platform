const express = require('express');
const { listExpenses, createExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.get('/', listExpenses);
router.post('/', authorize(ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST), createExpense);
router.delete('/:id', authorize(ROLES.FLEET_MANAGER), deleteExpense);

module.exports = router;
