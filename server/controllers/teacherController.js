const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const CheatingEvent = require('../models/CheatingEvent');
const QuestionReport = require('../models/QuestionReport');
const { getIO } = require('../sockets/examSocket');
const { logAction } = require('../services/auditService');

// @desc    Get teacher dashboard stats and chart data
// @route   GET /api/teacher/dashboard
// @access  Private (Teacher)
const getDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // Filter by teacher quizzes or all if admin
    const quizFilter = req.user.role === 'admin' ? {} : { teacherId };

    const quizzes = await Quiz.find(quizFilter);
    const quizIds = quizzes.map(q => q._id);

    const totalQuizzes = quizzes.length;
    const publishedQuizzes = quizzes.filter(q => q.published === 'published').length;
    const draftQuizzes = quizzes.filter(q => q.published === 'draft').length;

    const attempts = await ExamAttempt.find({ quizId: { $in: quizIds } })
      .populate('quizId', 'title passingMarks')
      .populate('studentId', 'firstName lastName studentCode');

    const totalAttempts = attempts.length;
    const activeExams = attempts.filter(a => a.status === 'in-progress').length;
    const completedAttempts = attempts.filter(a => a.status === 'submitted');
    const terminatedExams = attempts.filter(a => a.status === 'terminated').length;

    let totalScoreSum = 0;
    let passedCount = 0;

    completedAttempts.forEach(att => {
      totalScoreSum += att.percentage || 0;
      if (att.quizId && att.score >= att.quizId.passingMarks) {
        passedCount++;
      }
    });

    const averageScore = completedAttempts.length > 0
      ? Math.round((totalScoreSum / completedAttempts.length) * 10) / 10
      : 0;

    const passPercentage = completedAttempts.length > 0
      ? Math.round((passedCount / completedAttempts.length) * 100)
      : 0;

    const suspiciousAttempts = attempts.filter(a => a.suspiciousEventsCount > 0).length;

    const pendingReports = await QuestionReport.countDocuments({
      quizId: { $in: quizIds },
      status: 'pending'
    });

    // Score distribution buckets for chart
    const scoreBuckets = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ];

    completedAttempts.forEach(a => {
      const p = a.percentage || 0;
      if (p <= 20) scoreBuckets[0].count++;
      else if (p <= 40) scoreBuckets[1].count++;
      else if (p <= 60) scoreBuckets[2].count++;
      else if (p <= 80) scoreBuckets[3].count++;
      else scoreBuckets[4].count++;
    });

    // Recent activity list
    const recentAttempts = attempts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(att => ({
        _id: att._id,
        studentName: att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Student',
        studentCode: att.studentId?.studentCode,
        quizTitle: att.quizId?.title,
        status: att.status,
        score: att.score,
        percentage: att.percentage,
        date: att.submittedAt || att.createdAt
      }));

    res.json({
      success: true,
      stats: {
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        totalAttempts,
        averageScore,
        passPercentage,
        activeExams,
        terminatedExams,
        suspiciousAttempts,
        pendingReports
      },
      charts: {
        scoreBuckets
      },
      recentAttempts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher's quizzes
// @route   GET /api/teacher/quizzes
// @access  Private (Teacher)
const getQuizzes = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { teacherId: req.user._id };
    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });

    const data = await Promise.all(
      quizzes.map(async (q) => {
        const questionCount = await Question.countDocuments({ quizId: q._id });
        const attemptCount = await ExamAttempt.countDocuments({ quizId: q._id });
        return {
          ...q.toObject(),
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

// @desc    Get single quiz with its questions
// @route   GET /api/teacher/quizzes/:id
// @access  Private (Teacher)
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ createdAt: 1 });

    res.json({
      success: true,
      quiz,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new quiz
// @route   POST /api/teacher/quizzes
// @access  Private (Teacher)
const createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      passingMarks,
      randomizeQuestions = true,
      randomizeAnswers = true,
      negativeMarking = false,
      negativeMarksPerQuestion = 0,
      antiCheatSettings = {},
      published = 'draft'
    } = req.body;

    if (!title || !category || !duration || passingMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, duration, and passing marks are required'
      });
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      difficulty: difficulty || 'medium',
      teacherId: req.user._id,
      duration: Number(duration),
      totalMarks: 0,
      passingMarks: Number(passingMarks),
      randomizeQuestions: !!randomizeQuestions,
      randomizeAnswers: !!randomizeAnswers,
      negativeMarking: !!negativeMarking,
      negativeMarksPerQuestion: Number(negativeMarksPerQuestion || 0),
      antiCheatSettings: {
        enabled: antiCheatSettings.enabled !== false,
        blockTabSwitch: antiCheatSettings.blockTabSwitch !== false,
        blockClipboard: antiCheatSettings.blockClipboard !== false,
        requireFullscreen: antiCheatSettings.requireFullscreen !== false,
        maxWarnings: antiCheatSettings.maxWarnings || 3
      },
      published
    });

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_CREATED_QUIZ',
      targetType: 'Quiz',
      targetId: quiz._id,
      metadata: { title: quiz.title }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quiz
