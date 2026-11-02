
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const CheatingEvent = require('../models/CheatingEvent');
const QuestionReport = require('../models/QuestionReport');
const AuditLog = require('../models/AuditLog');

const { parseStudentCode } = require('../config/courses');
const { rawStudentsList, splitName } = require('./studentsList');

const seedDatabase = async () => {
  try {
    // Validate credentials BEFORE connecting or deleting database records.
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const teacherPassword = process.env.SEED_TEACHER_PASSWORD;
    const studentPassword = process.env.SEED_STUDENT_PASSWORD;

    if (!adminPassword || !teacherPassword || !studentPassword) {
      throw new Error(
        'Set SEED_ADMIN_PASSWORD, SEED_TEACHER_PASSWORD, and SEED_STUDENT_PASSWORD in server/.env'
      );
    }

    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/brainware_quiz';

    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // WARNING: This clears existing collections.
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await ExamAttempt.deleteMany({});
    await CheatingEvent.deleteMany({});
    await QuestionReport.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed] Cleared existing data');

    const salt = await bcrypt.genSalt(10);

    const adminPasswordHash = await bcrypt.hash(adminPassword, salt);
    const teacherPasswordHash = await bcrypt.hash(teacherPassword, salt);

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      mustChangePassword: false,
      status: 'active'
    });

    // 2. Create Teacher
    const teacher = await User.create({
      firstName: 'Demo',
      lastName: 'Teacher',
      email: 'teacher@example.com',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
      mustChangePassword: false,
      status: 'active'
    });

    // 3. Create Demo Students
    let student2 = null;
    let enrolledCount = 0;

    for (const item of rawStudentsList) {
      const parsed = parseStudentCode(item.code);

      if (!parsed.isValid) {
        console.warn(`[Seed] Skipping invalid code: ${item.code}`);
        continue;
      }

      const { firstName, lastName } = splitName(item.name);

      const passwordHash = await bcrypt.hash(studentPassword, salt);

      const created = await User.create({
        firstName,
        lastName,
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

      if (parsed.normalizedCode === 'BWU/BCA/24/045') {
        student2 = created;
      }

      enrolledCount++;
    }

    if (!student2) {
      throw new Error(
        'Demo student BWU/BCA/24/045 is missing from studentsList.js'
      );
    }

    console.log(`[Seed] Enrolled ${enrolledCount} demo students`);

    // 4. Create Quiz 1
    const quiz1 = await Quiz.create({
      title: 'Web Development & JavaScript Fundamentals',
      description: 'End-semester continuous assessment covering ECMAScript, DOM manipulation, asynchronous programming, and web standards.',
      category: 'Computer Applications',
      difficulty: 'medium',
      teacherId: teacher._id,
      duration: 15,
      totalMarks: 10,
      passingMarks: 5,
      randomizeQuestions: true,
      randomizeAnswers: true,
      negativeMarking: true,
      negativeMarksPerQuestion: 0.25,
      antiCheatSettings: {
        enabled: true,
        blockTabSwitch: true,
        blockClipboard: true,
        requireFullscreen: true,
        maxWarnings: 3
      },
      published: 'published'
    });

    // Questions for Quiz 1
    const questionsQuiz1 = [
      {
        quizId: quiz1._id,
        questionText: 'Which of the following is a modern client-side JavaScript library maintained by Meta?',
        options: [
          { id: 'A', text: 'React' },
          { id: 'B', text: 'MongoDB' },
          { id: 'C', text: 'Express' },
          { id: 'D', text: 'Nginx' }
        ],
        correctAnswer: 'A',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'React is an open-source front-end JavaScript library for building user interfaces.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which keyword declares a block-scoped variable that cannot be reassigned in JavaScript?',
        options: [
          { id: 'A', text: 'var' },
          { id: 'B', text: 'const' },
          { id: 'C', text: 'let' },
          { id: 'D', text: 'static' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'const declarations create read-only block-scoped references.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'What is the output of typeof null in JavaScript?',
        options: [
          { id: 'A', text: '"null"' },
          { id: 'B', text: '"undefined"' },
          { id: 'C', text: '"object"' },
          { id: 'D', text: '"number"' }
        ],
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'In JavaScript, typeof null returns "object", which is a historical design quirk.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which method creates a new array with elements that pass a test?',
        options: [
          { id: 'A', text: 'Array.prototype.map()' },
          { id: 'B', text: 'Array.prototype.filter()' },
          { id: 'C', text: 'Array.prototype.reduce()' },
          { id: 'D', text: 'Array.prototype.forEach()' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'filter() creates a new array containing elements that pass the test.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which statement accurately describes JavaScript execution?',
        options: [
          { id: 'A', text: 'Multi-threaded with synchronized locks' },
          { id: 'B', text: 'Single-threaded event loop with non-blocking I/O' },
          { id: 'C', text: 'Multi-process fork-based concurrency' },
          { id: 'D', text: 'Synchronous blocking execution only' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'JavaScript uses an event loop and callback queues.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'What will Promise.resolve(5).then(v => v * 2).then(v => v + 3) resolve to?',
        options: [
          { id: 'A', text: '10' },
          { id: 'B', text: '13' },
          { id: 'C', text: '15' },
          { id: 'D', text: 'Undefined' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: '5 multiplied by 2 is 10, then 10 plus 3 is 13.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which HTTP status code indicates successful resource creation?',
        options: [
          { id: 'A', text: '200 OK' },
          { id: 'B', text: '201 Created' },
          { id: 'C', text: '204 No Content' },
          { id: 'D', text: '304 Not Modified' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'HTTP 201 Created indicates successful resource creation.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which web storage mechanism persists data without expiration?',
        options: [
          { id: 'A', text: 'sessionStorage' },
          { id: 'B', text: 'localStorage' },
          { id: 'C', text: 'MemoryCache' },
          { id: 'D', text: 'Session Cookies' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'localStorage persists data until explicitly cleared.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which technologies run JavaScript outside the browser?',
        options: [
          { id: 'A', text: 'Only Node.js' },
          { id: 'B', text: 'Only Deno' },
          { id: 'C', text: 'Neither Node.js nor Deno' },
          { id: 'D', text: 'Both Node.js and Deno' }
        ],
        correctAnswer: 'D',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Both Node.js and Deno can run JavaScript outside browsers.',
        randomizeOptions: false
      },
      {
        quizId: quiz1._id,
        questionText: 'What does CSS flexbox justify-content align along?',
        options: [
          { id: 'A', text: 'The cross axis' },
          { id: 'B', text: 'The main axis' },
          { id: 'C', text: 'Both axes equally' },
          { id: 'D', text: 'The z-index layer' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'justify-content aligns items along the main axis.',
        randomizeOptions: true
      }
    ];

    const insertedQuestions1 = await Question.insertMany(questionsQuiz1);

    // 5. Create Quiz 2
    const quiz2 = await Quiz.create({
      title: 'Data Structures & Algorithms in Computer Science',
      description: 'Comprehensive test on arrays, linked lists, stacks, queues, sorting algorithms, and computational complexity.',
      category: 'Computer Applications',
      difficulty: 'hard',
      teacherId: teacher._id,
      duration: 20,
      totalMarks: 5,
      passingMarks: 3,
      randomizeQuestions: true,
      randomizeAnswers: true,
      negativeMarking: true,
      negativeMarksPerQuestion: 0.5,
      antiCheatSettings: {
        enabled: true,
        blockTabSwitch: true,
        blockClipboard: true,
        requireFullscreen: true,
        maxWarnings: 3
      },
      published: 'published'
    });

    const questionsQuiz2 = [
      {
        quizId: quiz2._id,
        questionText: 'What is the average time complexity of searching a balanced Binary Search Tree?',
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(n log n)' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'A balanced BST searches in O(log n) average time.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which data structure operates on Last-In, First-Out?',
        options: [
          { id: 'A', text: 'Queue' },
          { id: 'B', text: 'Stack' },
          { id: 'C', text: 'Priority Queue' },
          { id: 'D', text: 'Circular Buffer' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'A stack follows the LIFO principle.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which sorting algorithm guarantees O(n log n) worst-case time?',
        options: [
          { id: 'A', text: 'Bubble Sort - O(n^2)' },
          { id: 'B', text: 'Quick Sort - O(n^2)' },
          { id: 'C', text: 'Merge Sort - O(n log n)' },
          { id: 'D', text: 'Selection Sort - O(n^2)' }
        ],
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'Merge sort guarantees O(n log n) worst-case time.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which BST traversal produces sorted ascending values?',
        options: [
          { id: 'A', text: 'Preorder traversal' },
          { id: 'B', text: 'Inorder traversal' },
          { id: 'C', text: 'Postorder traversal' },
          { id: 'D', text: 'Level order traversal' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'Inorder traversal visits nodes in ascending order in a BST.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'What is the auxiliary space complexity of iterative BFS?',
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(V)' },
          { id: 'C', text: 'O(V * E)' },
          { id: 'D', text: 'O(log V)' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'BFS may store up to V vertices in its queue.',
        randomizeOptions: true
      }
    ];

    await Question.insertMany(questionsQuiz2);

    // 6. Create Quiz 3 (Draft)
    await Quiz.create({
      title: 'Database Management Systems & SQL Fundamentals',
      description: 'Relational algebra, normalization, indexing, and ACID transactions.',
      category: 'Computer Applications',
      difficulty: 'medium',
      teacherId: teacher._id,
      duration: 30,
      totalMarks: 25,
      passingMarks: 10,
      randomizeQuestions: true,
      randomizeAnswers: true,
      negativeMarking: false,
      negativeMarksPerQuestion: 0,
      published: 'draft'
    });

    console.log('[Seed] Quizzes and questions created');

    // 7. Create a sample completed attempt
    const pastAttempt = await ExamAttempt.create({
      studentId: student2._id,
      quizId: quiz1._id,
      questionOrder: insertedQuestions1.map(q => q._id),
      answerOrder: insertedQuestions1.map(q => ({
        questionId: q._id,
        options: q.options
      })),
      answers: insertedQuestions1.map((q, idx) => ({
        questionId: q._id,
        selectedOption: idx < 8 ? q.correctAnswer : 'C',
        isMarkedForReview: false,
        answeredAt: new Date(Date.now() - 3600000 + idx * 60000)
      })),
      score: 7.5,
      percentage: 75,
      correctCount: 8,
      incorrectCount: 2,
      unansweredCount: 0,
      totalMarksPossible: 10,
      status: 'submitted',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 3600000 + 720000),
      timeTaken: 720,
      suspiciousEventsCount: 1,
      warningCount: 0
    });

    // 8. Sample cheating event
    await CheatingEvent.create({
      studentId: student2._id,
      quizId: quiz1._id,
      attemptId: pastAttempt._id,
      eventType: 'TAB_SWITCH',
      severity: 'low',
      description: 'Demo student navigated away from the examination browser tab.',
      metadata: { browser: 'Chrome' },
      timestamp: new Date(Date.now() - 3600000 + 300000)
    });

    // 9. Sample question report
    await QuestionReport.create({
      studentId: student2._id,
      quizId: quiz1._id,
      attemptId: pastAttempt._id,
      questionId: insertedQuestions1[2]._id,
      reason: 'Question is unclear',
      message: 'The typeof null result seems counter-intuitive; requesting clarification.',
      status: 'pending'
    });

    // 10. Sample audit logs
    await AuditLog.create({
      userId: admin._id,
      role: 'admin',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'System',
      targetId: 'DEMO_QUIZ_SYSTEM',
      metadata: { version: '1.0.0' }
    });

    await AuditLog.create({
      userId: teacher._id,
      role: 'teacher',
      action: 'TEACHER_CREATED_QUIZ',
      targetType: 'Quiz',
      targetId: quiz1._id,
      metadata: { title: quiz1.title }
    });

    console.log('[Seed] Sample attempts, cheating events, and audit logs created');
    console.log('======================================================');
    console.log('              DEMO QUIZ SEED COMPLETED                ');
    console.log('======================================================');
    console.log('Admin email: admin@example.com');
    console.log('Teacher email: teacher@example.com');
    console.log('Demo passwords are configured in server/.env');
    console.log('Demo student accounts require a password change.');
    console.log('Do not use demo credentials in production.');
    console.log('======================================================');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('[Seed Error]:', error);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    process.exit(1);
  }
};

seedDatabase();
