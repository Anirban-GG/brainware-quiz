import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  FileQuestion,
  Clock,
  Award,
  CheckCircle,
  EyeOff,
  Search,
  ExternalLink
} from 'lucide-react';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteQuizId, setDeleteQuizId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await teacherService.getQuizzes();
      if (res.success) {
        setQuizzes(res.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quiz) => {
    setActionLoading(true);
    const newStatus = quiz.published === 'published' ? 'unpublished' : 'published';
    try {
      const res = await teacherService.updateQuiz(quiz._id, { published: newStatus });
      if (res.success) {
        setQuizzes(prev => prev.map(q => q._id === quiz._id ? { ...q, published: newStatus } : q));
      }
    } catch (err) {
      alert('Failed to update quiz status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuizId) return;
    setActionLoading(true);
    try {
      const res = await teacherService.deleteQuiz(deleteQuizId);
      if (res.success) {
        setQuizzes(prev => prev.filter(q => q._id !== deleteQuizId));
        setDeleteQuizId(null);
      }
    } catch (err) {
      alert('Failed to delete quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = quizzes.filter(q => {
    const matchesFilter = filter === 'all' || q.published === filter;
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                          q.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Examinations Repository
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author and configure quizzes, set anti-cheat parameters, and manage question banks.
          </p>
        </div>

        <Link
          to="/teacher/quizzes/new"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </Link>
      </div>

      {/* Search & Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {['all', 'published', 'draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === tab
                  ? 'bg-bwu-700 text-white shadow-xs'
                  : 'bg-white dark:bg-darkSurface-card text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkSurface-border hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quiz title..."
            className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <LoadingSkeleton count={4} height="h-24" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No examinations found.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Get started by creating your first online examination.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" size="xs">
                    {quiz.category}
                  </Badge>
                  <Badge
                    variant={quiz.published === 'published' ? 'success' : 'default'}
                    size="xs"
                  >
                    {quiz.published?.toUpperCase()}
                  </Badge>
                  <Badge variant="warning" size="xs">
                    {quiz.difficulty?.toUpperCase()}
                  </Badge>
                  {quiz.randomizeQuestions && (
                    <span className="text-[10px] text-slate-400">Random Qs: ON</span>
                  )}
                  {quiz.negativeMarking && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      Negative Marking
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {quiz.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {quiz.duration} Mins
                  </span>
                  <span>•</span>
                  <span>{quiz.questionCount || 0} Questions</span>
                  <span>•</span>
                  <span>Total: {quiz.totalMarks} Marks (Pass: {quiz.passingMarks})</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {quiz.attemptCount || 0} Attempts Recorded
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/teacher/quizzes/${quiz._id}/questions`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border inline-flex items-center gap-1.5"
                  title="Manage questions repository"
                >
                  <FileQuestion className="w-3.5 h-3.5" />
                  <span>Questions ({quiz.questionCount || 0})</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleTogglePublish(quiz)}
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
                    quiz.published === 'published'
                      ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100'
                      : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100'
                  }`}
                >
                  {quiz.published === 'published' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Unpublish</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/teacher/quizzes/${quiz._id}/edit`}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border"
                  title="Edit Quiz Configuration"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setDeleteQuizId(quiz._id)}
                  className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-darkSurface-border"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteQuizId && (
        <Modal
          isOpen={!!deleteQuizId}
          onClose={() => setDeleteQuizId(null)}
          title="Confirm Quiz Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Are you sure you want to permanently delete this examination?
            </p>
            <p>
              This action will remove all questions, student attempts, cheating records, and reports associated with this quiz.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteQuizId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Quiz Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
