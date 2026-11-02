import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Flag,
  FileText,
  ShieldAlert
} from 'lucide-react';

export default function ExamResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Modal
  const [reportingQ, setReportingQ] = useState(null);
  const [reportReason, setReportReason] = useState('Question is incorrect');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await studentService.getResultDetails(id);
        if (res.success && res.result) {
          setResult(res.result);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load examination result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingQ || !reportMessage.trim()) return;

    setReportSubmitting(true);
    try {
      await studentService.reportQuestion({
        quizId: result.quiz._id,
        attemptId: result._id,
        questionId: reportingQ.questionId,
        reason: reportReason,
        message: reportMessage.trim()
      });
      setReportSuccess('Question reported successfully. Faculty will review your remark.');
      setTimeout(() => {
        setReportingQ(null);
        setReportMessage('');
        setReportSuccess('');
      }, 1500);
    } catch (e) {
      // Handle error
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <LoadingSkeleton count={4} height="h-28" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Result Unavailable
        </h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not find result.'}</p>
        <Link
          to="/student/results"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-bwu-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Result History</span>
        </Link>
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/results"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-bwu-700 dark:hover:text-red-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Results</span>
        </Link>
        <span className="text-xs text-slate-400">
          Submitted on {new Date(result.submittedAt).toLocaleString()}
        </span>
      </div>

      {/* Main Scorecard Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-lg relative overflow-hidden ${
          result.isPassed
            ? 'bg-gradient-to-tr from-emerald-950/80 via-emerald-900 to-slate-900 text-white border-emerald-800'
            : 'bg-gradient-to-tr from-rose-950/80 via-rose-900 to-slate-900 text-white border-rose-800'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Official Examination Scorecard
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                {result.quiz?.title}
              </h1>
            </div>
            <Badge variant={result.isPassed ? 'success' : 'danger'} size="md" className="text-sm font-extrabold px-3 py-1">
              {result.isPassed ? 'PASSED' : 'NOT CLEARED'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-center">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-semibold text-white/70 block">Score</span>
              <span className="text-2xl font-black">{result.score}</span>
              <span className="text-[10px] text-white/60 block">of {result.totalMarksPossible} Marks</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-semibold text-white/70 block">Percentage</span>
              <span className="text-2xl font-black">{result.percentage}%</span>
              <span className="text-[10px] text-white/60 block">Pass: {result.quiz?.passingMarks} Marks</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-semibold text-white/70 block">Questions</span>
              <span className="text-2xl font-black">
                {result.correctCount} / {result.questions?.length}
              </span>
              <span className="text-[10px] text-white/60 block">
                {result.incorrectCount} wrong, {result.unansweredCount} skipped
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-semibold text-white/70 block">Time Taken</span>
              <span className="text-2xl font-black">{formatDuration(result.timeTaken || 0)}</span>
              <span className="text-[10px] text-white/60 block">of {result.quiz?.duration} Mins</span>
            </div>
          </div>

          {result.suspiciousEventsCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {result.suspiciousEventsCount} browser focus/tab events were logged during this session and archived with faculty.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question-By-Question Detailed Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-bwu-700 dark:text-red-500" />
          <span>Question Review & Explanations</span>
        </h2>

        <div className="space-y-4">
          {result.questions?.map((q, idx) => {
            return (
              <div
                key={q.questionId}
                className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle font-bold text-xs flex items-center justify-center text-slate-800 dark:text-slate-200 font-mono">
                      {idx + 1}
                    </span>
                    <Badge
                      variant={q.isCorrect ? 'success' : !q.isAnswered ? 'default' : 'danger'}
                      size="xs"
                    >
                      {q.isCorrect ? 'Correct' : !q.isAnswered ? 'Unanswered' : 'Incorrect'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Score: {q.marksObtained} / {q.marks} Pts
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportingQ(q)}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{q.isReported ? 'Reported' : 'Report'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {q.questionText}
                </p>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options?.map((opt) => {
                    const isSelected = q.selectedOption === opt.id;
                    const isAnswerCorrect = q.correctAnswer === opt.id;

                    let optStyle = 'border-slate-200 dark:border-darkSurface-border bg-slate-50/50 dark:bg-darkSurface-subtle/40';
                    if (isAnswerCorrect) {
                      optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !isAnswerCorrect) {
                      optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] bg-white/60 dark:bg-black/30 border border-slate-300 dark:border-darkSurface-border shrink-0">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isAnswerCorrect && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isSelected && !isAnswerCorrect && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                            ✗ Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200/80 dark:border-darkSurface-border text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Explanation:
                    </span>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Report Modal */}
      {reportingQ && (
        <Modal
          isOpen={!!reportingQ}
          onClose={() => setReportingQ(null)}
          title={`Report Question ${reportingQ.index}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
            {reportSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400">
                {reportSuccess}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
              >
                <option value="Question is incorrect">Question is incorrect</option>
                <option value="Correct answer appears wrong">Correct answer appears wrong</option>
                <option value="Multiple answers appear correct">Multiple answers appear correct</option>
                <option value="Question is unclear">Question is unclear</option>
                <option value="Typographical error">Typographical error</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Explain your concern
              </label>
              <textarea
                rows={3}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="State why you believe this question needs correction..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportingQ(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportSubmitting || !reportMessage.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
