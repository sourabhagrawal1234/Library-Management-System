const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fine',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'Net Banking', 'QR', 'Wallet', 'Cash'],
      required: true
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'offline', 'manual'],
      default: 'razorpay'
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    paymentStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending_verification', 'flagged'],
      default: 'verified'
    },

    // ---- Razorpay gateway fields ----
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    razorpaySignature: {
      type: String
    },
    cardLast4: {
      type: String
    },
    bank: {
      type: String
    },
    wallet: {
      type: String
    },

    // ---- Cash at counter ----
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    receiptScreenshot: {
      type: String
    },
    upiId: {
      type: String
    },
    utrNumber: {
      type: String,
      index: true
    },
    payeeName: {
      type: String,
      default: 'SOURABH AGRAWAL'
    },
    payeeUpi: {
      type: String,
      default: '9302732410@axl'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
