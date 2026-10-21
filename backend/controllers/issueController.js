const Issue = require('../models/Issue');
const Book = require('../models/Book');
const Fine = require('../models/Fine');
const User = require('../models/User');
const { calculateFine } = require('../utils/fineCalculator');

// @desc    Request a book (Student/User)
// @route   POST /api/issues/request
// @access  Private (User, Staff, Admin)
const requestBook = async (req, res, next) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide book ID'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This book is currently unavailable'
      });
    }

    // Check if user already has an active issue or pending request for this book
    const existingActive = await Issue.findOne({
      user: req.user._id,
      book: book._id,
      status: { $in: ['pending', 'approved', 'issued'] }
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${existingActive.status} request/issue for this book`
      });
    }

    const issue = await Issue.create({
      user: req.user._id,
      book: book._id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn bookId image shelfLocation')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Book request submitted successfully. Pending staff approval.',
      issue: populatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a book request (Staff/Admin)
// @route   PUT /api/issues/:id/approve
// @access  Private (Staff, Admin)
const approveRequest = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue request not found'
      });
    }

    if (issue.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status: ${issue.status}`
      });
    }

    const book = await Book.findById(issue.book);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available copies left for this book'
      });
    }

    const issueDays = parseInt(process.env.DEFAULT_ISSUE_DAYS || '14', 10);
    const now = new Date();
    const due = new Date(now.getTime() + issueDays * 24 * 60 * 60 * 1000);

    issue.status = 'issued';
    issue.approvedBy = req.user._id;
    issue.issuedBy = req.user._id;
    issue.issueDate = now;
    issue.dueDate = due;
    if (req.body.remarks) issue.remarks = req.body.remarks;

    await issue.save();

    // Decrement available copies
    book.availableCopies -= 1;
    if (book.availableCopies <= 0) {
      book.status = 'Currently Unavailable';
    }
    await book.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn bookId shelfLocation image')
      .populate('user', 'name email phone')
      .populate('approvedBy', 'name');

    res.json({
      success: true,
      message: 'Book request approved and book issued successfully',
      issue: populatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a book request (Staff/Admin)
// @route   PUT /api/issues/:id/reject
// @access  Private (Staff, Admin)
const rejectRequest = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue request not found'
      });
    }

    if (issue.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${issue.status}`
      });
    }

    issue.status = 'rejected';
    issue.approvedBy = req.user._id;
    issue.remarks = remarks || 'Request declined by library staff';
    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email');

    res.json({
      success: true,
      message: 'Book request rejected',
      issue: populatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Directly issue book to user (Staff/Admin)
// @route   POST /api/issues/direct-issue
// @access  Private (Staff, Admin)
const directIssue = async (req, res, next) => {
  try {
    const { userEmail, bookId, days } = req.body;

    if (!userEmail || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user email and book ID'
      });
    }

    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with provided email'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available copies for this book'
      });
    }

    const issueDays = days ? parseInt(days, 10) : parseInt(process.env.DEFAULT_ISSUE_DAYS || '14', 10);
    const now = new Date();
    const due = new Date(now.getTime() + issueDays * 24 * 60 * 60 * 1000);

    const issue = await Issue.create({
      user: user._id,
      book: book._id,
      requestedBy: user._id,
      approvedBy: req.user._id,
      issuedBy: req.user._id,
      issueDate: now,
      dueDate: due,
      status: 'issued'
    });

    book.availableCopies -= 1;
    if (book.availableCopies <= 0) {
      book.status = 'Currently Unavailable';
    }
    await book.save();

    const populated = await Issue.findById(issue._id)
      .populate('book', 'title author isbn bookId shelfLocation image')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: `Book successfully issued to ${user.name}`,
      issue: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process book return with automatic backend fine calculation (Staff/Admin)
// @route   PUT /api/issues/:id/return
// @access  Private (Staff, Admin)
const returnBook = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('book')
      .populate('user', 'name email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found'
      });
    }

    if (issue.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been marked as returned'
      });
    }

    const returnDate = new Date();
    const { lateDays, fineRate, totalFine } = calculateFine(issue.dueDate, returnDate);

    issue.status = 'returned';
    issue.returnDate = returnDate;
    await issue.save();

    // Increment available book copies
    const book = await Book.findById(issue.book._id);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      if (book.availableCopies > 0 && book.status === 'Currently Unavailable') {
        book.status = 'Available';
      }
      await book.save();
    }

    let fineRecord = null;
    if (lateDays > 0 && totalFine > 0) {
      fineRecord = await Fine.create({
        user: issue.user._id,
        book: issue.book._id,
        issue: issue._id,
        dueDate: issue.dueDate,
        returnDate,
        lateDays,
        fineRate,
        totalFine,
        paymentStatus: 'pending'
      });
    }

    res.json({
      success: true,
      message: lateDays > 0 
        ? `Book returned successfully. Overdue by ${lateDays} days. Fine generated: ₹${totalFine}`
        : 'Book returned successfully on time. No fine incurred.',
      issue,
      fine: fineRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's issues & requests
// @route   GET /api/issues/my
// @access  Private (User)
const getMyIssues = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const issues = await Issue.find(query)
      .populate('book', 'title author isbn bookId image shelfLocation')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Attach dynamic due soon / overdue badges and fine previews
    const enhancedIssues = await Promise.all(
      issues.map(async (issue) => {
        const item = issue.toObject();

        if (issue.status === 'issued' && issue.dueDate) {
          const due = new Date(issue.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            item.computedStatus = 'overdue';
            item.overdueDays = Math.abs(diffDays);
            item.currentFine = item.overdueDays * 10;
          } else if (diffDays <= 3) {
            item.computedStatus = 'due-soon';
            item.daysLeft = diffDays;
          } else {
            item.computedStatus = 'active';
            item.daysLeft = diffDays;
          }
        } else {
          item.computedStatus = issue.status;
        }

        // Attach fine if exists
        const fine = await Fine.findOne({ issue: issue._id });
        if (fine) {
          item.fine = fine;
        }

        return item;
      })
    );

    res.json({
      success: true,
      count: enhancedIssues.length,
      issues: enhancedIssues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues with filters (Staff, Admin)
// @route   GET /api/issues
// @access  Private (Staff, Admin)
const getAllIssues = async (req, res, next) => {
  try {
    const { status, search, overdue } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    let issues = await Issue.find(query)
      .populate('book', 'title author isbn bookId shelfLocation image')
      .populate('user', 'name email phone')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();

    let enhanced = await Promise.all(
      issues.map(async (issue) => {
        const item = issue.toObject();

        if (issue.status === 'issued' && issue.dueDate) {
          const due = new Date(issue.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            item.computedStatus = 'overdue';
            item.overdueDays = Math.abs(diffDays);
            item.estimatedFine = item.overdueDays * 10;
          } else if (diffDays <= 3) {
            item.computedStatus = 'due-soon';
            item.daysLeft = diffDays;
          } else {
            item.computedStatus = 'active';
            item.daysLeft = diffDays;
          }
        } else {
          item.computedStatus = issue.status;
        }

        const fine = await Fine.findOne({ issue: issue._id });
        if (fine) {
          item.fine = fine;
        }

        return item;
      })
    );

    if (overdue === 'true') {
      enhanced = enhanced.filter(i => i.computedStatus === 'overdue');
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      enhanced = enhanced.filter(i => 
        (i.user && (i.user.name.toLowerCase().includes(term) || i.user.email.toLowerCase().includes(term))) ||
        (i.book && (i.book.title.toLowerCase().includes(term) || i.book.isbn.toLowerCase().includes(term) || i.book.bookId.toLowerCase().includes(term)))
      );
    }

    res.json({
      success: true,
      count: enhanced.length,
      issues: enhanced
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestBook,
  approveRequest,
  rejectRequest,
  directIssue,
  returnBook,
  getMyIssues,
  getAllIssues
};
