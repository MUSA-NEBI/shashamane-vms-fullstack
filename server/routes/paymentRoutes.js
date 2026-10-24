const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { initiatePayment, confirmPayment, getPayments, refundPayment } = require('../controllers/paymentController');

router.use(protect);

router.get('/', getPayments);
router.post('/initiate', initiatePayment);
router.post('/:id/confirm', confirmPayment);
router.post('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;
