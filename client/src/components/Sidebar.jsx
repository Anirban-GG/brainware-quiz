import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  History,
  FileQuestion,
  UserCheck,
  Video,
  BarChart3,
  Users,
  ShieldAlert,
  Sliders,
  Award,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/quizzes', label: 'Available Quizzes', icon: BookOpen },
    { to: '/student/results', label: 'My Results', icon: History },
    { to: '/student/reports', label: 'Question Reports', icon: FileQuestion },
    { to: '/student/profile', label: 'Student Profile', icon: UserCheck }
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/quizzes', label: 'My Quizzes', icon: BookOpen },
    { to: '/teacher/monitoring', label: 'Live Monitoring', icon: Video, badge: 'LIVE' },
    { to: '/teacher/results', label: 'Results & Analytics', icon: BarChart3 },
    { to: '/teacher/reports', label: 'Question Reports', icon: FileQuestion },
    { to: '/teacher/profile', label: 'Faculty Profile', icon: UserCheck }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/teachers', label: 'Teachers', icon: UserCheck },
    { to: '/admin/quizzes', label: 'All Quizzes', icon: BookOpen },
    { to: '/admin/attempts', label: 'Exam Attempts', icon: Award },
    { to: '/admin/cheating-logs', label: 'Cheating Logs', icon: AlertTriangle },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    { to: '/admin/settings', label: 'System Settings', icon: Sliders }
  ];

  let links = studentLinks;
  let sectionTitle = 'Student Portal';
  if (user.role === 'teacher') {
    links = teacherLinks;
    sectionTitle = 'Faculty Portal';
  } else if (user.role === 'admin') {
    links = adminLinks;
    sectionTitle = 'Administration Portal';
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 flex-shrink-0 bg-white dark:bg-darkSurface-card border-r border-slate-200 dark:border-darkSurface-border transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {sectionTitle}
          </div>
          <nav className="space-y-1 mt-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-bwu-700 text-white shadow-sm shadow-red-700/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Academic Portal Info Box */}
          <div className="mt-8 p-3.5 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200/80 dark:border-darkSurface-border text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Brainware University
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              Online Examination & Assessment Portal
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
