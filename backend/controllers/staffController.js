const Staff = require('../models/Staff');
const User = require('../models/User');
const { isValidPersonName, isValidPhone, isValidEmail, sanitizePhone, isValidIdentifier } = require('../utils/validator');

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

    if (!isValidPersonName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name. Staff name must contain only letters and spaces (2 to 50 characters).'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
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

    if (!isValidIdentifier(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Employee ID. Must be alphanumeric and hyphens only (e.g. EMP-101).'
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
      email: email.toLowerCase().trim(),
      password,
      phone: sanitizePhone(phone),
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

    // Protection: If staff user is admin or current user, prevent deactivation
    const staffUserCheck = await User.findById(staff.user);
    if (staffUserCheck) {
      if (staffUserCheck.role === 'admin' && isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Administrator accounts cannot be deactivated.'
        });
      }
      if (req.user && staffUserCheck._id.toString() === req.user._id.toString() && isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own logged-in account.'
        });
      }
    }

    if (department) staff.department = department.trim();
    if (designation) staff.designation = designation.trim();
    if (isActive !== undefined) staff.isActive = isActive;
    await staff.save();

    // Also update associated user
    const user = await User.findById(staff.user);
    if (user) {
      if (name !== undefined) {
        if (!isValidPersonName(name)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid name. Staff name must contain only letters and spaces (2 to 50 characters).'
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
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Administrator accounts cannot be deleted.'
        });
      }
      if (req.user && user && user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account while logged in.'
        });
      }
    }
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
