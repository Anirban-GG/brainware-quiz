const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getLiveMonitoring,
  getAttemptEvents,
  sendWarning,
  terminateAttempt,
  getResults,
  getReports,
  resolveReport
} = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

// All teacher routes require authentication and 'teacher' or 'admin' role
router.use(authenticate);
router.use(authorize('teacher', 'admin'));

router.get('/dashboard', getDashboard);

router.get('/quizzes', getQuizzes);
router.get('/quizzes/:id', getQuizById);
router.post('/quizzes', createQuiz);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);

router.post('/quizzes/:id/questions', addQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

router.get('/monitoring', getLiveMonitoring);
router.get('/attempts/:id/events', getAttemptEvents);
router.post('/attempts/:id/warning', sendWarning);
router.post('/attempts/:id/terminate', terminateAttempt);

router.get('/results', getResults);

router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

module.exports = router;
