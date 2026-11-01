const User = require('../models/User');
const Issue = require('../models/Issue');
const Fine = require('../models/Fine');
const { isValidPersonName, isValidPhone, isValidEmail, sanitizePhone, isValidIdentifier } = require('../utils/validator');

// @desc    Get all users with filtering and search
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, branch } = req.query;
    const query = {};

    if (role && role !== 'all') {
      if (role === 'user' || role === 'student') {
        query.role = { $in: ['user', 'student'] };
      } else {
        query.role = role;
      }
    } else if (!role) {
      // Default to students when no explicit role is passed
      query.role = { $in: ['user', 'student'] };
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (branch && branch !== 'all') {
      query.branch = branch;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { studentId: regex }, { branch: regex }];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student/member records with loan & fine metrics (Staff, Admin)
// @route   GET /api/users/members
// @access  Private (Staff, Admin)
const getMemberRecords = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { role: { $in: ['user', 'student'] } };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { studentId: regex }];
    }

    const members = await User.find(query).select('-password').sort({ name: 1 });
    const now = new Date();

    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const issues = await Issue.find({ user: member._id });
        const activeIssues = issues.filter(i => i.status === 'issued');
        
        let overdueCount = 0;
        activeIssues.forEach(i => {
          if (i.dueDate && new Date(i.dueDate) < now) {
            overdueCount++;
          }
        });

        const fines = await Fine.find({ user: member._id });
        const pendingFine = fines
          .filter(f => f.paymentStatus === 'pending')
          .reduce((sum, f) => sum + f.totalFine, 0);

        return {
          ...member.toObject(),
          totalIssued: activeIssues.length,
          overdueBooks: overdueCount,
          pendingFine,
          paymentStatus: pendingFine > 0 ? 'Pending Fine' : 'Clear'
        };
      })
    );

    res.json({
      success: true,
      count: enrichedMembers.length,
      members: enrichedMembers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID with issue history
// @route   GET /api/users/:id
// @access  Private (Admin, Staff)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const issues = await Issue.find({ user: user._id })
      .populate('book', 'title author isbn bookId')
      .sort({ createdAt: -1 });

    const fines = await Fine.find({ user: user._id })
      .populate('book', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      issues,
      fines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user (Admin)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, address, studentId, branch, semYear } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
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
        message: 'Please provide a valid email address (e.g. student@college.edu)'
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

    if (studentId && studentId.trim() && !isValidIdentifier(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID. Alphanumeric and hyphens only (e.g. STU-2026-001).'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const autoStudentId = studentId && studentId.trim() ? studentId.trim() : `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: sanitizePhone(phone),
      studentId: autoStudentId,
      branch: branch || 'Computer Science & Engineering',
      semYear: semYear || '1st Sem / 1st Year',
      role: role || 'user',
      address: address ? address.trim() : ''
    });

    const sanitizedUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, address, isActive, password, studentId, branch, semYear } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Protection 1: Admin accounts can NEVER be deactivated
    if (user.role === 'admin' && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Administrator accounts are permanently active and cannot be deactivated to prevent system lockout.'
      });
    }

    // Protection 2: Cannot deactivate self
    if (req.user && user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own logged-in account.'
      });
    }

    // Protection 3: Cannot demote Administrator
    if (user.role === 'admin' && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrator accounts cannot be demoted to other roles.'
      });
    }

    if (name !== undefined) {
      if (!isValidPersonName(name)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid name. Name must contain only letters and spaces (2 to 50 characters).'
        });
      }
      user.name = name.trim();
    }

    if (phone !== undefined && phone !== '') {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Must be exactly 10 numeric digits starting with 6-9.'
        });
      }
      user.phone = sanitizePhone(phone);
    } else if (phone === '') {
      user.phone = '';
    }

    if (role) user.role = role;
    if (address !== undefined) user.address = address.trim();
    if (studentId !== undefined && studentId.trim()) user.studentId = studentId.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (semYear !== undefined) user.semYear = semYear.trim();
    if (isActive !== undefined) user.isActive = isActive;
    if (password && password.length >= 6) user.password = password;

    await user.save();

    const updated = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Protection 1: Admin accounts cannot be deleted
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrator accounts cannot be deleted.'
      });
    }

    // Protection 2: Cannot delete own account
    if (req.user && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account while logged in.'
      });
    }

    // Check if user has active issued books
    const activeIssues = await Issue.countDocuments({
      user: user._id,
      status: { $in: ['issued', 'pending'] }
    });

    if (activeIssues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user: user has ${activeIssues} active or pending book issue(s). Return books first.`
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getMemberRecords,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
