const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const CheatingEvent = require('../models/CheatingEvent');
const QuestionReport = require('../models/QuestionReport');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { logAction } = require('../services/auditService');

// @desc    Get complete administrative dashboard metrics and analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAttempts = await ExamAttempt.countDocuments();
    const activeExams = await ExamAttempt.countDocuments({ status: 'in-progress' });
    const completedExams = await ExamAttempt.countDocuments({ status: 'submitted' });
    const terminatedExams = await ExamAttempt.countDocuments({ status: 'terminated' });
    const suspiciousAttempts = await ExamAttempt.countDocuments({ suspiciousEventsCount: { $gt: 0 } });
    const pendingReports = await QuestionReport.countDocuments({ status: 'pending' });

    // Pass / Fail distribution
    const attempts = await ExamAttempt.find({ status: 'submitted' }).populate('quizId', 'passingMarks');
    let passCount = 0;
    let failCount = 0;
    attempts.forEach(a => {
      if (a.quizId && a.score >= a.quizId.passingMarks) {
        passCount++;
      } else {
        failCount++;
      }
    });

    // Course distribution among students
    const students = await User.find({ role: 'student' }).select('courseCode courseName');
    const courseMap = {};
    students.forEach(s => {
      const c = s.courseCode || 'BCA';
      courseMap[c] = (courseMap[c] || 0) + 1;
    });

    const courseDistribution = Object.keys(courseMap).map(k => ({
      name: k,
      students: courseMap[k]
    }));

    // Cheating event distribution
    const cheatingEvents = await CheatingEvent.find().select('eventType');
    const eventMap = {};
    cheatingEvents.forEach(e => {
      eventMap[e.eventType] = (eventMap[e.eventType] || 0) + 1;
    });

    const cheatingDistribution = Object.keys(eventMap).map(k => ({
      name: k.replace('_', ' '),
      count: eventMap[k]
    }));

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalQuizzes,
        totalQuestions,
        totalAttempts,
        activeExams,
        completedExams,
        terminatedExams,
        suspiciousAttempts,
        pendingReports
      },
      charts: {
        passFail: [
          { name: 'Passed', value: passCount, color: '#10B981' },
          { name: 'Failed', value: failCount, color: '#EF4444' }
        ],
        courseDistribution,
        cheatingDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering and search
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { studentCode: regex },
        { email: regex }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    const safeUsers = users.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      studentCode: u.studentCode,
      email: u.email,
      role: u.role,
      courseCode: u.courseCode,
      courseName: u.courseName,
      admissionYear: u.admissionYear,
      rollNumber: u.rollNumber,
      status: u.status,
      passwordStatus: u.mustChangePassword ? 'Default' : 'Changed',
      createdAt: u.createdAt
    }));

    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Active / Inactive)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot deactivate their own account' });
    }

    user.status = status;
    await user.save();

    await logAction({
      userId: req.user._id,
      role: 'admin',
      action: status === 'active' ? 'ADMIN_ACTIVATED_USER' : 'ADMIN_DEACTIVATED_USER',
      targetType: 'User',
      targetId: user._id,
      metadata: { targetRole: user.role, studentCode: user.studentCode, email: user.email }
    });

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      user: {
        _id: user._id,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset student/teacher password securely
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Admin)
const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine default password
    let defaultPassword = '';
    if (user.role === 'student') {
      defaultPassword = user.studentCode; // Default student password is studentCode
    } else {
      defaultPassword = req.body.newPassword || 'Brainware@2024';
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(defaultPassword, salt);
    user.mustChangePassword = true; // Force password change on next login
    await user.save();

    await logAction({
      userId: req.user._id,
      role: 'admin',
      action: 'ADMIN_RESET_PASSWORD',
      targetType: 'User',
      targetId: user._id,
      metadata: { targetRole: user.role, studentCode: user.studentCode, email: user.email }
    });

    res.json({
      success: true,
      message: user.role === 'student'
        ? `Password reset to Student Code (${user.studentCode}). Student must change password upon next login.`
        : `Faculty password reset successfully to temporary password. Must change password upon next login.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Teacher account
// @route   POST /api/admin/teachers
// @access  Private (Admin)
const createTeacher = async (req, res, next) => {
  try {
    const { firstName, lastName, email, initialPassword } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const pwd = initialPassword || 'Teacher@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pwd, salt);

    const teacher = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'teacher',
      mustChangePassword: true,
      status: 'active'
    });

    await logAction({
      userId: req.user._id,
      role: 'admin',
      action: 'ADMIN_CREATED_TEACHER',
      targetType: 'User',
      targetId: teacher._id,
      metadata: { email: teacher.email }
    });

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully with initial password',
      teacher: teacher.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes with management controls
// @route   GET /api/admin/quizzes
// @access  Private (Admin)
const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .populate('teacherId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      quizzes.map(async (q) => {
        const questionCount = await Question.countDocuments({ quizId: q._id });
        const attemptCount = await ExamAttempt.countDocuments({ quizId: q._id });
        return {
          ...q.toObject(),
          teacherName: q.teacherId ? `${q.teacherId.firstName} ${q.teacherId.lastName}` : 'Faculty',
          questionCount,
          attemptCount
        };
      })
    );

    res.json({ success: true, quizzes: data });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle quiz publish status
// @route   PATCH /api/admin/quizzes/:id/publish
// @access  Private (Admin)
const toggleQuizPublish = async (req, res, next) => {
  try {
    const { published } = req.body;
    if (!['draft', 'published', 'unpublished'].includes(published)) {
      return res.status(400).json({ success: false, message: 'Invalid publish state' });
    }

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { published }, { new: true });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    await logAction({
      userId: req.user._id,
      role: 'admin',
      action: 'ADMIN_CHANGED_QUIZ_STATUS',
      targetType: 'Quiz',
      targetId: quiz._id,
      metadata: { published }
    });

    res.json({
      success: true,
      message: `Quiz status changed to ${published}`,
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exam attempts
// @route   GET /api/admin/attempts
// @access  Private (Admin)
const getAllAttempts = async (req, res, next) => {
  try {
    const { status, quizId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (quizId) filter.quizId = quizId;

    const attempts = await ExamAttempt.find(filter)
      .populate('studentId', 'firstName lastName studentCode courseName rollNumber')
      .populate('quizId', 'title category duration totalMarks passingMarks')
      .sort({ createdAt: -1 });

    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full anti-cheating audit trail
// @route   GET /api/admin/cheating-events
// @access  Private (Admin)
const getCheatingLogs = async (req, res, next) => {
  try {
    const { eventType, severity } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;

    const events = await CheatingEvent.find(filter)
      .populate('studentId', 'firstName lastName studentCode')
      .populate('quizId', 'title')
      .sort({ timestamp: -1 })
      .limit(200);

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get administrative audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'firstName lastName role studentCode email')
      .sort({ timestamp: -1 })
      .limit(200);

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  toggleUserStatus,
  resetUserPassword,
  createTeacher,
  getAllQuizzes,
  toggleQuizPublish,
  getAllAttempts,
  getCheatingLogs,
  getAuditLogs
};
