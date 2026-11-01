const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
  claimReservation,
  promoteReservation
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Student endpoints
router.post('/', protect, createReservation);
router.get('/my', protect, getMyReservations);
router.put('/:id/cancel', protect, cancelReservation);
router.post('/:id/claim', protect, claimReservation);

// Staff and Admin endpoints
router.get('/', protect, authorize('staff', 'admin'), getAllReservations);
router.post('/:id/fulfill', protect, authorize('staff', 'admin'), fulfillReservation);
router.put('/:id/promote', protect, authorize('staff', 'admin'), promoteReservation);

module.exports = router;
