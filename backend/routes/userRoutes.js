const express = require('express');
const router = express.Router();
const {
  getUsers,
  getMemberRecords,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/members', protect, authorize('staff', 'admin'), getMemberRecords);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('staff', 'admin'), getUserById);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
