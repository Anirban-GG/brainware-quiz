const express = require('express');
const router = express.Router();
const {
  registerStudent,
  login,
  changePassword,
  getMe,
  logout,
  checkStudentCode
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', registerStudent);
router.post('/login', login);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/parse-code', checkStudentCode);

module.exports = router;
