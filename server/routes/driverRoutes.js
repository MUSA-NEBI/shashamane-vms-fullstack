const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } = require('../controllers/driverController');

router.use(protect);

router.get('/', getDrivers);
router.get('/:id', getDriver);
router.post('/', authorize('admin'), createDriver);
router.patch('/:id', authorize('admin'), updateDriver);
router.delete('/:id', authorize('admin'), deleteDriver);

module.exports = router;
