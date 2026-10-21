const express = require('express');
const router = express.Router();
const {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('admin'), getStaffList);
router.post('/', protect, authorize('admin'), createStaff);
router.put('/:id', protect, authorize('admin'), updateStaff);
router.delete('/:id', protect, authorize('admin'), deleteStaff);

module.exports = router;
