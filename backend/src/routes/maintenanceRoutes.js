const express = require('express');
const {
  listMaintenance,
  getMaintenance,
  createMaintenance,
  closeMaintenance,
  updateMaintenance,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.get('/', listMaintenance);
router.get('/:id', getMaintenance);

router.post('/', authorize(ROLES.FLEET_MANAGER), createMaintenance);
router.patch('/:id', authorize(ROLES.FLEET_MANAGER), updateMaintenance);
router.patch('/:id/close', authorize(ROLES.FLEET_MANAGER), closeMaintenance);

module.exports = router;
