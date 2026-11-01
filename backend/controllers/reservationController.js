const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const User = require('../models/User');

/**
 * Automatically synchronizes reservation queues for books:
 * 1. Expires overdue 'available_for_pickup' reservations past their deadline.
 * 2. Compares physical availableCopies against active pickup holds.
 * 3. Automatically promotes oldest 'pending' reservations to 'available_for_pickup'
 *    whenever copies are returned, added, or freed up.
 * 4. Normalizes waitlist queue priorities (1, 2, 3...).
 */
const syncReservationStatuses = async (targetBookId = null) => {
  try {
    const bookFilter = targetBookId ? { _id: targetBookId } : {};
    const books = await Book.find(bookFilter);
    const now = new Date();

    for (const book of books) {
      // 1. Mark expired pickup holds as 'expired'
      const expiredHolds = await Reservation.find({
        book: book._id,
        status: 'available_for_pickup',
        pickupDeadline: { $lt: now }
      });

      for (const exp of expiredHolds) {
        exp.status = 'expired';
        exp.remarks = 'Pickup deadline elapsed without collection';
        await exp.save();
      }

      // 2. Count active holds currently holding a copy
      const activeHoldCount = await Reservation.countDocuments({
        book: book._id,
        status: 'available_for_pickup'
      });

      // 3. How many unreserved physical copies are available to be held?
      const freeSlots = Math.max(0, (book.availableCopies || 0) - activeHoldCount);

      if (freeSlots > 0) {
        const eligiblePending = await Reservation.find({
          book: book._id,
          status: 'pending'
        })
          .sort({ priority: 1, createdAt: 1 })
          .limit(freeSlots);

        for (const resv of eligiblePending) {
          resv.status = 'available_for_pickup';
          resv.notifiedAt = now;
          resv.pickupDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days hold
          resv.remarks = `Reserved copy ready for collection at Shelf ${book.shelfLocation || 'General Stack A'}`;
          await resv.save();
        }
      }

      // 4. Renumber remaining pending reservations priority
      const remainingPending = await Reservation.find({
        book: book._id,
        status: 'pending'
      }).sort({ createdAt: 1 });

      for (let i = 0; i < remainingPending.length; i++) {
        if (remainingPending[i].priority !== i + 1) {
          remainingPending[i].priority = i + 1;
          await remainingPending[i].save();
        }
      }
    }
  } catch (err) {
    console.error('Error in syncReservationStatuses:', err);
  }
};

