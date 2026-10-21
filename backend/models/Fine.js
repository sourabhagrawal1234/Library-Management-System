const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      required: true
    },
    lateDays: {
      type: Number,
      required: true,
      default: 0
    },
    fineRate: {
      type: Number,
      required: true,
      default: 10
    },
    totalFine: {
      type: Number,
      required: true,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Fine', fineSchema);
