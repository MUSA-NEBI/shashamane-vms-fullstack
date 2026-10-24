const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getTickets, getTicket, validateTicketHandler } = require('../controllers/ticketController');

router.use(protect);

router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/validate', authorize('admin', 'dispatcher', 'driver'), validateTicketHandler);

module.exports = router;
