import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  Users,
  Search,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');

  // Status toggle loading map
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminService.getUsers({ role: 'student' });
      if (res.success) {
        setStudents(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    setUpdatingStatusId(student._id);
    try {
      const res = await adminService.toggleUserStatus(student._id, nextStatus);
      if (res.success) {
        setStudents(prev => prev.map(s => s._id === student._id ? { ...s, status: nextStatus } : s));
      }
    } catch (err) {
      alert('Failed to update student status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetFeedback('');
    try {
      const res = await adminService.resetUserPassword(resetTarget._id);
      if (res.success) {
        setResetFeedback(res.message);
        setStudents(prev => prev.map(s => s._id === resetTarget._id ? { ...s, passwordStatus: 'Default' } : s));
        setTimeout(() => {
          setResetTarget(null);
          setResetFeedback('');
        }, 2000);
      }
    } catch (err) {
      alert('Failed to reset student password');
    } finally {
      setResetting(false);
    }
  };

  const filtered = students.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = s.fullName.toLowerCase().includes(q) ||
                          s.studentCode?.toLowerCase().includes(q) ||
                          s.courseName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Student Candidate Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student registrations, activate/deactivate exam authorization, and reset credentials.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name..."
              className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} height="h-16" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No student candidate records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Student Code</th>
                  <th className="px-6 py-4">Programme</th>
                  <th className="px-6 py-4">Admission</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Password Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {s.fullName}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-bwu-700 dark:text-red-400">
                      {s.studentCode}
                    </td>
                    <td className="px-6 py-4">
                      {s.courseName || s.courseCode}
                    </td>
                    <td className="px-6 py-4">
                      {s.admissionYear} (Roll: {s.rollNumber})
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        disabled={updatingStatusId === s._id}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                        title="Click to toggle active/inactive status"
                      >
                        <Badge variant={s.status === 'active' ? 'success' : 'danger'} size="xs">
                          {s.status?.toUpperCase()}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.passwordStatus === 'Changed' ? 'success' : 'warning'} size="xs">
                        {s.passwordStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setResetTarget(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border inline-flex items-center gap-1.5 transition-colors"
                        title="Reset student password to default code"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal
          isOpen={!!resetTarget}
          onClose={() => !resetting && setResetTarget(null)}
          title={`Reset Password: ${resetTarget.fullName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            {resetFeedback ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetFeedback}</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Reset password for candidate <span className="font-mono">{resetTarget.studentCode}</span>?
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border space-y-1">
                  <p>
                    • Password will revert to the default initial password (Student Code: <strong>{resetTarget.studentCode}</strong>).
                  </p>
                  <p>
                    • The student will be <strong>forced to create a new password</strong> on their next login attempt.
                  </p>
                  <p>
                    • For academic security, actual passwords are never visible to administrators.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    disabled={resetting}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={resetting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset to Default'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
