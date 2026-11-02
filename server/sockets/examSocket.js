/**
 * Socket.IO Handler for Real-Time Exam Monitoring, Warnings, and Anti-Cheating Events
 */
const ExamAttempt = require('../models/ExamAttempt');
const CheatingEvent = require('../models/CheatingEvent');
const { logAction } = require('../services/auditService');

let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room for monitoring specific quiz or global monitoring
    socket.on('join:monitoring', ({ quizId }) => {
      if (quizId) {
        socket.join(`monitoring:quiz:${quizId}`);
      }
      socket.join('monitoring:global');
      // console.log(`[Socket] Joined monitoring rooms for ${quizId || 'all'}`);
    });

    // Student joins their active exam room
    socket.on('join:exam', ({ attemptId, studentId }) => {
      if (attemptId) {
        socket.join(`attempt:${attemptId}`);
        socket.attemptId = attemptId;
        socket.studentId = studentId;
        // console.log(`[Socket] Student ${studentId} joined attempt room ${attemptId}`);
      }
    });

    // Teacher sends real-time warning to student
    socket.on('teacher:warning', async ({ attemptId, studentId, message, teacherId }) => {
      try {
        const warningMessage = message || 'Suspicious activity has been detected. Please remain on the examination screen. Further suspicious activity may result in termination of your examination.';

        // Increment attempt warning count
        const attempt = await ExamAttempt.findByIdAndUpdate(
          attemptId,
          { $inc: { warningCount: 1 } },
          { new: true }
        ).populate('quizId');

        // Log cheating event for teacher warning
        if (attempt) {
          await CheatingEvent.create({
            studentId: attempt.studentId,
            quizId: attempt.quizId._id,
            attemptId,
            eventType: 'TEACHER_WARNING',
            severity: 'medium',
            description: warningMessage,
            metadata: { teacherId }
          });

          // Emit warning directly to student's room
          io.to(`attempt:${attemptId}`).emit('exam:warning', {
            message: warningMessage,
            timestamp: new Date()
          });

          // Notify monitoring rooms
          io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId._id}`).emit('exam:update', {
            attemptId,
            event: 'TEACHER_WARNING',
            warningCount: attempt.warningCount
          });
        }
      } catch (err) {
        console.error('[Socket Warning Error]:', err);
      }
    });

    // Teacher terminates student examination
    socket.on('teacher:terminate', async ({ attemptId, teacherId, reason }) => {
      try {
        const attempt = await ExamAttempt.findById(attemptId).populate('quizId studentId');
        if (!attempt || attempt.status !== 'in-progress') return;

        attempt.status = 'terminated';
        attempt.submittedAt = new Date();
        attempt.terminatedBy = teacherId;
        attempt.terminationReason = reason || 'Terminated by Teacher due to policy violation.';
        attempt.timeTaken = Math.round((attempt.submittedAt - new Date(attempt.startedAt)) / 1000);
        await attempt.save();

        await CheatingEvent.create({
          studentId: attempt.studentId._id,
          quizId: attempt.quizId._id,
          attemptId,
          eventType: 'EXAM_TERMINATED',
          severity: 'high',
          description: `Examination terminated by invigilator. Reason: ${attempt.terminationReason}`,
          metadata: { teacherId, reason: attempt.terminationReason }
        });

        await logAction({
          userId: teacherId,
          role: 'teacher',
          action: 'TEACHER_TERMINATED_STUDENT_EXAM',
          targetType: 'ExamAttempt',
          targetId: attemptId,
          metadata: { reason: attempt.terminationReason, studentId: attempt.studentId._id }
        });

        // Notify student immediately
        io.to(`attempt:${attemptId}`).emit('exam:terminated', {
          reason: attempt.terminationReason,
          terminatedAt: attempt.submittedAt
        });

        // Broadcast to monitoring
        io.to('monitoring:global').to(`monitoring:quiz:${attempt.quizId._id}`).emit('exam:status-change', {
          attemptId,
          status: 'terminated',
          reason: attempt.terminationReason
        });
      } catch (err) {
        console.error('[Socket Terminate Error]:', err);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => ioInstance;

module.exports = {
  initSocket,
  getIO
};
