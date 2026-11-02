import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  UserCheck,
  Plus,
  Search,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TeachersManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    initialPassword: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset Modal
  const [resetTarget, setResetTarget] = useState(null);
  const [tempPassword, setTempPassword] = useState('Brainware@2024');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await adminService.getUsers({ role: 'teacher' });
      if (res.success) {
        setTeachers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    const nextStatus = teacher.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminService.toggleUserStatus(teacher._id, nextStatus);
      if (res.success) {
        setTeachers(prev => prev.map(t => t._id === teacher._id ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const res = await adminService.createTeacher(newTeacher);
      if (res.success) {
        setTeachers(prev => [res.teacher, ...prev]);
        setCreateModal(false);
        setNewTeacher({ firstName: '', lastName: '', email: '', initialPassword: 'Teacher@2024' });
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create teacher account');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;

    setResetSubmitting(true);
    try {
      const res = await adminService.resetUserPassword(resetTarget._id, tempPassword);
      if (res.success) {
        setResetMsg(`Password reset to: ${tempPassword}. Faculty will be required to change it on login.`);
        setTimeout(() => {
          setResetTarget(null);
          setResetMsg('');
        }, 2000);
      }
    } catch (err) {
      alert('Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return t.fullName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title & Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Faculty Instructor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorize examiners, configure academic access privileges, and manage instructor accounts.
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} height="h-16" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No faculty instructor accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Faculty Name</th>
                  <th className="px-6 py-4">Institutional Email</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Password Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {t.fullName}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {t.email}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className="cursor-pointer"
                        title="Toggle active status"
                      >
                        <Badge variant={t.status === 'active' ? 'success' : 'danger'} size="xs">
                          {t.status?.toUpperCase()}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.passwordStatus === 'Changed' ? 'success' : 'warning'} size="xs">
                        {t.passwordStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setResetTarget(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border inline-flex items-center gap-1.5 transition-colors"
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

      {/* Create Teacher Modal */}
      {createModal && (
        <Modal
          isOpen={createModal}
          onClose={() => setCreateModal(false)}
          title="Create Faculty Instructor Account"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
            {createError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={newTeacher.firstName}
                  onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                  placeholder="e.g. Debasis"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newTeacher.lastName}
                  onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                  placeholder="e.g. Mukherjee"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                placeholder="faculty@brainwareuniversity.ac.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Initial Temporary Password
              </label>
              <input
                type="text"
                value={newTeacher.initialPassword}
                onChange={(e) => setNewTeacher({ ...newTeacher, initialPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
              >
                {createSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          title={`Reset Password: ${resetTarget.fullName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            {resetMsg ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400">
                {resetMsg}
              </div>
            ) : (
              <>
                <p>Set temporary password for faculty member. They will be forced to change it on next login.</p>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
                  >
                    {resetSubmitting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
