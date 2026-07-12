const express = require('express');
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect, authorize(ROLES.FLEET_MANAGER));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);

module.exports = router;
