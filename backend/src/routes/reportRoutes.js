const express = require('express');
const {
  getVehicleReport,
  exportVehicleReportCsv,
  exportVehicleReportPdf,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/vehicles', getVehicleReport);
router.get('/vehicles/csv', exportVehicleReportCsv);
router.get('/vehicles/pdf', exportVehicleReportPdf);

module.exports = router;