// @route   PUT /api/teacher/quizzes/:id
// @access  Private (Teacher)
const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && quiz.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this quiz' });
    }

    const fields = [
      'title',
      'description',
      'category',
      'difficulty',
      'duration',
      'passingMarks',
      'randomizeQuestions',
      'randomizeAnswers',
      'negativeMarking',
      'negativeMarksPerQuestion',
      'antiCheatSettings',
      'published'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        quiz[f] = req.body[f];
      }
    });

    // Recompute total marks from questions
    const questions = await Question.find({ quizId: quiz._id });
    quiz.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    await quiz.save();

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_UPDATED_QUIZ',
      targetType: 'Quiz',
      targetId: quiz._id,
      metadata: { title: quiz.title, published: quiz.published }
    });

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz and related questions/attempts
// @route   DELETE /api/teacher/quizzes/:id
// @access  Private (Teacher)
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' });
    }

    await Question.deleteMany({ quizId: quiz._id });
    await ExamAttempt.deleteMany({ quizId: quiz._id });
    await CheatingEvent.deleteMany({ quizId: quiz._id });
    await QuestionReport.deleteMany({ quizId: quiz._id });
    await quiz.deleteOne();

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_DELETED_QUIZ',
      targetType: 'Quiz',
      targetId: req.params.id,
      metadata: { title: quiz.title }
    });

    res.json({
      success: true,
      message: 'Quiz and all associated questions and data removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add question to quiz
// @route   POST /api/teacher/quizzes/:id/questions
// @access  Private (Teacher)
const addQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const {
      questionText,
      options,
      correctAnswer,
      marks = 1,
      negativeMarks = 0,
      explanation = '',
      randomizeOptions = true
    } = req.body;

    if (!questionText || !options || !Array.isArray(options) || options.length < 2 || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Question text, at least two options, and correct answer are required'
      });
    }

    const question = await Question.create({
      quizId: quiz._id,
      questionText: questionText.trim(),
      options: options.map((opt, i) => ({
        id: opt.id || String.fromCharCode(65 + i), // Default 'A', 'B', 'C', 'D'
        text: opt.text.trim()
      })),
      correctAnswer,
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      explanation: explanation ? explanation.trim() : '',
      randomizeOptions: randomizeOptions !== false
    });

    // Update total marks on quiz
    const allQuestions = await Question.find({ quizId: quiz._id });
    quiz.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question,
      totalMarks: quiz.totalMarks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/teacher/questions/:id
