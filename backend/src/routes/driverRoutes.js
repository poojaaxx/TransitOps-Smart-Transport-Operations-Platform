const express = require('express');
const {
  listDrivers,
  listAvailableDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const { runLicenseExpiryCheck } = require('../jobs/licenseReminderJob');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/', listDrivers);
router.get('/available', listAvailableDrivers);
router.get('/:id', getDriver);

// Manual trigger for the license-expiry reminder sweep (demo convenience;
// it also runs automatically once a day via cron).
router.post(
  '/check-license-reminders',
  authorize(ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER),
  asyncHandler(async (req, res) => {
    const results = await runLicenseExpiryCheck();
    res.json({ checked: results.length, results });
  })
);

router.post('/', authorize(ROLES.FLEET_MANAGER), createDriver);
// Fleet Manager manages full driver records; Safety Officer can also update
// compliance-relevant fields (status/safetyScore) via the same endpoint.
router.patch('/:id', authorize(ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER), updateDriver);
router.delete('/:id', authorize(ROLES.FLEET_MANAGER), deleteDriver);

module.exports = router;
