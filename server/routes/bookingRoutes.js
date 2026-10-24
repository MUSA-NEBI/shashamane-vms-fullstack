const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getBookings, getBooking, createBooking, cancelBookingHandler } = require('../controllers/bookingController');

router.use(protect);

router.get('/', getBookings);
router.get('/:id', getBooking);
router.post('/', createBooking);
router.post('/:id/cancel', cancelBookingHandler);

module.exports = router;
