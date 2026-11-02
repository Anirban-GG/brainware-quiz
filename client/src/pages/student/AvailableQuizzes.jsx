import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  BookOpen,
  Search,
  Clock,
  Award,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function AvailableQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await studentService.getAvailableQuizzes();
      if (res.success) {
        setQuizzes(res.quizzes || []);
      }
    } catch (err) {
      setError('Unable to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (quizId) => {
    setStarting(true);
    setError('');
    try {
      const res = await studentService.startAttempt(quizId);
      if (res.success && res.attemptId) {
        navigate(`/student/exam/${res.attemptId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start examination.');
      setStarting(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Available Examinations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse official continuous assessments and scheduled university examinations.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quiz or subject..."
              className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-bwu-700"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton count={4} height="h-32" />
      ) : filteredQuizzes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No examinations found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            No published examinations match your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => {
            const isAttempted = quiz.attempt && quiz.attempt.status === 'submitted';
            const isTerminated = quiz.attempt && quiz.attempt.status === 'terminated';
            const isInProgress = quiz.attempt && quiz.attempt.status === 'in-progress';

            return (
              <div
                key={quiz._id}
                className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="primary" size="xs">
                      {quiz.category}
                    </Badge>
                    <Badge
                      variant={quiz.difficulty === 'easy' ? 'success' : quiz.difficulty === 'hard' ? 'danger' : 'warning'}
                      size="xs"
                    >
                      {quiz.difficulty?.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {quiz.description || 'Institutional assessment for coursework evaluation.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-darkSurface-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-darkSurface-subtle">
                      <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.duration} Mins</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-darkSurface-subtle">
                      <span className="text-[10px] text-slate-400 block uppercase">Questions</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.questionCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-darkSurface-subtle">
                      <span className="text-[10px] text-slate-400 block uppercase">Passing</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.passingMarks} Pts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-darkSurface-border flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Faculty: {quiz.teacherName}
                  </span>

                  <div>
                    {isAttempted ? (
                      <Link
                        to={`/student/results/${quiz.attempt.attemptId || quiz.attempt._id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        Completed ({quiz.attempt.score} Pts)
                      </Link>
                    ) : isTerminated ? (
                      <Badge variant="danger">Terminated</Badge>
                    ) : isInProgress ? (
                      <Link
                        to={`/student/exam/${quiz.attempt.attemptId || quiz.attempt._id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        Resume Attempt
                      </Link>
                    ) : (
                      <button
                        onClick={() => setSelectedQuiz(quiz)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-bwu-700 hover:bg-bwu-800 text-white shadow-sm transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Exam Instructions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Examination Instructions & Consent Modal */}
      {selectedQuiz && (
        <Modal
          isOpen={!!selectedQuiz}
          onClose={() => !starting && setSelectedQuiz(null)}
          title={`Examination: ${selectedQuiz.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
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
                <li>Total Questions: <strong>{selectedQuiz.questionCount}</strong>. Answers are automatically saved.</li>
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartExam(selectedQuiz._id)}
                disabled={starting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 disabled:opacity-50 inline-flex items-center gap-2"
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
