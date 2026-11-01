const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z][a-zA-Z0-9\s&,\-/]*$/.test(v) && /[a-zA-Z]{2,}/.test(v);
        },
        message: 'Category name must start with a letter and contain valid alphabets. Numbers-only or special symbols are not allowed.'
      }
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Category', categorySchema);
