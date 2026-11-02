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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brainware_quiz';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB at:', mongoUri);

    // Clear existing collections
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await ExamAttempt.deleteMany({});
    await CheatingEvent.deleteMany({});
    await QuestionReport.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed] Cleared existing data');

    // Password hashes
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@2024', salt);
    const teacherPasswordHash = await bcrypt.hash('Teacher@2024', salt);
    const student1PasswordHash = await bcrypt.hash('BWU/BCA/24/003', salt);
    const student2PasswordHash = await bcrypt.hash('Student@123', salt);

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@brainwareuniversity.ac.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      mustChangePassword: false,
      status: 'active'
    });

    // 2. Create Teacher
    const teacher = await User.create({
      firstName: 'Dr. Debasis',
      lastName: 'Mukherjee',
      email: 'teacher@brainwareuniversity.ac.in',
      passwordHash: teacherPasswordHash,
      role: 'teacher',
      mustChangePassword: false,
      status: 'active'
    });

    // 3. Create All 60 Students from Brainware University Cohort
    let student1 = null;
    let student2 = null;

    for (const item of rawStudentsList) {
      const parsed = parseStudentCode(item.code);
      const { firstName, lastName } = splitName(item.name);
      const studentPwdHash = await bcrypt.hash(parsed.normalizedCode, salt);

      let mustChange = true;
      let pwdHash = studentPwdHash;

      // Allow BWU/BCA/24/045 (Rishita Chatterjee) to have Student@123 for immediate test login
      if (parsed.normalizedCode === 'BWU/BCA/24/045') {
        pwdHash = await bcrypt.hash('Student@123', salt);
        mustChange = false;
      }

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
        passwordHash: pwdHash,
        role: 'student',
        mustChangePassword: mustChange,
        status: 'active'
      });

      if (parsed.normalizedCode === 'BWU/BCA/24/003') student1 = created;
      if (parsed.normalizedCode === 'BWU/BCA/24/045') student2 = created;
    }

    console.log(`[Seed] Enrolled 60 Brainware University students successfully`);

    // 4. Create Quiz 1: Web Development & JavaScript Fundamentals
    const quiz1 = await Quiz.create({
      title: 'Web Development & JavaScript Fundamentals',
      description: 'End-semester continuous assessment covering ECMAScript, DOM manipulation, asynchronous programming, and web standards.',
      category: 'Computer Applications',
      difficulty: 'medium',
      teacherId: teacher._id,
      duration: 15, // 15 mins
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
        explanation: 'In JavaScript, typeof null returns "object", which is a historical design quirk from the early implementation.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which of the following methods creates a new array with all elements that pass the test implemented by the provided function?',
        options: [
          { id: 'A', text: 'Array.prototype.map()' },
          { id: 'B', text: 'Array.prototype.filter()' },
          { id: 'C', text: 'Array.prototype.reduce()' },
          { id: 'D', text: 'Array.prototype.forEach()' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'filter() creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which statement accurately describes JavaScript execution model?',
        options: [
          { id: 'A', text: 'Multi-threaded with synchronized locks' },
          { id: 'B', text: 'Single-threaded event loop with non-blocking I/O' },
          { id: 'C', text: 'Multi-process fork-based concurrency' },
          { id: 'D', text: 'Synchronous blocking execution only' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'JavaScript engines run on a single main thread backed by an event loop and callback queues.',
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
        explanation: '5 * 2 = 10; 10 + 3 = 13.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which HTTP status code signifies a resource was successfully created on the server?',
        options: [
          { id: 'A', text: '200 OK' },
          { id: 'B', text: '201 Created' },
          { id: 'C', text: '204 No Content' },
          { id: 'D', text: '304 Not Modified' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'HTTP 201 Created indicates that the request has succeeded and led to the creation of a resource.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Which web storage mechanism persists data without expiration across browser tabs and window restarts?',
        options: [
          { id: 'A', text: 'sessionStorage' },
          { id: 'B', text: 'localStorage' },
          { id: 'C', text: 'MemoryCache' },
          { id: 'D', text: 'Session Cookies' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'localStorage data persists across browser sessions until explicitly cleared.',
        randomizeOptions: true
      },
      {
        quizId: quiz1._id,
        questionText: 'Consider the following technologies: (A) Node.js and (B) Deno. Which run JavaScript outside the browser?',
        options: [
          { id: 'A', text: 'Only Node.js' },
          { id: 'B', text: 'Only Deno' },
          { id: 'C', text: 'Neither Node.js nor Deno' },
          { id: 'D', text: 'Both Node.js and Deno' }
        ],
        correctAnswer: 'D',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Both Node.js and Deno are V8-based JavaScript runtimes for server-side computing. Note: Options order is preserved.',
        randomizeOptions: false // Individual question override preserves option order!
      },
      {
        quizId: quiz1._id,
        questionText: 'What does CSS flexbox property `justify-content` align along?',
        options: [
          { id: 'A', text: 'The cross axis' },
          { id: 'B', text: 'The main axis' },
          { id: 'C', text: 'Both axes equally' },
          { id: 'D', text: 'The z-index layer' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'justify-content defines the alignment along the main axis.',
        randomizeOptions: true
      }
    ];

    const insertedQuestions1 = await Question.insertMany(questionsQuiz1);

    // 5. Create Quiz 2: Data Structures & Algorithms
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
        questionText: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(n log n)' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'A balanced BST halves the search space at each level, achieving O(log n) average time complexity.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which data structure operates strictly on a Last-In, First-Out (LIFO) principle?',
        options: [
          { id: 'A', text: 'Queue' },
          { id: 'B', text: 'Stack' },
          { id: 'C', text: 'Priority Queue' },
          { id: 'D', text: 'Circular Buffer' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'A stack operates on LIFO.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which sorting algorithm has the best worst-case time complexity among the following?',
        options: [
          { id: 'A', text: 'Bubble Sort - O(n^2)' },
          { id: 'B', text: 'Quick Sort - O(n^2)' },
          { id: 'C', text: 'Merge Sort - O(n log n)' },
          { id: 'D', text: 'Selection Sort - O(n^2)' }
        ],
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'Merge sort guarantees O(n log n) even in the worst case.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'Which traversal of a Binary Search Tree produces values in strictly sorted ascending order?',
        options: [
          { id: 'A', text: 'Preorder traversal' },
          { id: 'B', text: 'Inorder traversal' },
          { id: 'C', text: 'Postorder traversal' },
          { id: 'D', text: 'Level order traversal' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'Inorder traversal (Left, Root, Right) of a BST visits nodes in increasing sorted order.',
        randomizeOptions: true
      },
      {
        quizId: quiz2._id,
        questionText: 'What is the auxiliary space complexity of standard iterative Breadth-First Search (BFS) on a graph?',
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(V) where V is the number of vertices' },
          { id: 'C', text: 'O(V * E)' },
          { id: 'D', text: 'O(log V)' }
        ],
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.5,
        explanation: 'BFS uses a queue that can hold up to V vertices in the worst case.',
        randomizeOptions: true
      }
    ];

    await Question.insertMany(questionsQuiz2);

    // 6. Create Quiz 3: Database Management Systems (Draft)
    await Quiz.create({
      title: 'Database Management Systems & SQL Fundamentals',
      description: 'Relational algebra, normalization (1NF through BCNF), indexing, and ACID transactions.',
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

    console.log('[Seed] Quizzes and Questions seeded successfully');

    // 7. Create a sample completed attempt for Riya Sen to populate analytics
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
        selectedOption: idx < 8 ? q.correctAnswer : 'C', // 8 correct, 2 wrong
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
      submittedAt: new Date(Date.now() - 3600000 + 720000), // 12 mins
      timeTaken: 720,
      suspiciousEventsCount: 1,
      warningCount: 0
    });

    // Sample cheating event for Riya's attempt
    await CheatingEvent.create({
      studentId: student2._id,
      quizId: quiz1._id,
      attemptId: pastAttempt._id,
      eventType: 'TAB_SWITCH',
      severity: 'low',
      description: 'Student navigated away from examination browser tab.',
      metadata: { browser: 'Chrome' },
      timestamp: new Date(Date.now() - 3600000 + 300000)
    });

    // Sample Question Report from Riya
    await QuestionReport.create({
      studentId: student2._id,
      quizId: quiz1._id,
      attemptId: pastAttempt._id,
      questionId: insertedQuestions1[2]._id,
      reason: 'Question is unclear',
      message: 'typeof null returning "object" seems counter-intuitive; would like faculty clarification.',
      status: 'pending'
    });

    // Sample Audit Logs
    await AuditLog.create({
      userId: admin._id,
      role: 'admin',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'System',
      targetId: 'BWU_QUIZ_SYSTEM',
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

    console.log('[Seed] Sample attempts, cheating events, and audit logs created successfully');
    console.log('\n======================================================');
    console.log('       BRAINWARE UNIVERSITY QUIZ SEED COMPLETED       ');
    console.log('======================================================');
    console.log('1. Admin Account:');
    console.log('   Email: admin@brainwareuniversity.ac.in');
    console.log('   Password: Admin@2024\n');
    console.log('2. Teacher Account:');
    console.log('   Email: teacher@brainwareuniversity.ac.in');
    console.log('   Password: Teacher@2024\n');
    console.log('3. Student Account (Default Password - Needs Change):');
    console.log('   Student Code: BWU/BCA/24/003');
    console.log('   Initial Password: BWU/BCA/24/003\n');
    console.log('4. Student Account (Ready for instant quiz taking):');
    console.log('   Student Code: BWU/BCA/24/045');
    console.log('   Password: Student@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
