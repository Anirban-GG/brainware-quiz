const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const CheatingEvent = require('../models/CheatingEvent');
const QuestionReport = require('../models/QuestionReport');
const { getIO } = require('../sockets/examSocket');
const { logAction } = require('../services/auditService');

// Utility to shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// @desc    Get all published quizzes available for students
// @route   GET /api/student/quizzes
// @access  Private (Student)
const getAvailableQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ published: 'published' })
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Fetch student's attempts to indicate if already completed or in-progress
    const studentAttempts = await ExamAttempt.find({ studentId: req.user._id });
    const attemptMap = {};
    studentAttempts.forEach(att => {
      attemptMap[att.quizId.toString()] = {
        attemptId: att._id,
        status: att.status,
        score: att.score,
        percentage: att.percentage
      };
    });

    // Count questions per quiz
    const quizData = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.countDocuments({ quizId: quiz._id });
        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          teacherName: quiz.teacherId ? `${quiz.teacherId.firstName} ${quiz.teacherId.lastName}` : 'Brainware Faculty',
          duration: quiz.duration,
          totalMarks: quiz.totalMarks,
          passingMarks: quiz.passingMarks,
          negativeMarking: quiz.negativeMarking,
          antiCheatSettings: quiz.antiCheatSettings,
          questionCount,
          attempt: attemptMap[quiz._id.toString()] || null
        };
      })
    );

    res.json({
      success: true,
      quizzes: quizData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz details & instructions
// @route   GET /api/student/quizzes/:id
// @access  Private (Student)
const getQuizDetails = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, published: 'published' })
      .populate('teacherId', 'firstName lastName');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published'
      });
    }

    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    const existingAttempt = await ExamAttempt.findOne({
      quizId: quiz._id,
      studentId: req.user._id
    });

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        teacherName: quiz.teacherId ? `${quiz.teacherId.firstName} ${quiz.teacherId.lastName}` : 'Brainware Faculty',
        duration: quiz.duration,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        negativeMarking: quiz.negativeMarking,
        antiCheatSettings: quiz.antiCheatSettings,
        questionCount,
        attempt: existingAttempt ? {
          _id: existingAttempt._id,
          status: existingAttempt.status
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start examination attempt (creates question & answer shuffle)
// @route   POST /api/student/attempts
// @access  Private (Student)
const startAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, published: 'published' });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not available for examination'
      });
    }

    // Check existing attempt
    let existingAttempt = await ExamAttempt.findOne({
      quizId: quiz._id,
      studentId: req.user._id
    });

    if (existingAttempt) {
      // If already submitted or terminated, do not re-attempt
      if (existingAttempt.status !== 'in-progress') {
        return res.status(400).json({
          success: false,
          message: `This examination has already been ${existingAttempt.status}. Multiple attempts are not permitted.`
        });
      }

      // Check if time expired on existing attempt
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingAttempt.startedAt)) / 1000);
      const totalSeconds = quiz.duration * 60;
      if (elapsedSeconds >= totalSeconds) {
        // Auto submit
        await finalizeAttempt(existingAttempt, quiz);
        return res.status(400).json({
          success: false,
          message: 'Exam time has expired and the exam has been submitted.'
        });
      }

      // Resume existing attempt
      return res.json({
        success: true,
        message: 'Resuming active examination',
        attemptId: existingAttempt._id
      });
    }

    // Fetch all questions for this quiz
    const questions = await Question.find({ quizId: quiz._id });
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This quiz has no questions yet. Please contact your instructor.'
      });
    }

    // Question Order randomization
    let questionOrder = questions.map(q => q._id);
    if (quiz.randomizeQuestions) {
      questionOrder = shuffleArray(questionOrder);
    }

    // Option Order randomization per question
    const answerOrder = [];
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    let totalMarksPossible = 0;

    questionOrder.forEach(qId => {
      const q = questionMap[qId.toString()];
      totalMarksPossible += q.marks || 1;

      let opts = q.options.map(opt => ({ id: opt.id, text: opt.text }));
      // Randomize options if quiz allows it AND question didn't opt out
      if (quiz.randomizeAnswers && q.randomizeOptions !== false) {
        opts = shuffleArray(opts);
      }
      answerOrder.push({
        questionId: q._id,
        options: opts
      });
    });

    const newAttempt = await ExamAttempt.create({
      studentId: req.user._id,
      quizId: quiz._id,
      questionOrder,
      answerOrder,
      answers: [],
      totalMarksPossible,
      status: 'in-progress',
      startedAt: new Date()
    });

    // Emit live monitoring event via Socket.IO
    const io = getIO();
    if (io) {
      io.to('monitoring:global').to(`monitoring:quiz:${quiz._id}`).emit('exam:started', {
        attemptId: newAttempt._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        student: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          studentCode: req.user.studentCode
        },
        startedAt: newAttempt.startedAt,
        totalQuestions: questionOrder.length
      });
    }

    res.status(201).json({
      success: true,
      message: 'Examination started successfully',
      attemptId: newAttempt._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active attempt interface data (sanitized: NO answers/explanations)
// @route   GET /api/student/attempts/:id
// @access  Private (Student)
const getAttempt = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      studentId: req.user._id
    }).populate('quizId', 'title category duration antiCheatSettings passingMarks totalMarks negativeMarking');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Examination attempt not found'
      });
    }

    const quiz = attempt.quizId;
    const now = Date.now();
    const started = new Date(attempt.startedAt).getTime();
    const durationSeconds = quiz.duration * 60;
    const elapsedSeconds = Math.floor((now - started) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    // If time has expired and status is in-progress, auto-submit
    if (remainingSeconds <= 0 && attempt.status === 'in-progress') {
      await finalizeAttempt(attempt, quiz);
      return res.json({
        success: true,
        attempt: {
          _id: attempt._id,
          status: 'submitted',
          isExpired: true,
          message: 'Time expired. Examination automatically submitted.'
        }
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.json({
        success: true,
        attempt: {
          _id: attempt._id,
          status: attempt.status,
          terminationReason: attempt.terminationReason,
          isTerminated: attempt.status === 'terminated',
          submittedAt: attempt.submittedAt
        }
      });
    }

    // Retrieve question content matching questionOrder and answerOrder
    const questionDocs = await Question.find({
      _id: { $in: attempt.questionOrder }
    }).select('-correctAnswer -explanation');

    const questionMap = {};
    questionDocs.forEach(q => { questionMap[q._id.toString()] = q; });

    const answerOrderMap = {};
    attempt.answerOrder.forEach(ao => {
      answerOrderMap[ao.questionId.toString()] = ao.options;
    });

    const studentAnswersMap = {};
    attempt.answers.forEach(a => {
      studentAnswersMap[a.questionId.toString()] = {
        selectedOption: a.selectedOption,
        isMarkedForReview: a.isMarkedForReview
      };
    });

    const orderedQuestions = attempt.questionOrder.map((qId, index) => {
      const q = questionMap[qId.toString()];
      return {
        index: index + 1,
        questionId: qId,
        questionText: q ? q.questionText : 'Question content unavailable',
        marks: q ? q.marks : 1,
        negativeMarks: q ? q.negativeMarks : 0,
        options: answerOrderMap[qId.toString()] || (q ? q.options : []),
        selectedOption: studentAnswersMap[qId.toString()]?.selectedOption || null,
        isMarkedForReview: studentAnswersMap[qId.toString()]?.isMarkedForReview || false
      };
    });

    res.json({
      success: true,
      attempt: {
        _id: attempt._id,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          duration: quiz.duration,
          antiCheatSettings: quiz.antiCheatSettings,
          negativeMarking: quiz.negativeMarking
        },
        status: attempt.status,
        remainingSeconds,
        totalQuestions: orderedQuestions.length,
        questions: orderedQuestions,
        suspiciousEventsCount: attempt.suspiciousEventsCount,
        warningCount: attempt.warningCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Autosave answer for a question
// @route   PATCH /api/student/attempts/:id/answers
// @access  Private (Student)
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption, isMarkedForReview } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      studentId: req.user._id
    }).populate('quizId', 'duration');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Examination is ${attempt.status}. Answers cannot be modified.`
      });
    }

    // Verify time limit
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt)) / 1000);
    if (elapsedSeconds > (attempt.quizId.duration * 60) + 10) {
      // 10s grace
      await finalizeAttempt(attempt, attempt.quizId);
      return res.status(400).json({ success: false, message: 'Exam time expired' });
    }

    // Update or insert answer
    const existingIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId.toString()
    );

    if (existingIndex > -1) {
      if (selectedOption !== undefined) {
        attempt.answers[existingIndex].selectedOption = selectedOption;
      }
      if (isMarkedForReview !== undefined) {
        attempt.answers[existingIndex].isMarkedForReview = isMarkedForReview;
      }
      attempt.answers[existingIndex].answeredAt = new Date();
    } else {
      attempt.answers.push({
        questionId,
        selectedOption: selectedOption || null,
        isMarkedForReview: !!isMarkedForReview,
        answeredAt: new Date()
      });
    }

    await attempt.save();

    const answeredCount = attempt.answers.filter(a => a.selectedOption).length;

    // Real-time update to teacher monitoring
    const io = getIO();
    if (io) {
      io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId._id}`).emit('exam:progress', {
        attemptId: attempt._id,
        answeredCount,
        totalQuestions: attempt.questionOrder.length
      });
    }

    res.json({
      success: true,
      message: 'Answer autosaved',
      answeredCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log anti-cheating suspicious event
// @route   POST /api/student/attempts/:id/cheating-event
// @access  Private (Student)
const logCheatingEvent = async (req, res, next) => {
  try {
    const { eventType, severity = 'medium', description = '', metadata = {} } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      studentId: req.user._id
    });

    if (!attempt || attempt.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Attempt not active' });
    }

    const event = await CheatingEvent.create({
      studentId: req.user._id,
      quizId: attempt.quizId,
      attemptId: attempt._id,
      eventType,
      severity,
      description: description || `Suspicious event detected: ${eventType}`,
      metadata
    });

    attempt.suspiciousEventsCount += 1;
    await attempt.save();

    // Broadcast to teacher live monitoring room
    const io = getIO();
    if (io) {
      io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId}`).emit('exam:cheating-event', {
        attemptId: attempt._id,
        studentId: req.user._id,
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        studentCode: req.user.studentCode,
        eventType,
        severity,
        description: event.description,
        suspiciousEventsCount: attempt.suspiciousEventsCount,
        timestamp: event.timestamp
      });
    }

    res.json({
      success: true,
      suspiciousEventsCount: attempt.suspiciousEventsCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit examination attempt and calculate official results
// @route   POST /api/student/attempts/:id/submit
// @access  Private (Student)
const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      studentId: req.user._id
    }).populate('quizId');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Attempt is already ${attempt.status}`
      });
    }

    const quiz = attempt.quizId;
    const finalResult = await finalizeAttempt(attempt, quiz);

    res.json({
      success: true,
      message: 'Examination submitted successfully',
      result: finalResult
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Calculate results and finalize attempt in DB
const finalizeAttempt = async (attempt, quiz) => {
  const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
  const questionMap = {};
  questions.forEach(q => { questionMap[q._id.toString()] = q; });

  const studentAnswersMap = {};
  attempt.answers.forEach(a => {
    studentAnswersMap[a.questionId.toString()] = a.selectedOption;
  });

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalMarksPossible = 0;

  attempt.questionOrder.forEach(qId => {
    const q = questionMap[qId.toString()];
    if (!q) return;

    const qMarks = q.marks || 1;
    totalMarksPossible += qMarks;

    const selected = studentAnswersMap[qId.toString()];

    if (!selected) {
      unansweredCount++;
    } else if (selected === q.correctAnswer) {
      correctCount++;
      score += qMarks;
    } else {
      incorrectCount++;
      if (quiz.negativeMarking) {
        const neg = q.negativeMarks || quiz.negativeMarksPerQuestion || 0;
        score -= neg;
      }
    }
  });

  // Ensure score doesn't fall below zero
  score = Math.max(0, Math.round(score * 100) / 100);
  const percentage = totalMarksPossible > 0 ? Math.round((score / totalMarksPossible) * 1000) / 10 : 0;

  attempt.status = 'submitted';
  attempt.score = score;
  attempt.percentage = percentage;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.unansweredCount = unansweredCount;
  attempt.totalMarksPossible = totalMarksPossible;
  attempt.submittedAt = new Date();
  attempt.timeTaken = Math.round((attempt.submittedAt - new Date(attempt.startedAt)) / 1000);

  await attempt.save();

  // Notify live monitoring
  const io = getIO();
  if (io) {
    io.to('monitoring:global').to(`monitoring:quiz:${quiz._id}`).emit('exam:submitted', {
      attemptId: attempt._id,
      score,
      percentage,
      status: 'submitted',
      timeTaken: attempt.timeTaken
    });
  }

  return {
    attemptId: attempt._id,
    score,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalMarksPossible,
    passingMarks: quiz.passingMarks,
    isPassed: score >= quiz.passingMarks,
    timeTaken: attempt.timeTaken,
    submittedAt: attempt.submittedAt
  };
};

// @desc    Get student result history
// @route   GET /api/student/results
// @access  Private (Student)
const getResults = async (req, res, next) => {
  try {
    const attempts = await ExamAttempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'terminated'] }
    })
      .populate('quizId', 'title category totalMarks passingMarks duration')
      .sort({ submittedAt: -1 });

    const results = attempts.map(att => {
      const quiz = att.quizId;
      return {
        _id: att._id,
        quizId: quiz ? quiz._id : null,
        quizTitle: quiz ? quiz.title : 'Examination Quiz',
        category: quiz ? quiz.category : 'General',
        totalMarks: att.totalMarksPossible || (quiz ? quiz.totalMarks : 0),
        passingMarks: quiz ? quiz.passingMarks : 0,
        score: att.score,
        percentage: att.percentage,
        isPassed: quiz ? att.score >= quiz.passingMarks : false,
        status: att.status,
        terminationReason: att.terminationReason,
        timeTaken: att.timeTaken,
        suspiciousEventsCount: att.suspiciousEventsCount,
        date: att.submittedAt || att.updatedAt
      };
    });

    res.json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed result for a single attempt (with question review)
