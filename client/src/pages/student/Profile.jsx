import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import {
  User,
  GraduationCap,
  Shield,
  KeyRound,
  LogOut,
  Building,
  BookOpen,
  Calendar,
  Hash
} from 'lucide-react';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Student Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Institutional identity and examination credential records.
        </p>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-bwu-800 to-bwu-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-red-700/20">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.fullName}
              </h2>
              <Badge variant="primary" size="xs">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.studentCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/change-password"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border inline-flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* University Record Details Grid */}
      <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Academic Identity Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              University
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
              {user?.universityName || 'Brainware University'}
            </span>
            <span className="text-[11px] text-slate-500">Institution Code: BWU</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              Enrolled Programme
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
              {user?.courseName || 'Bachelor of Computer Applications'}
            </span>
            <span className="text-[11px] text-slate-500">Course Code: {user?.courseCode || 'BCA'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              Admission Year
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
              {user?.admissionYear || 2024}
            </span>
            <span className="text-[11px] text-slate-500">Batch of {user?.admissionYear}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              Institutional Roll Number
            </span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
              {user?.rollNumber || '020'}
            </span>
            <span className="text-[11px] text-slate-500">Official Campus Roll</span>
          </div>
        </div>
      </div>

      {/* Security Status Box */}
      <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Account & Security Status
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-darkSurface-border flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Account Status</span>
            <Badge variant="success" size="xs">
              ACTIVE
            </Badge>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-darkSurface-border flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Password Status</span>
            <Badge variant={user?.passwordStatus === 'Changed' ? 'success' : 'warning'} size="xs">
              {user?.passwordStatus || 'Custom'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
