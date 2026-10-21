const Fine = require('../models/Fine');

// @desc    Get current user's fines
// @route   GET /api/fines/my
// @access  Private (User)
const getMyFines = async (req, res, next) => {
  try {
    const fines = await Fine.find({ user: req.user._id })
      .populate('book', 'title author isbn bookId image')
      .populate('issue', 'issueDate dueDate returnDate')
      .sort({ createdAt: -1 });

    const totalPending = fines
      .filter(f => f.paymentStatus === 'pending')
      .reduce((sum, f) => sum + f.totalFine, 0);

    const totalPaid = fines
      .filter(f => f.paymentStatus === 'paid')
      .reduce((sum, f) => sum + f.totalFine, 0);

    res.json({
      success: true,
      count: fines.length,
      totalPending,
      totalPaid,
      fines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fines (Staff, Admin)
// @route   GET /api/fines
// @access  Private (Staff, Admin)
const getAllFines = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    let fines = await Fine.find(query)
      .populate('user', 'name email phone')
      .populate('book', 'title author isbn bookId')
      .populate('issue', 'issueDate dueDate returnDate')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      fines = fines.filter(f =>
        (f.user && (f.user.name.toLowerCase().includes(term) || f.user.email.toLowerCase().includes(term))) ||
        (f.book && (f.book.title.toLowerCase().includes(term) || f.book.isbn.toLowerCase().includes(term)))
      );
    }

    const totalFineAmount = fines.reduce((sum, f) => sum + f.totalFine, 0);
    const paidAmount = fines.filter(f => f.paymentStatus === 'paid').reduce((sum, f) => sum + f.totalFine, 0);
    const pendingAmount = fines.filter(f => f.paymentStatus === 'pending').reduce((sum, f) => sum + f.totalFine, 0);

    res.json({
      success: true,
      count: fines.length,
      totalFineAmount,
      paidAmount,
      pendingAmount,
      fines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fine by ID
// @route   GET /api/fines/:id
// @access  Private
const getFineById = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('book', 'title author isbn bookId image shelfLocation')
      .populate('issue', 'issueDate dueDate returnDate');

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine record not found'
      });
    }

    // If regular user, ensure fine belongs to them
    if (req.user.role === 'user' && fine.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this fine'
      });
    }

    res.json({
      success: true,
      fine
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyFines,
  getAllFines,
  getFineById
};
