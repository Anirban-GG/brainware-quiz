import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  BookOpen,
  Award,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileQuestion,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const handleStartExam = async (quizId) => {
    setStarting(true);
    setStartError('');
    try {
      const res = await studentService.startAttempt(quizId);
      if (res.success && res.attemptId) {
        navigate(`/student/exam/${res.attemptId}`);
      }
    } catch (err) {
      setStartError(err.response?.data?.message || 'Failed to start examination.');
      setStarting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesRes, resultsRes] = await Promise.all([
          studentService.getAvailableQuizzes(),
          studentService.getResults()
        ]);
        if (quizzesRes.success) setQuizzes(quizzesRes.quizzes || []);
        if (resultsRes.success) setResults(resultsRes.results || []);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const attemptedCount = results.length;
  const passedCount = results.filter(r => r.isPassed).length;
  const avgScore = attemptedCount > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / attemptedCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-bwu-900 via-bwu-800 to-bwu-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-950/20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/90 backdrop-blur-xs mb-2">
            Brainware University Examination Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="mt-1 text-sm text-red-100 max-w-2xl">
            {user?.courseName || 'Bachelor of Computer Applications'} • Student Code: <span className="font-mono font-semibold">{user?.studentCode}</span>
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <Award className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Quizzes"
          value={loading ? '...' : quizzes.length}
          icon={BookOpen}
          color="blue"
          subtitle="Ready for assessment"
        />
        <StatCard
          title="Exams Attempted"
          value={loading ? '...' : attemptedCount}
          icon={Award}
          color="purple"
          subtitle="Total recorded exams"
        />
        <StatCard
          title="Average Score"
          value={loading ? '...' : `${avgScore}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Performance metric"
        />
        <StatCard
          title="Passed Exams"
          value={loading ? '...' : `${passedCount} / ${attemptedCount}`}
          icon={CheckCircle}
          color="red"
          subtitle="Passing requirement met"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Available Quizzes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-bwu-700 dark:text-red-500" />
              <span>Available Examinations</span>
            </h2>
            <Link
              to="/student/quizzes"
              className="text-xs font-semibold text-bwu-700 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} height="h-28" />
          ) : quizzes.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No quizzes available right now.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Your instructors have not scheduled any pending examinations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {quizzes.slice(0, 4).map((q) => {
                const isAttempted = q.attempt && q.attempt.status === 'submitted';
                const isTerminated = q.attempt && q.attempt.status === 'terminated';
                const isInProgress = q.attempt && q.attempt.status === 'in-progress';

                return (
                  <div
                    key={q._id}
                    className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="primary" size="xs">
                          {q.category}
                        </Badge>
                        <Badge
                          variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}
                          size="xs"
                        >
                          {q.difficulty?.toUpperCase()}
                        </Badge>
                        {q.negativeMarking && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            • Negative Marking
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {q.duration} Mins
                        </span>
                        <span>•</span>
                        <span>{q.questionCount || 0} Questions</span>
                        <span>•</span>
                        <span>Pass: {q.passingMarks} / {q.totalMarks} Marks</span>
                      </div>
                    </div>

                    <div>
                      {isAttempted ? (
                        <Link
                          to={`/student/results/${q.attempt.attemptId || q.attempt._id}`}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>View Result ({q.attempt.score} pts)</span>
                        </Link>
                      ) : isTerminated ? (
                        <Badge variant="danger" size="md">
                          Terminated by Faculty
                        </Badge>
                      ) : isInProgress ? (
                        <Link
                          to={`/student/exam/${q.attempt.attemptId || q.attempt._id}`}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm inline-flex items-center gap-1.5"
                        >
                          <span>Resume Exam</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setStartError('');
                            setSelectedQuiz(q);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-bwu-700 hover:bg-bwu-800 text-white shadow-sm shadow-red-700/20 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Start Examination</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-bwu-700 dark:text-red-500" />
              <span>Recent Results</span>
            </h2>
            <Link
              to="/student/results"
              className="text-xs font-semibold text-bwu-700 dark:text-red-400 hover:underline"
            >
              All Results
            </Link>
          </div>

          <div className="bg-white dark:bg-darkSurface-card p-4 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border space-y-3">
            {loading ? (
              <LoadingSkeleton count={3} height="h-16" />
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">No examination attempts yet.</p>
              </div>
            ) : (
              results.slice(0, 5).map((r) => (
                <Link
                  key={r._id}
                  to={`/student/results/${r._id}`}
                  className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-darkSurface-subtle transition-colors border border-transparent hover:border-slate-200 dark:hover:border-darkSurface-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {r.quizTitle}
                    </span>
                    <Badge variant={r.isPassed ? 'success' : 'danger'} size="xs">
                      {r.isPassed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Score: {r.score} / {r.totalMarks} ({r.percentage}%)
                    </span>
                    <span>
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Examination Instructions & Consent Modal */}
      {selectedQuiz && (
        <Modal
          isOpen={!!selectedQuiz}
          onClose={() => !starting && setSelectedQuiz(null)}
          title={`Examination: ${selectedQuiz.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            {startError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{startError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 text-bwu-700 dark:text-red-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                  Brainware University Anti-Cheating Protocol
                </span>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  This examination operates under live invigilation. Your browser activity is actively monitored for academic integrity.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Assessment Rules & Guidelines:
              </h4>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-600 dark:text-slate-400">
                <li>Total Duration: <strong>{selectedQuiz.duration} minutes</strong>. Server-enforced countdown timer.</li>
                <li>Total Questions: <strong>{selectedQuiz.questionCount || 0}</strong>. Answers are automatically saved.</li>
                <li>Passing Requirement: <strong>{selectedQuiz.passingMarks} marks</strong>.</li>
                {selectedQuiz.negativeMarking && (
                  <li className="text-amber-600 dark:text-amber-400 font-semibold">
                    Negative marking is active on incorrect answers.
                  </li>
                )}
                <li><strong>No tab switching:</strong> Navigating away from the exam tab will be logged and transmitted to your invigilator.</li>
                <li><strong>Copy, paste, and right-click</strong> are disabled throughout the session.</li>
                <li>Invigilators can issue live warnings or terminate unauthorized sessions remotely.</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-darkSurface-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                disabled={starting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartExam(selectedQuiz._id)}
                disabled={starting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {starting ? (
                  <span>Initializing Examination...</span>
                ) : (
                  <>
                    <span>I Agree & Begin Examination</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
