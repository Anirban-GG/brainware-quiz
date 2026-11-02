import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { getSocket } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { Spinner } from '../../components/LoadingSkeleton';
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  Flag,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function ExamInterface() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOption, isMarkedForReview } }
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Question is unclear');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Teacher Warning and Termination States
  const [teacherWarning, setTeacherWarning] = useState(null);
  const [terminationInfo, setTerminationInfo] = useState(null);

  // Time warnings triggered
  const warned10Min = useRef(false);
  const warned5Min = useRef(false);
  const warned1Min = useRef(false);
  const [timeWarningBanner, setTimeWarningBanner] = useState('');

  // Sockets & Anti-cheating refs
  const socketRef = useRef(null);
  const lastCheatingEventRef = useRef(0);

  // Helper to log suspicious event without spamming (throttle 2 sec)
  const logCheating = useCallback(async (eventType, severity = 'medium', description = '', metadata = {}) => {
    const now = Date.now();
    if (now - lastCheatingEventRef.current < 2000) return;
    lastCheatingEventRef.current = now;

    try {
      await studentService.logCheatingEvent(attemptId, eventType, severity, description, metadata);
    } catch (e) {
      // Ignore network error on anti-cheat log
    }
  }, [attemptId]);

  // Load Attempt Data
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await studentService.getAttempt(attemptId);
        if (res.success && res.attempt) {
          if (res.attempt.status === 'submitted') {
            navigate(`/student/results/${attemptId}`);
            return;
          }
          if (res.attempt.status === 'terminated') {
            setTerminationInfo({
              reason: res.attempt.terminationReason || 'Terminated by Invigilator'
            });
            setLoading(false);
            return;
          }

          setAttemptData(res.attempt);
          setRemainingSeconds(res.attempt.remainingSeconds || 0);

          // Populate local answers map
          const initialAnswers = {};
          res.attempt.questions.forEach((q) => {
            initialAnswers[q.questionId] = {
              selectedOption: q.selectedOption || null,
              isMarkedForReview: !!q.isMarkedForReview
            };
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load examination.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, navigate]);

  // Socket.IO Room & Live Events Listener
  useEffect(() => {
    if (!user || !attemptId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('join:exam', {
      attemptId,
      studentId: user._id
    });

    // Listen for Teacher warning
    socket.on('exam:warning', (data) => {
      setTeacherWarning(data.message || 'Suspicious activity detected. Remain on screen.');
    });

    // Listen for Teacher termination
    socket.on('exam:terminated', (data) => {
      setTerminationInfo({
        reason: data.reason || 'Terminated by faculty for examination protocol breach.'
      });
    });

    return () => {
      socket.off('exam:warning');
      socket.off('exam:terminated');
    };
  }, [user, attemptId]);

  // Server-Synchronized Timer Countdown
  useEffect(() => {
    if (remainingSeconds <= 0 || terminationInfo) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }

        // Time warnings
        if (prev === 600 && !warned10Min.current) {
          warned10Min.current = true;
          setTimeWarningBanner('Notice: 10 minutes remaining in this examination.');
        } else if (prev === 300 && !warned5Min.current) {
          warned5Min.current = true;
          setTimeWarningBanner('Notice: 5 minutes remaining. Please review your answers.');
        } else if (prev === 60 && !warned1Min.current) {
          warned1Min.current = true;
          setTimeWarningBanner('URGENT: 1 minute remaining. System will auto-submit when timer expires.');
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, terminationInfo]);

  // Anti-Cheating Event Listeners
  useEffect(() => {
    if (loading || terminationInfo) return;

    // 1. Tab Switching (VisibilityChange)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logCheating('TAB_SWITCH', 'medium', 'Student navigated away from examination tab.');
      }
    };

    // 2. Window Blur (Focus Loss)
    const handleBlur = () => {
      logCheating('WINDOW_BLUR', 'low', 'Examination browser window lost focus.');
    };

    // 3. Prevent Copy / Cut
    const handleCopy = (e) => {
      e.preventDefault();
      logCheating('COPY_ATTEMPT', 'medium', 'Clipboard copy blocked during examination.');
    };

    // 4. Prevent Paste
    const handlePaste = (e) => {
      e.preventDefault();
      logCheating('PASTE_ATTEMPT', 'medium', 'Clipboard paste blocked during examination.');
    };

    // 5. Prevent Context Menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      logCheating('RIGHT_CLICK', 'low', 'Context menu access blocked.');
    };

    // 6. Block Key Shortcuts (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, Ctrl+P)
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        logCheating('DEVTOOLS_ATTEMPT', 'high', `Keyboard shortcut blocked: ${e.key}`);
      }
    };

    // 7. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logCheating('FULLSCREEN_EXIT', 'high', 'Student exited fullscreen examination mode.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [loading, terminationInfo, logCheating]);

  // Request Fullscreen helper
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Select Option and Autosave
  const handleSelectOption = async (optionId) => {
    if (terminationInfo) return;

    const currentQuestion = attemptData.questions[currentIndex];
    const qId = currentQuestion.questionId;
    const currentAnswer = answers[qId] || { selectedOption: null, isMarkedForReview: false };

    // Toggle if clicked same
    const newSelected = currentAnswer.selectedOption === optionId ? null : optionId;

    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...currentAnswer, selectedOption: newSelected }
    }));

    // Autosave to server
    try {
      await studentService.saveAnswer(attemptId, qId, newSelected, currentAnswer.isMarkedForReview);
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    if (terminationInfo) return;

    const currentQuestion = attemptData.questions[currentIndex];
    const qId = currentQuestion.questionId;
    const currentAnswer = answers[qId] || { selectedOption: null, isMarkedForReview: false };

    const newReview = !currentAnswer.isMarkedForReview;

    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...currentAnswer, isMarkedForReview: newReview }
    }));

    try {
      await studentService.saveAnswer(attemptId, qId, currentAnswer.selectedOption, newReview);
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await studentService.submitAttempt(attemptId);
      if (res.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        navigate(`/student/results/${attemptId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Auto Submit on Zero Time
  const handleAutoSubmit = async () => {
    try {
      await studentService.submitAttempt(attemptId);
      navigate(`/student/results/${attemptId}`);
    } catch (e) {
      navigate(`/student/results/${attemptId}`);
    }
  };

  // Handle Question Report
  const handleReportQuestion = async (e) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;

    setReportSubmitting(true);
    setReportSuccess('');
    try {
      const currentQuestion = attemptData.questions[currentIndex];
      await studentService.reportQuestion({
        quizId: attemptData.quiz._id,
        attemptId,
        questionId: currentQuestion.questionId,
        reason: reportReason,
        message: reportMessage.trim()
      });
      setReportSuccess('Question reported. Faculty will review your remark.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportMessage('');
        setReportSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to submit question report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Format time remaining
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkSurface-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Initializing secure examination environment...
          </p>
        </div>
      </div>
    );
  }

  // If Terminated by Teacher
  if (terminationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-darkSurface-bg">
        <div className="max-w-md w-full bg-white dark:bg-darkSurface-card p-8 rounded-3xl border border-red-300 dark:border-red-900/60 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <XCircle className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Examination Terminated
          </h2>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-left text-red-800 dark:text-red-300 space-y-1">
            <span className="font-bold block uppercase text-[10px] text-red-500">
              Invigilator Termination Reason:
            </span>
            <p className="font-medium text-sm">{terminationInfo.reason}</p>
          </div>
          <p className="text-xs text-slate-500">
            Your examination has been locked by faculty. Answers submitted up to this point have been recorded.
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 transition-colors"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = attemptData?.questions[currentIndex];
  const totalQuestions = attemptData?.questions.length || 0;
  const currentAnswer = answers[currentQ?.questionId] || { selectedOption: null, isMarkedForReview: false };

  // Calculate statistics for question grid
  let answeredCount = 0;
  let reviewCount = 0;
  Object.values(answers).forEach((a) => {
    if (a.selectedOption) answeredCount++;
    if (a.isMarkedForReview) reviewCount++;
  });
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-darkSurface-bg text-slate-900 dark:text-slate-100 flex flex-col exam-secure-mode select-none">
      {/* Top Banner Warning Alerts */}
      {timeWarningBanner && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <Clock className="w-4 h-4 shrink-0" />
          <span>{timeWarningBanner}</span>
          <button
            onClick={() => setTimeWarningBanner('')}
            className="ml-4 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Focused Examination Header */}
      <header className="bg-white dark:bg-darkSurface-card border-b border-slate-200 dark:border-darkSurface-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-bwu-800 to-bwu-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {attemptData?.quiz.title}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user?.fullName} ({user?.studentCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Fullscreen Trigger */}
            <button
              onClick={enterFullscreen}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border"
              title="Enter Fullscreen Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>

            {/* Server-synced Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-xs ${
                remainingSeconds < 300
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse'
                  : remainingSeconds < 600
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-slate-100 dark:bg-darkSurface-subtle text-slate-800 dark:text-slate-200 border-slate-300 dark:border-darkSurface-border'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-sm shadow-red-700/20 transition-all flex items-center gap-1.5"
            >
              <span>Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Question & Options Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border p-6 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-darkSurface-border">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-bwu-700 dark:text-red-500">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-400">of {totalQuestions}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-darkSurface-subtle text-slate-600 dark:text-slate-300">
                  +{currentQ?.marks} Marks {currentQ?.negativeMarks > 0 ? `(-${currentQ?.negativeMarks})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Report question or remark"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-6">
              <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {currentQ?.questionText}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ?.options.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-bwu-700 dark:border-red-600 ring-2 ring-bwu-700/20'
                        : 'bg-slate-50/50 dark:bg-darkSurface-subtle/50 border-slate-200 dark:border-darkSurface-border hover:bg-slate-100 dark:hover:bg-darkSurface-subtle'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-bwu-700 text-white shadow-xs'
                          : 'bg-white dark:bg-darkSurface-card border border-slate-300 dark:border-darkSurface-border text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.id}
                    </div>
                    <span className="text-sm text-slate-800 dark:text-slate-200 pt-0.5">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Navigation Footer */}
          <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleReview}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                  currentAnswer.isMarkedForReview
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{currentAnswer.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-sm shadow-red-700/20 inline-flex items-center gap-1.5"
                >
                  <span>Save & Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Finish & Submit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Question Navigation Grid & Legend */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Question Navigator
            </h3>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2">
              {attemptData?.questions.map((q, idx) => {
                const ans = answers[q.questionId];
                const isCurrent = idx === currentIndex;
                const isAnswered = !!ans?.selectedOption;
                const isMarked = !!ans?.isMarkedForReview;

                let btnStyle = 'bg-slate-100 dark:bg-darkSurface-subtle text-slate-700 dark:text-slate-300 border-slate-200 dark:border-darkSurface-border';

                if (isMarked) {
                  btnStyle = 'bg-amber-500 text-white border-amber-600';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-700';
                }

                if (isCurrent) {
                  btnStyle += ' ring-2 ring-bwu-700 ring-offset-2 dark:ring-offset-darkSurface-card font-black';
                }

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold border transition-all flex items-center justify-center ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-100 dark:border-darkSurface-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
                  <span>Answered</span>
                </div>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500" />
                  <span>Marked for Review</span>
                </div>
                <span className="font-bold">{reviewCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-darkSurface-subtle" />
                  <span>Unanswered</span>
                </div>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </div>

            {/* Submit Exam Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-sm shadow-red-700/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit Final Examination</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Teacher Warning Modal */}
      {teacherWarning && (
        <Modal
          isOpen={!!teacherWarning}
          onClose={() => setTeacherWarning(null)}
          title="INVIGILATOR WARNING"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <p className="font-semibold text-sm mb-1">Notice from Faculty Invigilator:</p>
              <p className="leading-relaxed">{teacherWarning}</p>
            </div>
            <p className="text-[11px] text-slate-500">
              Please remain strictly focused on this examination screen. Repeated policy violations will lead to automatic termination.
            </p>
            <button
              onClick={() => setTeacherWarning(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </Modal>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => !submitting && setShowSubmitModal(false)}
          title="Confirm Examination Submission"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Are you sure you want to conclude and submit your examination?
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Answered</span>
                <span className="text-base font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Unanswered</span>
                <span className="text-base font-bold text-amber-600">{unansweredCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Once submitted, answers cannot be modified. Official results will be calculated immediately.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-darkSurface-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle"
              >
                Back to Exam
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting ? (
                  <span>Evaluating Answers...</span>
                ) : (
                  <>
                    <span>Confirm Final Submission</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Question Report Modal */}
      {showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Report Question ${currentIndex + 1}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReportQuestion} className="space-y-4 text-xs">
            {reportSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400">
                {reportSuccess}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Reason for Concern
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
                placeholder="Explain why you believe this question needs review..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
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
