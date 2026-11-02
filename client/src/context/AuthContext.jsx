import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { disconnectSocket } from '../services/socketService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bwu_quiz_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current token session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('bwu_quiz_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await authService.login(identifier, password);
    if (res.success) {
      localStorage.setItem('bwu_quiz_token', res.token);
      localStorage.setItem('bwu_quiz_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (firstName, lastName, studentCode) => {
    const res = await authService.register(firstName, lastName, studentCode);
    if (res.success) {
      localStorage.setItem('bwu_quiz_token', res.token);
      localStorage.setItem('bwu_quiz_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
    if (res.success) {
      localStorage.setItem('bwu_quiz_token', res.token);
      localStorage.setItem('bwu_quiz_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('bwu_quiz_token');
      localStorage.removeItem('bwu_quiz_user');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        changePassword,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
