const express = require('express');
const router = express.Router();
const {
  getMyFines,
  getAllFines,
  getFineById
} = require('../controllers/fineController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/my', protect, getMyFines);
router.get('/', protect, authorize('staff', 'admin'), getAllFines);
router.get('/:id', protect, getFineById);

module.exports = router;
