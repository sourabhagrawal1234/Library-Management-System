const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidPersonName, isValidPhone, isValidEmail, sanitizePhone } = require('../utils/validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_library_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, studentId, semYear, branch } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (!isValidPersonName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name. Name must contain only letters and spaces (2 to 50 characters). Numbers and special symbols are not allowed.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. name@domain.com)'
      });
    }

    if (phone && phone.trim()) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Must be exactly 10 numeric digits starting with 6, 7, 8, or 9 (na kam, na jaada).'
        });
      }
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const autoStudentId = studentId && studentId.trim()
      ? studentId.trim()
      : `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: sanitizePhone(phone),
      studentId: autoStudentId,
      semYear: semYear || '1st Sem / 1st Year',
      branch: branch || 'Computer Science & Engineering',
      password,
      role: 'user'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        semYear: user.semYear,
        branch: user.branch,
        role: user.role,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact library administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        semYear: user.semYear,
        branch: user.branch,
        role: user.role,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, semYear, branch, studentId } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) {
      if (!isValidPersonName(name)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid name. Name must contain only letters and spaces (2 to 50 characters). Numbers and special characters are not allowed.'
        });
      }
      user.name = name.trim();
    }

    if (phone !== undefined && phone !== '') {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Must be exactly 10 numeric digits starting with 6, 7, 8, or 9 (na kam, na jaada).'
        });
      }
      user.phone = sanitizePhone(phone);
    } else if (phone === '') {
      user.phone = '';
    }

    if (address !== undefined) user.address = address ? address.trim() : '';
    if (semYear !== undefined) user.semYear = semYear;
    if (branch !== undefined) user.branch = branch;
    if (studentId !== undefined && studentId.trim()) {
      if (!isValidIdentifier(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Student ID. Alphanumeric and hyphens only.'
        });
      }
      user.studentId = studentId.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        semYear: user.semYear,
        branch: user.branch,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Generate OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Password reset OTP has been sent. Your OTP is: ${otp}`,
      otp,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    if (!user.resetPasswordExpire || user.resetPasswordExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset OTP has expired. Please request a new OTP.'
      });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
