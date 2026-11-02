const express = require('express');
const router = express.Router();
const {
  getAvailableQuizzes,
  getQuizDetails,
  startAttempt,
  getAttempt,
  saveAnswer,
  logCheatingEvent,
  submitAttempt,
  getResults,
  getResultDetails,
  reportQuestion,
  getMyReports
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// All student routes require authentication and 'student' role
router.use(authenticate);
router.use(authorize('student'));

router.get('/quizzes', getAvailableQuizzes);
router.get('/quizzes/:id', getQuizDetails);

router.post('/attempts', startAttempt);
router.get('/attempts/:id', getAttempt);
router.patch('/attempts/:id/answers', saveAnswer);
router.post('/attempts/:id/cheating-event', logCheatingEvent);
router.post('/attempts/:id/submit', submitAttempt);

router.get('/results', getResults);
router.get('/results/:id', getResultDetails);

router.post('/reports', reportQuestion);
router.get('/reports', getMyReports);

module.exports = router;
