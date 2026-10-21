const Book = require('../models/Book');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Issue = require('../models/Issue');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const Category = require('../models/Category');

// @desc    Get metrics for User Dashboard
// @route   GET /api/reports/user-dashboard
// @access  Private (User)
const getUserDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const userIssues = await Issue.find({ user: userId })
      .populate('book', 'title author isbn bookId image')
      .sort({ createdAt: -1 });

    const activeIssues = userIssues.filter(i => i.status === 'issued');
    const pendingRequests = userIssues.filter(i => i.status === 'pending');

    let dueSoonCount = 0;
    let overdueCount = 0;

    activeIssues.forEach(i => {
      if (i.dueDate) {
        const diffDays = Math.ceil((new Date(i.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) overdueCount++;
        else if (diffDays <= 3) dueSoonCount++;
      }
    });

    const userFines = await Fine.find({ user: userId });
    const currentFine = userFines
      .filter(f => f.paymentStatus === 'pending')
      .reduce((sum, f) => sum + f.totalFine, 0);
    const paidFine = userFines
      .filter(f => f.paymentStatus === 'paid')
      .reduce((sum, f) => sum + f.totalFine, 0);

    const recentPayments = await Payment.find({ user: userId })
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentIssues = userIssues.slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalIssued: activeIssues.length,
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        currentFine,
        paidFine,
        pendingRequests: pendingRequests.length
      },
      recentIssues,
      recentPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get metrics for Staff Dashboard
// @route   GET /api/reports/staff-dashboard
// @access  Private (Staff, Admin)
const getStaffDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const totalBooks = await Book.countDocuments();
    const books = await Book.find();
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);

    const allIssues = await Issue.find();
    const issuedBooks = allIssues.filter(i => i.status === 'issued').length;
    const pendingRequests = allIssues.filter(i => i.status === 'pending').length;
    const returnedBooks = allIssues.filter(i => i.status === 'returned').length;

    let overdueBooks = 0;
    allIssues.forEach(i => {
      if (i.status === 'issued' && i.dueDate && new Date(i.dueDate) < now) {
        overdueBooks++;
      }
    });

    const fines = await Fine.find();
    const pendingFines = fines.filter(f => f.paymentStatus === 'pending').reduce((sum, f) => sum + f.totalFine, 0);

    const recentRequests = await Issue.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('book', 'title author isbn bookId availableCopies image')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReturns = await Issue.find({ status: 'returned' })
      .populate('user', 'name email')
      .populate('book', 'title isbn')
      .sort({ returnDate: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalBooks,
        availableBooks,
        issuedBooks,
        pendingRequests,
        overdueBooks,
        pendingFines,
        returnedBooks
      },
      recentRequests,
      recentReturns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get metrics for Admin Dashboard
// @route   GET /api/reports/admin-dashboard
// @access  Private (Admin)
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalStaff = await Staff.countDocuments();
    const totalBooks = await Book.countDocuments();
    
    const books = await Book.find();
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);

    const allIssues = await Issue.find();
    const issuedBooks = allIssues.filter(i => i.status === 'issued').length;

    let overdueBooks = 0;
    allIssues.forEach(i => {
      if (i.status === 'issued' && i.dueDate && new Date(i.dueDate) < now) {
        overdueBooks++;
      }
    });

    const fines = await Fine.find();
    const totalFines = fines.reduce((sum, f) => sum + f.totalFine, 0);
    const paidFines = fines.filter(f => f.paymentStatus === 'paid').reduce((sum, f) => sum + f.totalFine, 0);
    const pendingFines = fines.filter(f => f.paymentStatus === 'pending').reduce((sum, f) => sum + f.totalFine, 0);

    const payments = await Payment.find();
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    const recentIssues = await Issue.find({ status: 'issued' })
      .populate('user', 'name email')
      .populate('book', 'title author isbn bookId')
      .sort({ issueDate: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const categories = await Category.find();
    const totalCategories = categories.length;
    const categoryDistribution = await Promise.all(
      categories.map(async (cat) => {
        const count = await Book.countDocuments({ category: cat._id });
        return {
          category: cat.name,
          bookCount: count
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStaff,
        totalBooks,
        totalCategories,
        availableBooks,
        issuedBooks,
        overdueBooks,
        totalFines,
        paidFines,
        pendingFines,
        totalPayments
      },
      categoryDistribution,
      recentIssues,
      recentPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytical reports with time range filters
// @route   GET /api/reports/detailed
// @access  Private (Admin)
const getDetailedReports = async (req, res, next) => {
  try {
    const { timeRange } = req.query; // 'today', 'week', 'month', 'all'
    const now = new Date();
    let startDate = new Date(0); // beginning of time

    if (timeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const issues = await Issue.find({ createdAt: { $gte: startDate } })
      .populate('book', 'title category')
      .populate('user', 'name email');

    const payments = await Payment.find({ createdAt: { $gte: startDate } });
    const fines = await Fine.find({ createdAt: { $gte: startDate } });

    const totalIssues = issues.filter(i => ['issued', 'returned'].includes(i.status)).length;
    const totalReturns = issues.filter(i => i.status === 'returned').length;
    const fineCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const finePending = fines.filter(f => f.paymentStatus === 'pending').reduce((sum, f) => sum + f.totalFine, 0);

    // Most issued books aggregation
    const bookFrequency = {};
    issues.forEach(i => {
      if (i.book && i.book.title) {
        bookFrequency[i.book.title] = (bookFrequency[i.book.title] || 0) + 1;
      }
    });

    const mostIssuedBooks = Object.entries(bookFrequency)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Category distribution
    const categories = await Category.find();
    const categoryDistribution = await Promise.all(
      categories.map(async cat => {
        const count = await Book.countDocuments({ category: cat._id });
        return {
          category: cat.name,
          bookCount: count
        };
      })
    );

    res.json({
      success: true,
      timeRange: timeRange || 'all',
      summary: {
        totalIssues,
        totalReturns,
        fineCollected,
        finePending
      },
      mostIssuedBooks,
      categoryDistribution
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDashboardStats,
  getStaffDashboardStats,
  getAdminDashboardStats,
  getDetailedReports
};
