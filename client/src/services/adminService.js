import api from './api';

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getUsers: async (params) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  toggleUserStatus: async (userId, status) => {
    const res = await api.put(`/admin/users/${userId}/status`, { status });
    return res.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const res = await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
    return res.data;
  },

  createTeacher: async (data) => {
    const res = await api.post('/admin/teachers', data);
    return res.data;
  },

  getAllQuizzes: async () => {
    const res = await api.get('/admin/quizzes');
    return res.data;
  },

  toggleQuizPublish: async (quizId, published) => {
    const res = await api.patch(`/admin/quizzes/${quizId}/publish`, { published });
    return res.data;
  },

  getAllAttempts: async (params) => {
    const res = await api.get('/admin/attempts', { params });
    return res.data;
  },

  getCheatingLogs: async (params) => {
    const res = await api.get('/admin/cheating-events', { params });
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  }
};
