import api from './api';

export const studentService = {
  getAvailableQuizzes: async () => {
    const res = await api.get('/student/quizzes');
    return res.data;
  },

  getQuizDetails: async (quizId) => {
    const res = await api.get(`/student/quizzes/${quizId}`);
    return res.data;
  },

  startAttempt: async (quizId) => {
    const res = await api.post('/student/attempts', { quizId });
    return res.data;
  },

  getAttempt: async (attemptId) => {
    const res = await api.get(`/student/attempts/${attemptId}`);
    return res.data;
  },

  saveAnswer: async (attemptId, questionId, selectedOption, isMarkedForReview) => {
    const res = await api.patch(`/student/attempts/${attemptId}/answers`, {
      questionId,
      selectedOption,
      isMarkedForReview
    });
    return res.data;
  },

  logCheatingEvent: async (attemptId, eventType, severity, description, metadata) => {
    const res = await api.post(`/student/attempts/${attemptId}/cheating-event`, {
      eventType,
      severity,
      description,
      metadata
    });
    return res.data;
  },

  submitAttempt: async (attemptId) => {
    const res = await api.post(`/student/attempts/${attemptId}/submit`);
    return res.data;
  },

  getResults: async () => {
    const res = await api.get('/student/results');
    return res.data;
  },

  getResultDetails: async (attemptId) => {
    const res = await api.get(`/student/results/${attemptId}`);
    return res.data;
  },

  reportQuestion: async ({ quizId, attemptId, questionId, reason, message }) => {
    const res = await api.post('/student/reports', {
      quizId,
      attemptId,
      questionId,
      reason,
      message
    });
    return res.data;
  },

  getMyReports: async () => {
    const res = await api.get('/student/reports');
    return res.data;
  }
};
