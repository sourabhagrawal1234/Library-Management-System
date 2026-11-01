const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z][a-zA-Z\s.'\-]{1,49}$/.test(v);
        },
        message: 'Name must contain only letters and spaces (numbers or random symbols are not allowed)'
      }
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional on model level if not provided
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Phone number must be exactly 10 numeric digits starting with 6, 7, 8, or 9'
      }
    },
    studentId: {
      type: String,
      trim: true
    },
    semYear: {
      type: String,
      trim: true,
      default: '1st Sem / 1st Year'
    },
    branch: {
      type: String,
      trim: true,
      default: 'Computer Science & Engineering'
    },
    role: {
      type: String,
      enum: ['user', 'student', 'staff', 'admin'],
      default: 'student'
    },
    address: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    resetPasswordOtp: {
      type: String
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Sanitize phone number before validating
userSchema.pre('validate', function (next) {
  if (this.phone) {
    const { sanitizePhone } = require('../utils/validator');
    this.phone = sanitizePhone(this.phone);
  }
  next();
});

// Hash password before saving & protect Admin status
userSchema.pre('save', async function (next) {
  // Ensure Admin accounts are permanently active to prevent system lockouts
  if (this.role === 'admin') {
    this.isActive = true;
  }
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
