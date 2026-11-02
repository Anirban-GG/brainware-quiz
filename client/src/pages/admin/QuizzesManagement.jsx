import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { teacherService } from '../../services/teacherService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  BookOpen,
  Search,
  CheckCircle,
  EyeOff,
  Trash2,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';

export default function QuizzesManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await adminService.getAllQuizzes();
      if (res.success) {
        setQuizzes(res.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to load all quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quiz) => {
    const nextPublished = quiz.published === 'published' ? 'unpublished' : 'published';
    setActionLoading(true);
    try {
      const res = await adminService.toggleQuizPublish(quiz._id, nextPublished);
      if (res.success) {
        setQuizzes(prev => prev.map(q => q._id === quiz._id ? { ...q, published: nextPublished } : q));
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await teacherService.deleteQuiz(deleteTarget._id);
      if (res.success) {
        setQuizzes(prev => prev.filter(q => q._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      alert('Failed to delete quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = quizzes.filter(q => {
    const term = search.toLowerCase();
    return q.title.toLowerCase().includes(term) ||
           q.category.toLowerCase().includes(term) ||
           (q.teacherName && q.teacherName.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            University Examinations Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global repository oversight across all academic departments and course programmes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author..."
            className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          />
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
            No examinations found in university repository.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Title & Subject</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Duration & Qs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Attempts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {q.title}
                      </div>
                      <Badge variant="primary" size="xs" className="mt-1">
                        {q.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {q.teacherName}
                    </td>
                    <td className="px-6 py-4">
                      <span>{q.duration} Mins</span>
                      <span className="text-slate-400 block text-[11px]">{q.questionCount || 0} Questions</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={q.published === 'published' ? 'success' : 'default'} size="xs">
                        {q.published?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {q.attemptCount || 0}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleTogglePublish(q)}
                        disabled={actionLoading}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                          q.published === 'published'
                            ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {q.published === 'published' ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete University Examination"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Permanently delete "{deleteTarget.title}"?
            </p>
            <p>
              This will irreversibly remove all questions, student attempts, and cheating events associated with this examination.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
