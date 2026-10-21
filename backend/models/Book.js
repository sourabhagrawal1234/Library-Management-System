const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: [true, 'Please provide Book ID'],
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Please provide book title'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Please provide author name'],
      trim: true
    },
    isbn: {
      type: String,
      required: [true, 'Please provide ISBN'],
      unique: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide category']
    },
    publisher: {
      type: String,
      default: ''
    },
    publicationYear: {
      type: Number
    },
    description: {
      type: String,
      default: ''
    },
    shelfLocation: {
      type: String,
      required: [true, 'Please provide shelf location'],
      default: 'General Stack A'
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0
    },
    availableCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    },
    status: {
      type: String,
      enum: ['Available', 'Currently Unavailable', 'Maintenance'],
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
);

// Middleware to sync status with available copies
bookSchema.pre('save', function (next) {
  if (this.availableCopies <= 0) {
    this.status = 'Currently Unavailable';
  } else if (this.status === 'Currently Unavailable' && this.availableCopies > 0) {
    this.status = 'Available';
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
