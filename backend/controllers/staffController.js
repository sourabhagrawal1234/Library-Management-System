const Staff = require('../models/Staff');
const User = require('../models/User');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Admin)
const getStaffList = async (req, res, next) => {
  try {
    const staffMembers = await Staff.find()
      .populate('user', 'name email phone role isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: staffMembers.length,
      staff: staffMembers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new staff member (Creates User with role 'staff' and Staff profile)
// @route   POST /api/staff
// @access  Private (Admin)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, employeeId, department, designation } = req.body;

    if (!name || !email || !password || !employeeId || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, employeeId, department, designation)'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const existingEmp = await Staff.findOne({ employeeId: employeeId.trim() });
    if (existingEmp) {
      return res.status(409).json({
        success: false,
        message: 'A staff member with this Employee ID already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'staff'
    });

    const staff = await Staff.create({
      user: user._id,
      employeeId: employeeId.trim(),
      department: department.trim(),
      designation: designation.trim()
    });

    const populatedStaff = await Staff.findById(staff._id).populate('user', 'name email phone role isActive');

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      staff: populatedStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff profile
// @route   PUT /api/staff/:id
// @access  Private (Admin)
const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, department, designation, isActive } = req.body;
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found'
      });
    }

    if (department) staff.department = department.trim();
    if (designation) staff.designation = designation.trim();
    if (isActive !== undefined) staff.isActive = isActive;
    await staff.save();

    // Also update associated user
    const user = await User.findById(staff.user);
    if (user) {
      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone;
      if (isActive !== undefined) user.isActive = isActive;
      await user.save();
    }

    const populatedStaff = await Staff.findById(staff._id).populate('user', 'name email phone role isActive');

    res.json({
      success: true,
      message: 'Staff details updated successfully',
      staff: populatedStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found'
      });
    }

    // Delete staff profile and associated user
    const userId = staff.user;
    await staff.deleteOne();
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    res.json({
      success: true,
      message: 'Staff member and user account removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff
};
