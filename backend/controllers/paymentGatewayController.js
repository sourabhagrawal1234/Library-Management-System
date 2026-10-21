const Payment = require('../models/Payment');
const Fine = require('../models/Fine');
const razorpay = require('../utils/razorpay');
const { generateTransactionId } = require('../utils/transactionId');

/**
 * Load a fine and make sure the logged-in user is allowed to pay it.
 */
const loadPayableFine = async (fineId, req, res) => {
  const fine = await Fine.findById(fineId).populate('book', 'title author isbn bookId');

  if (!fine) {
    res.status(404).json({ success: false, message: 'Fine record not found' });
    return null;
  }

  if (req.user.role === 'user' && fine.user.toString() !== req.user._id.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to pay fine for another user' });
    return null;
  }

  if (fine.paymentStatus === 'paid') {
    res.status(400).json({ success: false, message: 'This fine has already been paid and settled' });
    return null;
  }

  if (!fine.totalFine || fine.totalFine <= 0) {
    res.status(400).json({ success: false, message: 'There is no payable amount on this fine' });
    return null;
  }

  return fine;
};

// @desc    Public gateway config for the checkout widget
// @route   GET /api/payments/config
// @access  Private
const getGatewayConfig = async (req, res) => {
  const { keyId } = razorpay.getKeys();
  res.json({
    success: true,
    enabled: razorpay.isConfigured(),
    keyId: keyId || null,
    currency: 'INR',
    // Methods offered by the online gateway; cash is handled at the counter.
    methods: ['Card', 'UPI', 'QR', 'Net Banking', 'Wallet']
  });
};

