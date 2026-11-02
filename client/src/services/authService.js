import api from './api';

export const authService = {
  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    return res.data;
  },

  register: async (firstName, lastName, studentCode) => {
    const res = await api.post('/auth/register', { firstName, lastName, studentCode });
    return res.data;
  },

  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
  },

  parseCode: async (studentCode) => {
    const res = await api.post('/auth/parse-code', { studentCode });
    return res.data;
  }
};
