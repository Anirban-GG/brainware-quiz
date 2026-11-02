const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { parseStudentCode } = require('../config/courses');
const { logAction } = require('../services/auditService');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    },
    process.env.JWT_SECRET || 'brainware_quiz_secret_key',
    { expiresIn: '24h' }
  );
};

// @desc    Register a new student using Brainware student code
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, studentCode } = req.body;

    if (!firstName || !lastName || !studentCode) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and student code are all required'
      });
    }

    // Live validation & parse
    const parsed = parseStudentCode(studentCode);
    if (!parsed.isValid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }

    // Check existing
    const existing = await User.findOne({ studentCode: parsed.normalizedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student with code ${parsed.normalizedCode} is already registered.`
      });
    }

    // Hash default initial password (which equals the studentCode)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.normalizedCode, salt);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      studentCode: parsed.normalizedCode,
      universityCode: parsed.universityCode,
      universityName: parsed.universityName,
      courseCode: parsed.courseCode,
      courseName: parsed.courseName,
      admissionYear: parsed.admissionYear,
      rollNumber: parsed.rollNumber,
      passwordHash,
      role: 'student',
      mustChangePassword: true,
      status: 'active'
    });

    const token = generateToken(user);

    await logAction({
      userId: user._id,
      role: 'student',
      action: 'STUDENT_REGISTERED',
      targetType: 'User',
      targetId: user._id,
      metadata: { studentCode: parsed.normalizedCode }
    });

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully. Default password is your Student Code.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (supports student code or email)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student code/email and password'
      });
    }

    const cleanIdentifier = identifier.trim();

    // Find by studentCode or email
    const user = await User.findOne({
      $or: [
        { studentCode: cleanIdentifier.toUpperCase() },
        { email: cleanIdentifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact Brainware administration.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match records'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    const token = generateToken(user);

    await logAction({
      userId: user._id,
      role: user.role,
      action: 'PASSWORD_CHANGED',
      targetType: 'User',
      targetId: user._id
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject()
  });
};

// @desc    Logout user (client destroys token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Live parse student code helper endpoint
// @route   POST /api/auth/parse-code
// @access  Public
const checkStudentCode = async (req, res) => {
  const { studentCode } = req.body;
  const parsed = parseStudentCode(studentCode);
  res.json(parsed);
};

module.exports = {
  registerStudent,
  login,
  changePassword,
  getMe,
  logout,
  checkStudentCode
};