// @desc    Create a Razorpay order for a fine
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { fineId } = req.body;

    if (!fineId) {
      return res.status(400).json({ success: false, message: 'Please provide the fine ID' });
    }

    if (!razorpay.isConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env'
      });
    }

    const fine = await loadPayableFine(fineId, req, res);
    if (!fine) return undefined;

    const order = await razorpay.createOrder({
      amountInRupees: fine.totalFine,
      receipt: `fine_${fine._id.toString().slice(-12)}`,
      notes: {
        fineId: fine._id.toString(),
        userId: req.user._id.toString(),
        book: fine.book ? fine.book.title : 'Library fine'
      }
    });

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      keyId: razorpay.getKeys().keyId,
      amountInRupees: fine.totalFine,
      customer: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone || ''
      },
      description: fine.book ? `Library fine — ${fine.book.title}` : 'Library overdue fine'
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Verify a completed Razorpay checkout and settle the fine
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { fineId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!fineId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete payment confirmation data received from the gateway'
      });
    }

    const signatureValid = razorpay.verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!signatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. This transaction was rejected.'
      });
    }

    // Idempotency: the same gateway payment can only settle one fine record.
    const already = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (already) {
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded',
        payment: already,
        paymentId: already._id
      });
    }

    const fine = await loadPayableFine(fineId, req, res);
    if (!fine) return undefined;

    // Re-check the payment server-side with Razorpay (never trust the browser).
    const rzpPayment = await razorpay.fetchPayment(razorpay_payment_id);

    if (rzpPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Order mismatch. Payment rejected.' });
    }

    if (!['captured', 'authorized'].includes(rzpPayment.status)) {
      return res.status(400).json({
        success: false,
        message: `Payment was not successful (status: ${rzpPayment.status})`
      });
    }

    const paidRupees = Number(rzpPayment.amount) / 100;
    if (Math.round(paidRupees) < Math.round(fine.totalFine)) {
      return res.status(400).json({
        success: false,
        message: `Amount paid (₹${paidRupees}) is less than the fine due (₹${fine.totalFine}).`
      });
    }

    const payment = await Payment.create({
      user: fine.user,
      fine: fine._id,
      amount: paidRupees,
      paymentMethod: razorpay.mapMethod(rzpPayment),
      gateway: 'razorpay',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      upiId: rzpPayment.vpa || undefined,
      utrNumber:
        (rzpPayment.acquirer_data && (rzpPayment.acquirer_data.rrn || rzpPayment.acquirer_data.upi_transaction_id)) ||
        undefined,
      cardLast4: rzpPayment.card ? rzpPayment.card.last4 : undefined,
      bank: rzpPayment.bank || undefined,
      wallet: rzpPayment.wallet || undefined,
      paymentStatus: 'success',
      verificationStatus: 'verified',
      paymentDate: new Date()
    });

    fine.paymentStatus = 'paid';
    await fine.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('user', 'name email phone')
      .populate({ path: 'fine', populate: { path: 'book', select: 'title author isbn bookId' } });

    return res.status(201).json({
      success: true,
      message: 'Payment successful. Your fine has been cleared.',
      paymentId: payment._id,
      transactionId: payment.transactionId,
      payment: populatedPayment
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Student requests to pay a fine in cash at the library counter
// @route   POST /api/payments/cash/request
// @access  Private
const requestCashPayment = async (req, res, next) => {
  try {
    const { fineId } = req.body;
    if (!fineId) {
      return res.status(400).json({ success: false, message: 'Please provide the fine ID' });
    }

    const fine = await loadPayableFine(fineId, req, res);
    if (!fine) return undefined;

    const existing = await Payment.findOne({
      fine: fine._id,
      paymentMethod: 'Cash',
      paymentStatus: 'pending'
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'A cash payment request is already pending at the counter',
        paymentId: existing._id,
        payment: existing
      });
    }

    const payment = await Payment.create({
      user: fine.user,
      fine: fine._id,
      amount: fine.totalFine,
      paymentMethod: 'Cash',
      gateway: 'offline',
      transactionId: generateTransactionId(),
      paymentStatus: 'pending',
      verificationStatus: 'pending_verification',
      paymentDate: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Cash payment requested. Please pay at the library counter to receive your receipt.',
      paymentId: payment._id,
      payment
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Staff/Admin confirms cash received at the counter (settles the fine)
// @route   POST /api/payments/cash/collect
// @access  Private (Staff, Admin)
const collectCashPayment = async (req, res, next) => {
  try {
    const { fineId, paymentId } = req.body;

    let payment = null;

    if (paymentId) {
      payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Cash payment request not found' });
      }
      if (payment.paymentStatus === 'success') {
        return res.status(400).json({ success: false, message: 'This payment is already settled' });
      }
    }

    const targetFineId = payment ? payment.fine : fineId;
    if (!targetFineId) {
      return res.status(400).json({ success: false, message: 'Please provide a fine ID or payment ID' });
    }

    const fine = await loadPayableFine(targetFineId, req, res);
    if (!fine) return undefined;

    if (!payment) {
      payment = await Payment.create({
        user: fine.user,
        fine: fine._id,
        amount: fine.totalFine,
        paymentMethod: 'Cash',
        gateway: 'offline',
        transactionId: generateTransactionId(),
        paymentStatus: 'pending',
        verificationStatus: 'pending_verification',
        paymentDate: new Date()
      });
    }

    payment.amount = fine.totalFine;
    payment.paymentStatus = 'success';
    payment.verificationStatus = 'verified';
    payment.collectedBy = req.user._id;
    payment.paymentDate = new Date();
    await payment.save();

    fine.paymentStatus = 'paid';
    await fine.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('user', 'name email phone')
      .populate({ path: 'fine', populate: { path: 'book', select: 'title author isbn bookId' } });

    return res.json({
      success: true,
      message: 'Cash payment recorded. Receipt is ready.',
      paymentId: payment._id,
      payment: populatedPayment
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Razorpay webhook (payment.captured / payment.failed)
// @route   POST /api/payments/webhook
// @access  Public (signature verified)
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

    if (!razorpay.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const entity =
      event && event.payload && event.payload.payment && event.payload.payment.entity;

    if (event.event === 'payment.captured' && entity) {
      const existing = await Payment.findOne({ razorpayPaymentId: entity.id });
      const fineId = entity.notes && entity.notes.fineId;

      if (!existing && fineId) {
        const fine = await Fine.findById(fineId);
        if (fine && fine.paymentStatus !== 'paid') {
          await Payment.create({
            user: fine.user,
            fine: fine._id,
            amount: Number(entity.amount) / 100,
            paymentMethod: razorpay.mapMethod(entity),
            gateway: 'razorpay',
            transactionId: entity.id,
            razorpayOrderId: entity.order_id,
            razorpayPaymentId: entity.id,
            upiId: entity.vpa || undefined,
            cardLast4: entity.card ? entity.card.last4 : undefined,
            bank: entity.bank || undefined,
            wallet: entity.wallet || undefined,
            paymentStatus: 'success',
            verificationStatus: 'verified',
            paymentDate: new Date()
          });
          fine.paymentStatus = 'paid';
          await fine.save();
        }
      }
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error.message);
    return res.status(200).json({ success: false });
  }
};

module.exports = {
  getGatewayConfig,
  createOrder,
  verifyPayment,
  requestCashPayment,
  collectCashPayment,
  handleWebhook
};
