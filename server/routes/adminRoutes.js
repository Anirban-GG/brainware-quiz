const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and 'admin' role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);
router.post('/teachers', createTeacher);

router.get('/quizzes', getAllQuizzes);
router.patch('/quizzes/:id/publish', toggleQuizPublish);

router.get('/attempts', getAllAttempts);
router.get('/cheating-events', getCheatingLogs);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
