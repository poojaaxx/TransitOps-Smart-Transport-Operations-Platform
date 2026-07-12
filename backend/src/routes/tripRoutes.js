const express = require('express');
const {
  listTrips,
  getTrip,
  createTrip,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  deleteTrip,
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.get('/', listTrips);
router.get('/:id', getTrip);

router.post('/', authorize(ROLES.FLEET_MANAGER), createTrip);
router.patch('/:id', authorize(ROLES.FLEET_MANAGER), updateTrip);
router.delete('/:id', authorize(ROLES.FLEET_MANAGER), deleteTrip);

router.post('/:id/dispatch', authorize(ROLES.FLEET_MANAGER), dispatchTrip);
router.post('/:id/complete', authorize(ROLES.FLEET_MANAGER), completeTrip);
router.post('/:id/cancel', authorize(ROLES.FLEET_MANAGER), cancelTrip);

module.exports = router;