// @desc    Reserve a book (Student/User)
// @route   POST /api/reservations
// @access  Private (User/Student)
const createReservation = async (req, res, next) => {
  try {
    const { bookId, remarks } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the book ID to reserve'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user already has an active reservation for this book
    const existing = await Reservation.findOne({
      book: book._id,
      user: req.user._id,
      status: { $in: ['pending', 'available_for_pickup'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active reservation for "${book.title}" (Status: ${existing.status.toUpperCase()}, Queue #${existing.priority})`
      });
    }

    // Check if user already currently has this book issued or pending request
    const existingIssue = await Issue.findOne({
      book: book._id,
      user: req.user._id,
      status: { $in: ['pending', 'approved', 'issued'] }
    });

    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: `You already currently have an active ${existingIssue.status} issue/request for this book`
      });
    }

    // First ensure reservation state is synchronized
    await syncReservationStatuses(book._id);

    const activeHolds = await Reservation.countDocuments({
      book: book._id,
      status: 'available_for_pickup'
    });
    const pendingCount = await Reservation.countDocuments({
      book: book._id,
      status: 'pending'
    });

    const freeSlots = Math.max(0, (book.availableCopies || 0) - activeHolds);

    let initialStatus = 'pending';
    let pickupDeadline = null;
    let notifiedAt = null;
    let priority = pendingCount + 1;

    // If a free copy is immediately available and no one else is waiting ahead
    if (freeSlots > 0 && pendingCount === 0) {
      initialStatus = 'available_for_pickup';
      notifiedAt = new Date();
      pickupDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      priority = 1;
    }

    const reservation = await Reservation.create({
      book: book._id,
      user: req.user._id,
      priority,
      status: initialStatus,
      pickupDeadline,
      notifiedAt,
      remarks: remarks || (initialStatus === 'available_for_pickup'
        ? `Copy ready for pickup on shelf ${book.shelfLocation || 'General Stack A'}`
        : `Waiting in reservation queue position #${priority}`)
    });

    const populated = await Reservation.findById(reservation._id)
      .populate('book', 'title author isbn bookId shelfLocation image availableCopies totalCopies')
      .populate('user', 'name email phone studentId branch');

    res.status(201).json({
      success: true,
      message: initialStatus === 'available_for_pickup'
        ? `Book reserved! A copy is currently available on shelf ${book.shelfLocation || 'General Stack A'}. Please pick it up within 3 days.`
        : `Book reserved successfully! You are #${priority} in the reservation queue. You will be notified as soon as a copy is returned.`,
      reservation: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reservations for logged-in user
// @route   GET /api/reservations/my
// @access  Private (User)
const getMyReservations = async (req, res, next) => {
  try {
    // Proactively sync all reservations so user sees real-time 'available_for_pickup' status
    await syncReservationStatuses();

    const reservations = await Reservation.find({ user: req.user._id })
      .populate('book', 'title author isbn bookId shelfLocation image availableCopies totalCopies status')
      .sort({ createdAt: -1 });

    // Dynamic queue recalculation for pending reservations
    const enhanced = await Promise.all(
      reservations.map(async (r) => {
        const item = r.toObject();
        if (r.status === 'pending') {
          const aheadCount = await Reservation.countDocuments({
            book: r.book?._id || r.book,
            status: 'pending',
            createdAt: { $lt: r.createdAt }
          });
          item.queuePosition = aheadCount + 1;
        }
        return item;
      })
    );

    res.json({
      success: true,
      count: enhanced.length,
      reservations: enhanced
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reservations across library (Staff/Admin)
// @route   GET /api/reservations
// @access  Private (Staff, Admin)
const getAllReservations = async (req, res, next) => {
  try {
    const { status, bookId, search } = req.query;

    // Sync state before serving
    await syncReservationStatuses(bookId || null);

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (bookId) {
      filter.book = bookId;
    }

    let reservations = await Reservation.find(filter)
      .populate('book', 'title author isbn bookId shelfLocation image availableCopies totalCopies')
      .populate('user', 'name email phone studentId branch semYear')
      .sort({ priority: 1, createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      reservations = reservations.filter(
        (r) =>
          r.user?.name?.toLowerCase().includes(q) ||
          r.user?.email?.toLowerCase().includes(q) ||
          r.user?.studentId?.toLowerCase().includes(q) ||
          r.book?.title?.toLowerCase().includes(q) ||
          r.book?.bookId?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private (User who reserved, Staff, Admin)
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found'
      });
    }

    // Permission check: only user themselves or staff/admin can cancel
    if (
      req.user.role === 'user' &&
      reservation.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel another user\'s reservation'
      });
    }

    if (['fulfilled', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Reservation is already ${reservation.status}`
      });
    }

    const wasActivePickup = reservation.status === 'available_for_pickup';
    const bookId = reservation.book;

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Automatically promote next in queue if active pickup slot was released
    await syncReservationStatuses(bookId);

    res.json({
      success: true,
      message: 'Reservation successfully cancelled',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fulfill reservation by issuing book to student (Staff/Admin)
// @route   POST /api/reservations/:id/fulfill
// @access  Private (Staff, Admin)
const fulfillReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('book')
      .populate('user');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found'
      });
    }

    if (reservation.status === 'fulfilled') {
      return res.status(400).json({
        success: false,
        message: 'This reservation has already been fulfilled'
      });
    }

    const book = await Book.findById(reservation.book._id);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot fulfill reservation: No physical copies currently available on shelf'
      });
    }

    const issueDays = parseInt(process.env.DEFAULT_ISSUE_DAYS || '14', 10);
    const now = new Date();
    const dueDate = new Date(now.getTime() + issueDays * 24 * 60 * 60 * 1000);

    // Create the active Issue record
    const issue = await Issue.create({
      user: reservation.user._id,
      book: book._id,
      requestedBy: reservation.user._id,
      approvedBy: req.user._id,
      issuedBy: req.user._id,
      issueDate: now,
      dueDate,
      status: 'issued',
      remarks: `Fulfilled from Reservation #${reservation._id.toString().slice(-6)}`
    });

    // Decrement available copies
    book.availableCopies -= 1;
    if (book.availableCopies <= 0) {
      book.status = 'Currently Unavailable';
    }
    await book.save();

    // Mark reservation fulfilled
    reservation.status = 'fulfilled';
    reservation.fulfilledAt = now;
    await reservation.save();

    // Re-sync queue for any remaining pending reservations
    await syncReservationStatuses(book._id);

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn bookId shelfLocation image')
      .populate('user', 'name email phone studentId branch');

    res.json({
      success: true,
      message: `Reservation fulfilled! Book "${book.title}" successfully issued to ${reservation.user.name}.`,
      issue: populatedIssue,
      reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim an 'available_for_pickup' reservation by student
// @route   POST /api/reservations/:id/claim
// @access  Private (User/Student)
const claimReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('book');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found'
      });
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to claim another member\'s reservation'
      });
    }

    if (reservation.status !== 'available_for_pickup') {
      return res.status(400).json({
        success: false,
        message: `Reservation is currently "${reservation.status}". Only books marked "Ready for Pickup" can be claimed.`
      });
    }

    // Check if user already has an active issue request
    const existing = await Issue.findOne({
      user: req.user._id,
      book: reservation.book._id,
      status: { $in: ['pending', 'approved', 'issued'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${existing.status} book request/issue for "${reservation.book.title}"`
      });
    }

    const issue = await Issue.create({
      user: req.user._id,
      book: reservation.book._id,
      requestedBy: req.user._id,
      status: 'pending',
      remarks: `Claimed from Ready Reservation #${reservation._id.toString().slice(-6)}`
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn bookId shelfLocation image')
      .populate('user', 'name email phone studentId branch');

    res.status(201).json({
      success: true,
      message: `Claim request submitted for "${reservation.book.title}"! Staff will issue the book at shelf "${reservation.book.shelfLocation || 'General Stack A'}".`,
      issue: populatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually promote a pending reservation to ready for pickup (Staff/Admin)
// @route   PUT /api/reservations/:id/promote
// @access  Private (Staff, Admin)
const promoteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('book').populate('user');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'available_for_pickup') {
      return res.status(400).json({
        success: false,
        message: 'This reservation is already ready for pickup'
      });
    }

    const now = new Date();
    reservation.status = 'available_for_pickup';
    reservation.notifiedAt = now;
    reservation.pickupDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    reservation.remarks = `Manually promoted by library staff. Ready for collection on shelf ${reservation.book?.shelfLocation || 'General Stack A'}`;
    await reservation.save();

    res.json({
      success: true,
      message: `Reservation for ${reservation.user.name} promoted to Ready for Pickup!`,
      reservation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncReservationStatuses,
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
  claimReservation,
  promoteReservation
};
