const Payment = require('../models/Payment');
const Fine = require('../models/Fine');
const { generateTransactionId } = require('../utils/transactionId');

// @desc    Process payment for a fine
// @route   POST /api/payments/process
// @access  Private (User)
const processPayment = async (req, res, next) => {
  try {
    const { fineId, paymentMethod, upiId, utrNumber, cardNumber, cardExpiry, cardCvv, bank, receiptScreenshot } = req.body;

    if (!fineId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fine ID and payment method'
      });
    }

    if (!['UPI', 'Card', 'Net Banking'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Allowed: UPI, Card, Net Banking'
      });
    }

    let cleanUtr = null;
    let transactionId = null;

    // Strict Input Validation by Payment Method (Fail Fast)
    if (paymentMethod === 'UPI') {
      cleanUtr = (utrNumber || '').toString().trim();

      if (!cleanUtr) {
        return res.status(400).json({
          success: false,
          message: 'Please enter the 12-digit UTR / UPI Reference number from your PhonePe receipt'
        });
      }

      // Check strictly 12 numeric digits
      if (!/^\d{12}$/.test(cleanUtr)) {
        return res.status(400).json({
          success: false,
          message: `Invalid UTR format. UPI Reference Number must be exactly 12 numeric digits (e.g. 425619283746). You entered ${cleanUtr.length} digits.`
        });
      }

      // Reject all-identical repeating sequences (e.g. 000000000000, 111111111111)
      if (/^(\d)\1{11}$/.test(cleanUtr)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UTR format. Repeating numbers (like 000000000000 or 111111111111) are invalid.'
        });
      }

      // Reject obvious sequential dummy numbers
      const dummySequences = ['123456789012', '012345678901', '987654321098', '234567890123'];
      if (dummySequences.includes(cleanUtr)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UTR format. Sequential numbers like 123456789012 are not valid PhonePe reference numbers.'
        });
      }

      // Anti-Fraud Duplicate Check: Ensure UTR has not been used previously
      const existingPayment = await Payment.findOne({
        $or: [
          { utrNumber: cleanUtr },
          { transactionId: `UTR-${cleanUtr}` }
        ]
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: `This UTR (${cleanUtr}) has already been used for another payment. Duplicate transactions are strictly prohibited.`
        });
      }

      transactionId = `UTR-${cleanUtr}`;
    } else if (paymentMethod === 'Card') {
      const cleanCard = (cardNumber || '').toString().replace(/[\s-]/g, '');
      if (!cleanCard || !/^\d{16}$/.test(cleanCard)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Card Number. Must be exactly 16 numeric digits.'
        });
      }
      if (!cardCvv || !/^\d{3,4}$/.test((cardCvv || '').toString().trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid CVV. Must be 3 or 4 numeric digits.'
        });
      }
      transactionId = generateTransactionId();
    } else if (paymentMethod === 'Net Banking') {
      if (!bank || !bank.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please select your bank for Net Banking transfer.'
        });
      }
      transactionId = generateTransactionId();
    }

    const fine = await Fine.findById(fineId).populate('book', 'title author isbn bookId');

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine record not found'
      });
    }

    // Verify fine ownership if role is user
    if (req.user.role === 'user' && fine.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay fine for another user'
      });
    }

    if (fine.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been paid and settled'
      });
    }

    const paymentDate = new Date();

    const payment = await Payment.create({
      user: fine.user,
      fine: fine._id,
      amount: fine.totalFine,
      paymentMethod,
      transactionId,
      verificationStatus: 'verified',
      receiptScreenshot: receiptScreenshot || undefined,
      upiId: upiId || (paymentMethod === 'UPI' ? '9302732410@axl' : undefined),
      utrNumber: cleanUtr || undefined,
      payeeName: 'SOURABH AGRAWAL',
      payeeUpi: '9302732410@axl',
      paymentStatus: 'success',
      paymentDate
    });

    // Update fine status to paid
    fine.paymentStatus = 'paid';
    await fine.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title author isbn bookId' }
      });

    res.status(201).json({
      success: true,
      message: 'Payment verified and completed successfully',
      transactionId,
      payment: populatedPayment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's payment history
// @route   GET /api/payments/my
// @access  Private (User)
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title author isbn bookId' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment receipt by payment ID
// @route   GET /api/payments/:id/receipt
// @access  Private
const getPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title author isbn bookId shelfLocation' }
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this receipt'
      });
    }

    res.json({
      success: true,
      receipt: {
        receiptNo: payment.transactionId,
        paymentDate: payment.paymentDate,
        studentName: payment.user.name,
        studentEmail: payment.user.email,
        studentPhone: payment.user.phone,
        bookTitle: payment.fine.book ? payment.fine.book.title : 'Library Overdue Fine',
        bookAuthor: payment.fine.book ? payment.fine.book.author : 'N/A',
        bookId: payment.fine.book ? payment.fine.book.bookId : 'N/A',
        lateDays: payment.fine.lateDays,
        fineRate: payment.fine.fineRate,
        fineAmount: payment.amount,
        amountPaid: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        upiId: payment.upiId,
        utrNumber: payment.utrNumber,
        payeeName: payment.payeeName || 'SOURABH AGRAWAL',
        payeeUpi: payment.payeeUpi || '9302732410@axl',
        gateway: payment.gateway,
        gatewayPaymentId: payment.razorpayPaymentId,
        gatewayOrderId: payment.razorpayOrderId,
        cardLast4: payment.cardLast4,
        bank: payment.bank,
        wallet: payment.wallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (Staff, Admin)
// @route   GET /api/payments
// @access  Private (Staff, Admin)
const getAllPayments = async (req, res, next) => {
  try {
    const { method, search } = req.query;
    const query = {};

    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    let payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'fine',
        populate: { path: 'book', select: 'title author isbn bookId' }
      })
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      payments = payments.filter(p =>
        p.transactionId.toLowerCase().includes(term) ||
        (p.user && (p.user.name.toLowerCase().includes(term) || p.user.email.toLowerCase().includes(term))) ||
        (p.fine && p.fine.book && p.fine.book.title.toLowerCase().includes(term))
      );
    }

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      count: payments.length,
      totalCollected,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment verification status (Staff, Admin)
// @route   PUT /api/payments/:id/verify
// @access  Private (Staff, Admin)
const updatePaymentVerification = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const { verificationStatus } = req.body;
    if (!['verified', 'pending_verification', 'flagged'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    payment.verificationStatus = verificationStatus;
    await payment.save();

    res.json({
      success: true,
      message: `Payment status marked as ${verificationStatus}`,
      payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getMyPayments,
  getPaymentReceipt,
  getAllPayments,
  updatePaymentVerification
};
