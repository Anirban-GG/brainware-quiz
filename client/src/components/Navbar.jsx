import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Badge from './Badge';
import { GraduationCap, LogOut, User, Menu } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleVariants = {
    student: 'primary',
    teacher: 'info',
    admin: 'purple'
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-darkSurface-card/95 backdrop-blur-md border-b border-slate-200 dark:border-darkSurface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bwu-800 to-bwu-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                    Brainware <span className="text-bwu-700 dark:text-red-500">Quiz</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-bwu-50 dark:bg-red-950/60 text-bwu-700 dark:text-red-400 border border-bwu-200 dark:border-red-900/40">
                    BWU
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-normal hidden md:inline">
                  Online Examination & Monitoring System
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Controls & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-darkSurface-border">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </span>
                    <Badge variant={roleVariants[user.role] || 'default'} size="xs">
                      {user.role?.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user.studentCode || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors border border-slate-200 dark:border-darkSurface-border"
                  title="Sign out of system"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-bwu-700 hover:bg-bwu-800 rounded-lg shadow-sm transition-colors"
                >
                  Student Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
