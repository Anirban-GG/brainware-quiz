import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import { UserCheck, KeyRound, LogOut, Building, Mail, Shield } from 'lucide-react';

export default function TeacherProfile() {
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
          Faculty Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Authorized instructor credentials and academic institution affiliations.
        </p>
      </div>

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
              <Badge variant="info" size="xs">
                FACULTY
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email}
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

      <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Faculty Department & Role
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              Institution
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
              Brainware University
            </span>
            <span className="text-[11px] text-slate-500">Department of Computer Science & Engineering</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-100 dark:border-darkSurface-border space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-bwu-700 dark:text-red-400" />
              Institutional Email
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
              {user?.email}
            </span>
            <span className="text-[11px] text-slate-500">Official Exam Creator & Invigilator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
