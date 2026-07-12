const express = require('express');
const { getKpis, getVehicleStatusBreakdown, getTripsTrend } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/kpis', getKpis);
router.get('/vehicle-status-breakdown', getVehicleStatusBreakdown);
router.get('/trips-trend', getTripsTrend);

module.exports = router;
