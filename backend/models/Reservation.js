const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Please specify the book to reserve']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the student reserving the book']
    },
    reservationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'available_for_pickup', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending'
    },
    priority: {
      type: Number,
      default: 1
    },
    notifiedAt: {
      type: Date
    },
    pickupDeadline: {
      type: Date
    },
    fulfilledAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user's active reservations
reservationSchema.index({ book: 1, user: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
