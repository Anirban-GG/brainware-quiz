import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import { GraduationCap, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please provide your student code or email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (res.success) {
        if (res.user.mustChangePassword) {
          navigate('/change-password');
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for presentation/evaluation
  const fillCredentials = (id, pwd) => {
    setIdentifier(id);
    setPassword(pwd);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-darkSurface-bg transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-bwu-800 to-bwu-600 flex items-center justify-center text-white shadow-xl shadow-red-600/25">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Brainware <span className="text-bwu-700 dark:text-red-500">University</span>
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Online Quiz Examination & Monitoring System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkSurface-card py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-xl">
          {isExpired && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Student Code or Institutional Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. BWU/BCA/24/001 or faculty email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-bwu-700 hover:bg-bwu-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bwu-700 shadow-md shadow-red-700/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Examination Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login helper buttons for examiner / testing convenience */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-darkSurface-border">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Demo Credentials (One-Click Fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('BWU/BCA/24/045', 'Student@123')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle hover:bg-red-50 dark:hover:bg-red-950/40 text-left border border-slate-200 dark:border-darkSurface-border transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Student (Riya)</div>
                <div className="text-[10px] text-slate-500">Ready to take exam</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('BWU/BCA/24/003', 'BWU/BCA/24/003')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle hover:bg-red-50 dark:hover:bg-red-950/40 text-left border border-slate-200 dark:border-darkSurface-border transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Student (Mijanul)</div>
                <div className="text-[10px] text-slate-500">Tests Force Password</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('teacher@brainwareuniversity.ac.in', 'Teacher@2024')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle hover:bg-red-50 dark:hover:bg-red-950/40 text-left border border-slate-200 dark:border-darkSurface-border transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Teacher (Dr. Debasis)</div>
                <div className="text-[10px] text-slate-500">Live Monitor & Quizzes</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@brainwareuniversity.ac.in', 'Admin@2024')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle hover:bg-red-50 dark:hover:bg-red-950/40 text-left border border-slate-200 dark:border-darkSurface-border transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Admin Account</div>
                <div className="text-[10px] text-slate-500">Full System Access</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
            <span>New student without an account? </span>
            <Link to="/register" className="font-semibold text-bwu-700 dark:text-red-400 hover:underline">
              Register with Student Code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
