const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createVehicleValidator, updateVehicleValidator } = require('../validators/vehicleValidators');
const {
  getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, getVehicleMaintenance,
} = require('../controllers/vehicleController');

// All vehicle routes require authentication
router.use(protect);

// Dispatchers can view vehicles
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.get('/:id/maintenance', getVehicleMaintenance);

// Only admins can create/update/delete vehicles (dispatchers read-only)
router.post('/', authorize('admin'), createVehicleValidator, validate, createVehicle);
router.patch('/:id', authorize('admin'), updateVehicleValidator, validate, updateVehicle);
router.delete('/:id', authorize('admin'), deleteVehicle);

module.exports = router;
