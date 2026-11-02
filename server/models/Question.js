const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      type: [optionSchema],
      validate: [
        (val) => val && val.length >= 2,
        'Question must have at least 2 options'
      ]
    },
    correctAnswer: {
      type: String, // Matches option.id or option value
      required: [true, 'Correct answer is required']
    },
    marks: {
      type: Number,
      default: 1,
      min: [0.5, 'Marks must be at least 0.5']
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, 'Negative marks cannot be negative']
    },
    explanation: {
      type: String,
      default: '',
      trim: true
    },
    randomizeOptions: {
      type: Boolean,
      default: true // Allows per-question override (e.g. for "Both A and B" questions)
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Question', questionSchema);