// @access  Private (Teacher)
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const {
      questionText,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
      randomizeOptions
    } = req.body;

    if (questionText) question.questionText = questionText.trim();
    if (options && Array.isArray(options)) {
      question.options = options.map((opt, i) => ({
        id: opt.id || String.fromCharCode(65 + i),
        text: opt.text.trim()
      }));
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (marks !== undefined) question.marks = Number(marks);
    if (negativeMarks !== undefined) question.negativeMarks = Number(negativeMarks);
    if (explanation !== undefined) question.explanation = explanation.trim();
    if (randomizeOptions !== undefined) question.randomizeOptions = randomizeOptions;

    await question.save();

    // Recompute total marks on quiz
    const allQuestions = await Question.find({ quizId: question.quizId });
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await Quiz.findByIdAndUpdate(question.quizId, { totalMarks });

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
// @route   DELETE /api/teacher/questions/:id
// @access  Private (Teacher)
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const quizId = question.quizId;
    await question.deleteOne();

    // Recompute total marks on quiz
    const allQuestions = await Question.find({ quizId });
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await Quiz.findByIdAndUpdate(quizId, { totalMarks });

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_DELETED_QUESTION',
      targetType: 'Question',
      targetId: req.params.id
    });

    res.json({
      success: true,
      message: 'Question deleted successfully',
      totalMarks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live monitoring feed of currently active student examinations
// @route   GET /api/teacher/monitoring
// @access  Private (Teacher)
const getLiveMonitoring = async (req, res, next) => {
  try {
    const { quizId } = req.query;

    const quizFilter = req.user.role === 'admin'
      ? {}
      : { teacherId: req.user._id };

    const myQuizzes = await Quiz.find(quizFilter).select('_id title');
    const myQuizIds = myQuizzes.map(q => q._id);

    const filter = {
      status: 'in-progress',
      quizId: quizId ? quizId : { $in: myQuizIds }
    };

    const activeAttempts = await ExamAttempt.find(filter)
      .populate('studentId', 'firstName lastName studentCode courseCode courseName rollNumber')
      .populate('quizId', 'title duration passingMarks totalMarks')
      .sort({ startedAt: -1 });

    const now = Date.now();
    const studentsData = activeAttempts.map(att => {
      const quiz = att.quizId;
      const started = new Date(att.startedAt).getTime();
      const durationSeconds = quiz ? quiz.duration * 60 : 3600;
      const elapsedSeconds = Math.floor((now - started) / 1000);
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      const answeredCount = att.answers ? att.answers.filter(a => a.selectedOption).length : 0;
      const totalQuestions = att.questionOrder ? att.questionOrder.length : 0;

      // Status indicator based on suspicious activity
      let monitoringStatus = 'Normal';
      if (att.suspiciousEventsCount >= 4) {
        monitoringStatus = 'Suspicious';
      } else if (att.suspiciousEventsCount >= 1 || att.warningCount >= 1) {
        monitoringStatus = 'Warning';
      }

      return {
        attemptId: att._id,
        quizId: quiz ? quiz._id : null,
        quizTitle: quiz ? quiz.title : 'Examination',
        student: {
          id: att.studentId?._id,
          name: att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Unknown Student',
          studentCode: att.studentId?.studentCode,
          course: att.studentId?.courseName || att.studentId?.courseCode
        },
        progress: {
          answered: answeredCount,
          total: totalQuestions,
          percentage: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
        },
        timeRemainingSeconds: remainingSeconds,
        suspiciousEventsCount: att.suspiciousEventsCount,
        warningCount: att.warningCount,
        monitoringStatus,
        startedAt: att.startedAt
      };
    });

    res.json({
      success: true,
      activeCount: studentsData.length,
      quizzes: myQuizzes,
      students: studentsData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suspicious / cheating events for a specific attempt
// @route   GET /api/teacher/attempts/:id/events
// @access  Private (Teacher)
const getAttemptEvents = async (req, res, next) => {
  try {
    const events = await CheatingEvent.find({ attemptId: req.params.id }).sort({ timestamp: -1 });
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

// @desc    Send warning to active student in exam
// @route   POST /api/teacher/attempts/:id/warning
// @access  Private (Teacher)
const sendWarning = async (req, res, next) => {
  try {
    const { message } = req.body;
    const warningText = message || 'Suspicious activity has been detected. Please remain on the examination screen. Further suspicious activity may result in termination of your examination.';

    const attempt = await ExamAttempt.findByIdAndUpdate(
      req.params.id,
      { $inc: { warningCount: 1 } },
      { new: true }
    ).populate('quizId studentId');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    await CheatingEvent.create({
      studentId: attempt.studentId._id,
      quizId: attempt.quizId._id,
      attemptId: attempt._id,
      eventType: 'TEACHER_WARNING',
      severity: 'medium',
      description: warningText,
      metadata: { teacherId: req.user._id, teacherName: `${req.user.firstName} ${req.user.lastName}` }
    });

    const io = getIO();
    if (io) {
      io.to(`attempt:${attempt._id}`).emit('exam:warning', {
        message: warningText,
        timestamp: new Date()
      });

      io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId._id}`).emit('exam:update', {
        attemptId: attempt._id,
        event: 'TEACHER_WARNING',
        warningCount: attempt.warningCount
      });
    }

    res.json({
      success: true,
      message: 'Warning transmitted to student screen in real-time',
      warningCount: attempt.warningCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Terminate active examination attempt
// @route   POST /api/teacher/attempts/:id/terminate
// @access  Private (Teacher)
const terminateAttempt = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A formal termination reason is mandatory'
      });
    }

    const attempt = await ExamAttempt.findById(req.params.id).populate('quizId studentId');
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Attempt is already ${attempt.status}`
      });
    }

    attempt.status = 'terminated';
    attempt.submittedAt = new Date();
    attempt.terminatedBy = req.user._id;
    attempt.terminationReason = reason.trim();
    attempt.timeTaken = Math.round((attempt.submittedAt - new Date(attempt.startedAt)) / 1000);
    await attempt.save();

    await CheatingEvent.create({
      studentId: attempt.studentId._id,
      quizId: attempt.quizId._id,
      attemptId: attempt._id,
      eventType: 'EXAM_TERMINATED',
      severity: 'high',
      description: `Examination terminated by faculty: ${attempt.terminationReason}`,
      metadata: { teacherId: req.user._id, reason: attempt.terminationReason }
    });

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_TERMINATED_STUDENT_EXAM',
      targetType: 'ExamAttempt',
      targetId: attempt._id,
      metadata: { reason: attempt.terminationReason, studentCode: attempt.studentId?.studentCode }
    });

    const io = getIO();
    if (io) {
      io.to(`attempt:${attempt._id}`).emit('exam:terminated', {
        reason: attempt.terminationReason,
        terminatedAt: attempt.submittedAt
      });

      io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId._id}`).emit('exam:status-change', {
        attemptId: attempt._id,
        status: 'terminated',
        reason: attempt.terminationReason
      });
    }

    res.json({
      success: true,
      message: 'Examination successfully terminated',
      attempt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get result analytics across quizzes
// @route   GET /api/teacher/results
// @access  Private (Teacher)
const getResults = async (req, res, next) => {
  try {
    const { quizId } = req.query;
    const filter = req.user.role === 'admin' ? {} : { teacherId: req.user._id };
    const quizzes = await Quiz.find(filter);
    const quizIds = quizzes.map(q => q._id);

    const attemptFilter = {
      quizId: quizId ? quizId : { $in: quizIds },
      status: { $in: ['submitted', 'terminated'] }
    };

    const attempts = await ExamAttempt.find(attemptFilter)
      .populate('studentId', 'firstName lastName studentCode courseName rollNumber')
      .populate('quizId', 'title totalMarks passingMarks duration')
      .sort({ submittedAt: -1 });

    const total = attempts.length;
    let highestScore = 0;
    let lowestScore = total > 0 ? 100 : 0;
    let totalScore = 0;
    let passCount = 0;

    attempts.forEach(a => {
      const p = a.percentage || 0;
      if (p > highestScore) highestScore = p;
      if (p < lowestScore) lowestScore = p;
      totalScore += p;
      if (a.quizId && a.score >= a.quizId.passingMarks) {
        passCount++;
      }
    });

    const avgScore = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;
    const passPercentage = total > 0 ? Math.round((passCount / total) * 100) : 0;

    res.json({
      success: true,
      summary: {
        totalAttempts: total,
        highestScore,
        lowestScore: total > 0 ? lowestScore : 0,
        averageScore: avgScore,
        passPercentage
      },
      quizzes: quizzes.map(q => ({ _id: q._id, title: q.title })),
      attempts: attempts.map(att => ({
        _id: att._id,
        studentName: att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Unknown',
        studentCode: att.studentId?.studentCode,
        course: att.studentId?.courseName,
        quizTitle: att.quizId?.title,
        score: att.score,
        totalMarks: att.totalMarksPossible || att.quizId?.totalMarks,
        percentage: att.percentage,
        isPassed: att.quizId ? att.score >= att.quizId.passingMarks : false,
        status: att.status,
        terminationReason: att.terminationReason,
        suspiciousEventsCount: att.suspiciousEventsCount,
        timeTaken: att.timeTaken,
        date: att.submittedAt || att.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get question reports submitted by students
// @route   GET /api/teacher/reports
// @access  Private (Teacher)
const getReports = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { teacherId: req.user._id };
    const quizzes = await Quiz.find(filter);
    const quizIds = quizzes.map(q => q._id);

    const reports = await QuestionReport.find({ quizId: { $in: quizIds } })
      .populate('studentId', 'firstName lastName studentCode courseName')
      .populate('quizId', 'title')
      .populate('questionId', 'questionText options correctAnswer')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to / resolve question report
// @route   PUT /api/teacher/reports/:id
// @access  Private (Teacher)
const resolveReport = async (req, res, next) => {
  try {
    const { status, teacherResponse } = req.body;

    const report = await QuestionReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (status) report.status = status;
    if (teacherResponse) report.teacherResponse = teacherResponse.trim();
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();

    await report.save();

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: 'TEACHER_RESOLVED_QUESTION_REPORT',
      targetType: 'QuestionReport',
      targetId: report._id,
      metadata: { status: report.status }
    });

    res.json({
      success: true,
      message: 'Report status and response updated successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
