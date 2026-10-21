const express = require('express');
const router = express.Router();
const {
  getUserDashboardStats,
  getStaffDashboardStats,
  getAdminDashboardStats,
  getDetailedReports
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/user-dashboard', protect, getUserDashboardStats);
router.get('/staff-dashboard', protect, authorize('staff', 'admin'), getStaffDashboardStats);
router.get('/admin-dashboard', protect, authorize('admin'), getAdminDashboardStats);
router.get('/detailed', protect, authorize('admin'), getDetailedReports);

module.exports = router;
