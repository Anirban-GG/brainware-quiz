import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ChangePassword from '../pages/auth/ChangePassword';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import AvailableQuizzes from '../pages/student/AvailableQuizzes';
import ExamInterface from '../pages/student/ExamInterface';
import ExamResult from '../pages/student/ExamResult';
import ResultHistory from '../pages/student/ResultHistory';
import StudentQuestionReports from '../pages/student/QuestionReports';
import StudentProfile from '../pages/student/Profile';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/Dashboard';
import TeacherQuizList from '../pages/teacher/QuizList';
import QuizCreateEdit from '../pages/teacher/QuizCreateEdit';
import QuestionBank from '../pages/teacher/QuestionBank';
import LiveMonitoring from '../pages/teacher/LiveMonitoring';
import ResultsAnalytics from '../pages/teacher/ResultsAnalytics';
import TeacherQuestionReportsList from '../pages/teacher/QuestionReportsList';
import TeacherProfile from '../pages/teacher/Profile';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import StudentsManagement from '../pages/admin/StudentsManagement';
import TeachersManagement from '../pages/admin/TeachersManagement';
import QuizzesManagement from '../pages/admin/QuizzesManagement';
import ExamAttemptsManagement from '../pages/admin/ExamAttemptsManagement';
import CheatingLogs from '../pages/admin/CheatingLogs';
import AuditLogs from '../pages/admin/AuditLogs';
import SystemSettings from '../pages/admin/SystemSettings';

// Helper Root Redirector
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

// Helper Exam Initializer / Redirector
const StartExamRedirect = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const res = await studentService.startAttempt(quizId);
        if (active && res.success && res.attemptId) {
          navigate(`/student/exam/${res.attemptId}`, { replace: true });
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Failed to start examination.');
          setTimeout(() => navigate('/student/dashboard', { replace: true }), 3000);
        }
      }
    };
    if (quizId) {
      start();
    }
    return () => {
      active = false;
    };
  }, [quizId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-darkSurface">
      <div className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200 dark:border-darkSurface-border shadow-lg text-center max-w-sm">
        {error ? (
          <div className="space-y-2">
            <div className="text-red-600 dark:text-red-400 text-sm font-semibold">{error}</div>
            <p className="text-xs text-slate-500">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-bwu-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">
              Initializing examination...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Dynamic Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Start Exam Attempt Redirector */}
      <Route
        path="/student/exam/start/:quizId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StartExamRedirect />
          </ProtectedRoute>
        }
      />

      {/* Fullscreen Secure Exam Interface (No regular layout sidebar) */}
      <Route
        path="/student/exam/:attemptId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamInterface />
          </ProtectedRoute>
        }
      />

      {/* Student Portal (With DashboardLayout) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="quizzes" element={<AvailableQuizzes />} />
        <Route path="results" element={<ResultHistory />} />
        <Route path="results/:id" element={<ExamResult />} />
        <Route path="reports" element={<StudentQuestionReports />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Teacher Portal */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="quizzes" element={<TeacherQuizList />} />
        <Route path="quizzes/new" element={<QuizCreateEdit />} />
        <Route path="quizzes/:id/edit" element={<QuizCreateEdit />} />
        <Route path="quizzes/:id/questions" element={<QuestionBank />} />
        <Route path="monitoring" element={<LiveMonitoring />} />
        <Route path="results" element={<ResultsAnalytics />} />
        <Route path="reports" element={<TeacherQuestionReportsList />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentsManagement />} />
        <Route path="teachers" element={<TeachersManagement />} />
        <Route path="quizzes" element={<QuizzesManagement />} />
        <Route path="attempts" element={<ExamAttemptsManagement />} />
        <Route path="cheating-logs" element={<CheatingLogs />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
