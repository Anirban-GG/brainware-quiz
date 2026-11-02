const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Subject/Category is required'],
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    totalMarks: {
      type: Number,
      default: 0
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required']
    },
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    randomizeAnswers: {
      type: Boolean,
      default: true
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    negativeMarksPerQuestion: {
      type: Number,
      default: 0
    },
    antiCheatSettings: {
      enabled: {
        type: Boolean,
        default: true
      },
      blockTabSwitch: {
        type: Boolean,
        default: true
      },
      blockClipboard: {
        type: Boolean,
        default: true
      },
      requireFullscreen: {
        type: Boolean,
        default: true
      },
      maxWarnings: {
        type: Number,
        default: 3
      }
    },
    published: {
      type: String,
      enum: ['draft', 'published', 'unpublished'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);

// Virtual for question count
quizSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quizId'
});

module.exports = mongoose.model('Quiz', quizSchema);
