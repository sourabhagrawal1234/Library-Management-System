const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
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
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issueDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'issued', 'returned', 'overdue', 'rejected'],
      default: 'pending'
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

module.exports = mongoose.model('Issue', issueSchema);