// @route   GET /api/student/results/:id
// @access  Private (Student)
const getResultDetails = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.id,
      studentId: req.user._id
    }).populate('quizId');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Only allow detailed review if completed or terminated
    if (attempt.status === 'in-progress') {
      return res.status(400).json({ success: false, message: 'Examination is still in progress' });
    }

    const quiz = attempt.quizId;
    const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    const answerOrderMap = {};
    attempt.answerOrder.forEach(ao => {
      answerOrderMap[ao.questionId.toString()] = ao.options;
    });

    const studentAnswersMap = {};
    attempt.answers.forEach(a => {
      studentAnswersMap[a.questionId.toString()] = a.selectedOption;
    });

    // Check if student has reported any questions in this attempt
    const reports = await QuestionReport.find({ attemptId: attempt._id });
    const reportedQuestionIds = new Set(reports.map(r => r.questionId.toString()));

    const questionsReview = attempt.questionOrder.map((qId, idx) => {
      const q = questionMap[qId.toString()];
      const studentSelected = studentAnswersMap[qId.toString()] || null;
      const isCorrect = studentSelected === (q ? q.correctAnswer : null);
      const isAnswered = studentSelected !== null;

      return {
        index: idx + 1,
        questionId: qId,
        questionText: q ? q.questionText : '',
        options: answerOrderMap[qId.toString()] || (q ? q.options : []),
        selectedOption: studentSelected,
        correctAnswer: q ? q.correctAnswer : '',
        isCorrect,
        isAnswered,
        marks: q ? q.marks : 1,
        marksObtained: isCorrect ? (q ? q.marks : 1) : (isAnswered && quiz.negativeMarking ? -(q.negativeMarks || 0) : 0),
        explanation: q ? q.explanation : '',
        isReported: reportedQuestionIds.has(qId.toString())
      };
    });

    // Cheating events logged during attempt
    const cheatingEvents = await CheatingEvent.find({ attemptId: attempt._id }).sort({ timestamp: 1 });

    res.json({
      success: true,
      result: {
        _id: attempt._id,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty,
          duration: quiz.duration,
          passingMarks: quiz.passingMarks,
          totalMarks: quiz.totalMarks,
          negativeMarking: quiz.negativeMarking
        },
        score: attempt.score,
        totalMarksPossible: attempt.totalMarksPossible,
        percentage: attempt.percentage,
        isPassed: attempt.score >= quiz.passingMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        status: attempt.status,
        terminationReason: attempt.terminationReason,
        timeTaken: attempt.timeTaken,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        suspiciousEventsCount: attempt.suspiciousEventsCount,
        cheatingEvents,
        questions: questionsReview
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit question remark / report
// @route   POST /api/student/reports
// @access  Private (Student)
const reportQuestion = async (req, res, next) => {
  try {
    const { quizId, attemptId, questionId, reason, message } = req.body;

    if (!quizId || !attemptId || !questionId || !reason || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (quizId, attemptId, questionId, reason, message) are required'
      });
    }

    const report = await QuestionReport.create({
      studentId: req.user._id,
      quizId,
      attemptId,
      questionId,
      reason,
      message: message.trim(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Question report submitted successfully to course faculty',
      report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports submitted by current student
// @route   GET /api/student/reports
// @access  Private (Student)
const getMyReports = async (req, res, next) => {
  try {
    const reports = await QuestionReport.find({ studentId: req.user._id })
      .populate('quizId', 'title')
      .populate('questionId', 'questionText')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
