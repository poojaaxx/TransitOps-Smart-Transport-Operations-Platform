const express = require('express');
const {
  listVehicles,
  listAvailableVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const {
  uploadDocument,
  listDocuments,
  deleteDocument,
} = require('../controllers/vehicleDocumentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.get('/', listVehicles);
router.get('/available', listAvailableVehicles);
router.get('/:id', getVehicle);
router.get('/:id/documents', listDocuments);

router.post('/', authorize(ROLES.FLEET_MANAGER), createVehicle);
router.patch('/:id', authorize(ROLES.FLEET_MANAGER), updateVehicle);
router.delete('/:id', authorize(ROLES.FLEET_MANAGER), deleteVehicle);

router.post(
  '/:id/documents',
  authorize(ROLES.FLEET_MANAGER),
  upload.single('file'),
  uploadDocument
);
router.delete('/:id/documents/:docId', authorize(ROLES.FLEET_MANAGER), deleteDocument);

module.exports = router;
