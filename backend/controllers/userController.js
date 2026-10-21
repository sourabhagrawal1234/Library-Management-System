const User = require('../models/User');
const Issue = require('../models/Issue');
const Fine = require('../models/Fine');

// @desc    Get all users with filtering and search
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
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
    const query = { role: 'user' };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
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
    const { name, email, password, phone, role, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: role || 'user',
      address: address || ''
    });

    const sanitizedUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
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
    const { name, phone, role, address, isActive, password } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (address !== undefined) user.address = address;
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
