const mongoose = require('mongoose');

const cheatingEventSchema = new mongoose.Schema(
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
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: [
        'TAB_SWITCH',
        'WINDOW_BLUR',
        'COPY_ATTEMPT',
        'PASTE_ATTEMPT',
        'RIGHT_CLICK',
        'FULLSCREEN_EXIT',
        'PRINT_ATTEMPT',
        'DEVTOOLS_ATTEMPT',
        'FOCUS_LOSS',
        'TEACHER_WARNING',
        'EXAM_TERMINATED'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CheatingEvent', cheatingEventSchema);
