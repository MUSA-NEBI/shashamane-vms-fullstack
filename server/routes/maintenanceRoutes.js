const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMaintenanceRecords, getMaintenanceRecord,
  createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
} = require('../controllers/maintenanceController');

router.use(protect);

// Dispatchers can view and report maintenance issues
router.get('/', getMaintenanceRecords);
router.get('/:id', getMaintenanceRecord);
router.post('/', authorize('admin', 'dispatcher'), createMaintenanceRecord);

// Only admins can update/delete maintenance records
router.patch('/:id', authorize('admin'), updateMaintenanceRecord);
router.delete('/:id', authorize('admin'), deleteMaintenanceRecord);

module.exports = router;
