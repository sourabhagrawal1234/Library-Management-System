const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeId: {
      type: String,
      required: [true, 'Please provide employee ID'],
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Please provide department'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Please provide designation'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Staff', staffSchema);
