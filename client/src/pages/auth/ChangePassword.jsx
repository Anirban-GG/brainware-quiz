import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isNew = location.state?.isNewRegistration || user?.mustChangePassword;
  const initialStudentCode = location.state?.studentCode || user?.studentCode || '';

  const [currentPassword, setCurrentPassword] = useState(isNew ? initialStudentCode : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current/default password.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmNewPassword);
      if (res.success) {
        setSuccess('Password changed successfully! Redirecting to dashboard...');
        setTimeout(() => {
          if (user?.role === 'admin') navigate('/admin/dashboard');
          else if (user?.role === 'teacher') navigate('/teacher/dashboard');
          else navigate('/student/dashboard');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-darkSurface-bg transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-bwu-800 to-bwu-600 flex items-center justify-center text-white shadow-xl shadow-red-600/25">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isNew ? 'Set Your Personal Password' : 'Change Account Password'}
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
          Brainware University Examination Security Policy
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkSurface-card py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-xl">
          {isNew && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-semibold block">Mandatory Password Update</span>
                <span>
                  For institutional examination integrity, default passwords must be replaced before accessing your portal.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Password {isNew ? '(Default Student Code)' : ''}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-bwu-700 hover:bg-bwu-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bwu-700 shadow-md shadow-red-700/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Updating password...</span>
              ) : (
                <>
                  <span>Save Password & Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
