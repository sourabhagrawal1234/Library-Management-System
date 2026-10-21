const express = require('express');
const router = express.Router();
const {
  requestBook,
  approveRequest,
  rejectRequest,
  directIssue,
  returnBook,
  getMyIssues,
  getAllIssues
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/request', protect, requestBook);
router.get('/my', protect, getMyIssues);
router.get('/', protect, authorize('staff', 'admin'), getAllIssues);
router.post('/direct-issue', protect, authorize('staff', 'admin'), directIssue);
router.put('/:id/approve', protect, authorize('staff', 'admin'), approveRequest);
router.put('/:id/reject', protect, authorize('staff', 'admin'), rejectRequest);
router.put('/:id/return', protect, authorize('staff', 'admin'), returnBook);

module.exports = router;
