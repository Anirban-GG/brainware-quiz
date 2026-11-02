import api from './api';

export const teacherService = {
  getDashboard: async () => {
    const res = await api.get('/teacher/dashboard');
    return res.data;
  },

  getQuizzes: async () => {
    const res = await api.get('/teacher/quizzes');
    return res.data;
  },

  getQuizById: async (id) => {
    const res = await api.get(`/teacher/quizzes/${id}`);
    return res.data;
  },

  createQuiz: async (data) => {
    const res = await api.post('/teacher/quizzes', data);
    return res.data;
  },

  updateQuiz: async (id, data) => {
    const res = await api.put(`/teacher/quizzes/${id}`, data);
    return res.data;
  },

  deleteQuiz: async (id) => {
    const res = await api.delete(`/teacher/quizzes/${id}`);
    return res.data;
  },

  addQuestion: async (quizId, data) => {
    const res = await api.post(`/teacher/quizzes/${quizId}/questions`, data);
    return res.data;
  },

  updateQuestion: async (questionId, data) => {
    const res = await api.put(`/teacher/questions/${questionId}`, data);
    return res.data;
  },

  deleteQuestion: async (questionId) => {
    const res = await api.delete(`/teacher/questions/${questionId}`);
    return res.data;
  },

  getLiveMonitoring: async (quizId) => {
    const res = await api.get('/teacher/monitoring', {
      params: quizId ? { quizId } : {}
    });
    return res.data;
  },

  getAttemptEvents: async (attemptId) => {
    const res = await api.get(`/teacher/attempts/${attemptId}/events`);
    return res.data;
  },

  sendWarning: async (attemptId, message) => {
    const res = await api.post(`/teacher/attempts/${attemptId}/warning`, { message });
    return res.data;
  },

  terminateAttempt: async (attemptId, reason) => {
    const res = await api.post(`/teacher/attempts/${attemptId}/terminate`, { reason });
    return res.data;
  },

  getResults: async (quizId) => {
    const res = await api.get('/teacher/results', {
      params: quizId ? { quizId } : {}
    });
    return res.data;
  },

  getReports: async () => {
    const res = await api.get('/teacher/reports');
    return res.data;
  },

  resolveReport: async (reportId, status, teacherResponse) => {
    const res = await api.put(`/teacher/reports/${reportId}`, { status, teacherResponse });
    return res.data;
  }
};
