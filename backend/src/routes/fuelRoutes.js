const express = require('express');
const { listFuelLogs, createFuelLog, deleteFuelLog } = require('../controllers/fuelController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.get('/', listFuelLogs);
router.post('/', authorize(ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST), createFuelLog);
router.delete('/:id', authorize(ROLES.FLEET_MANAGER), deleteFuelLog);

module.exports = router;
