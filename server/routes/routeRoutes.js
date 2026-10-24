const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getRoutes, getRoute, createRoute, updateRoute, deleteRoute, getOrigins } = require('../controllers/routeController');

// Public — passengers can see routes without logging in
router.get('/', getRoutes);
router.get('/origins', getOrigins);
router.get('/:id', getRoute);

// Protected routes
router.post('/', protect, authorize('admin'), createRoute);
router.patch('/:id', protect, authorize('admin'), updateRoute);
router.delete('/:id', protect, authorize('admin'), deleteRoute);

module.exports = router;
