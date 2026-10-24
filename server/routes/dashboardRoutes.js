const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminDashboard, getDispatcherDashboard, getDriverDashboard,
  getPassengerDashboard, getUsersList, toggleUserStatus, createUser,
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/dispatcher', authorize('admin', 'dispatcher'), getDispatcherDashboard);
router.get('/driver', authorize('admin', 'driver'), getDriverDashboard);
router.get('/passenger', getPassengerDashboard);

// User management (admin only)
router.get('/admin/users', authorize('admin'), getUsersList);
router.post('/admin/users', authorize('admin'), createUser);
router.patch('/admin/users/:id/toggle-status', authorize('admin'), toggleUserStatus);

module.exports = router;
