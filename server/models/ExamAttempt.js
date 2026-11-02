const mongoose = require('mongoose');

const answerItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String, // option id or null
      default: null
    },
    isMarkedForReview: {
      type: Boolean,
      default: false
    },
    answeredAt: {
      type: Date
    }
  },
  { _id: false }
);

const optionPreservedSchema = new mongoose.Schema(
  {
    id: String,
    text: String
  },
  { _id: false }
);

const answerOrderSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    options: [optionPreservedSchema]
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    answerOrder: [answerOrderSchema],
    answers: [answerItemSchema],
    score: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    },
    incorrectCount: {
      type: Number,
      default: 0
    },
    unansweredCount: {
      type: Number,
      default: 0
    },
    totalMarksPossible: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'terminated'],
      default: 'in-progress'
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    submittedAt: {
      type: Date
    },
    timeTaken: {
      type: Number, // in seconds
      default: 0
    },
    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    terminationReason: {
      type: String,
      default: ''
    },
    suspiciousEventsCount: {
      type: Number,
      default: 0
    },
    warningCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
