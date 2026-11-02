import React, { useEffect, useState, useRef } from 'react';
import { teacherService } from '../../services/teacherService';
import { getSocket } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  Video,
  ShieldAlert,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  XCircle,
  FileText,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function LiveMonitoring() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [warningTarget, setWarningTarget] = useState(null); // student attempt
  const [warningMessage, setWarningMessage] = useState(
    'Suspicious activity has been detected. Please remain on the examination screen. Further suspicious activity may result in termination of your examination.'
  );
  const [warningSending, setWarningSending] = useState(false);

  const [terminateTarget, setTerminateTarget] = useState(null);
  const [terminateReason, setTerminateReason] = useState('Repeatedly leaving examination window.');
  const [terminateSending, setTerminateSending] = useState(false);

  const [viewEventsTarget, setViewEventsTarget] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Live Toast for new cheating events
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Fetch monitoring data
  const fetchMonitoring = async () => {
    try {
      const res = await teacherService.getLiveMonitoring(selectedQuizId);
      if (res.success) {
        setStudents(res.students || []);
        if (res.quizzes) setQuizzes(res.quizzes);
      }
    } catch (err) {
      console.error('Failed to load live monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, [selectedQuizId]);

  // Socket.IO Real-Time Feed
  useEffect(() => {
    const socket = getSocket();

    socket.emit('join:monitoring', {
      quizId: selectedQuizId || null
    });

    // Handle student starting exam
    socket.on('exam:started', (data) => {
      fetchMonitoring();
      addLiveAlert({
        title: 'Exam Session Started',
        message: `${data.student?.name} (${data.student?.studentCode}) began ${data.quizTitle}`,
        type: 'info'
      });
    });

    // Handle student progress update
    socket.on('exam:progress', ({ attemptId, answeredCount, totalQuestions }) => {
      setStudents(prev => prev.map(s => {
        if (s.attemptId === attemptId) {
          const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
          return {
            ...s,
            progress: { answered: answeredCount, total: totalQuestions, percentage: pct }
          };
        }
        return s;
      }));
    });

    // Handle anti-cheating event received
    socket.on('exam:cheating-event', (eventData) => {
      setStudents(prev => prev.map(s => {
        if (s.attemptId === eventData.attemptId) {
          const count = eventData.suspiciousEventsCount || (s.suspiciousEventsCount + 1);
          let monitoringStatus = 'Warning';
          if (count >= 4) monitoringStatus = 'Suspicious';
          return {
            ...s,
            suspiciousEventsCount: count,
            monitoringStatus
          };
        }
        return s;
      }));

      addLiveAlert({
        title: `Suspicious Event: ${eventData.eventType}`,
        message: `${eventData.studentName} (${eventData.studentCode}) - ${eventData.description}`,
        type: 'warning'
      });
    });

    // Handle exam submission
    socket.on('exam:submitted', ({ attemptId }) => {
      setStudents(prev => prev.filter(s => s.attemptId !== attemptId));
    });

    // Handle status change
    socket.on('exam:status-change', ({ attemptId, status }) => {
      if (status === 'terminated') {
        setStudents(prev => prev.map(s => s.attemptId === attemptId ? { ...s, monitoringStatus: 'Terminated' } : s));
      }
    });

    return () => {
      socket.off('exam:started');
      socket.off('exam:progress');
      socket.off('exam:cheating-event');
      socket.off('exam:submitted');
      socket.off('exam:status-change');
    };
  }, [selectedQuizId]);

  // Live Timer Countdown ticker for cards
  useEffect(() => {
    const timer = setInterval(() => {
      setStudents(prev => prev.map(s => ({
        ...s,
        timeRemainingSeconds: Math.max(0, s.timeRemainingSeconds - 1)
      })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addLiveAlert = (alert) => {
    const id = Date.now() + Math.random();
    setLiveAlerts(prev => [{ id, ...alert }, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setLiveAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  // Open events modal
  const handleViewEvents = async (student) => {
    setViewEventsTarget(student);
    setEventsLoading(true);
    try {
      const res = await teacherService.getAttemptEvents(student.attemptId);
      if (res.success) {
        setEventsList(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Send Teacher Warning
  const handleSendWarning = async (e) => {
    e.preventDefault();
    if (!warningTarget) return;

    setWarningSending(true);
    try {
      const res = await teacherService.sendWarning(warningTarget.attemptId, warningMessage);
      if (res.success) {
        setStudents(prev => prev.map(s => {
          if (s.attemptId === warningTarget.attemptId) {
            return { ...s, warningCount: res.warningCount, monitoringStatus: 'Warning' };
          }
          return s;
        }));
        setWarningTarget(null);
      }
    } catch (err) {
      alert('Failed to send warning');
    } finally {
      setWarningSending(false);
    }
  };

  // Terminate Exam
  const handleTerminateExam = async (e) => {
    e.preventDefault();
    if (!terminateTarget || !terminateReason.trim()) return;

    setTerminateSending(true);
    try {
      const res = await teacherService.terminateAttempt(terminateTarget.attemptId, terminateReason.trim());
      if (res.success) {
        setStudents(prev => prev.map(s => {
          if (s.attemptId === terminateTarget.attemptId) {
            return { ...s, monitoringStatus: 'Terminated' };
          }
          return s;
        }));
        setTerminateTarget(null);
      }
    } catch (err) {
      alert('Failed to terminate examination');
    } finally {
      setTerminateSending(false);
    }
  };

  const formatRemaining = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    return s.student.name.toLowerCase().includes(q) ||
           s.student.studentCode?.toLowerCase().includes(q) ||
           s.quizTitle.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Live Alerts Container */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {liveAlerts.map(alert => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-2xl shadow-xl border pointer-events-auto animate-in slide-in-from-right duration-200 text-xs ${
              alert.type === 'warning'
                ? 'bg-amber-900/90 text-amber-100 border-amber-700 backdrop-blur-md'
                : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{alert.title}</span>
            </div>
            <p className="text-[11px] opacity-90">{alert.message}</p>
          </div>
        ))}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Live Examination Invigilation
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Socket.IO surveillance of student candidate activities, answer velocity, and focus breaches.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Active Quizzes</option>
            {quizzes.map(q => (
              <option key={q._id} value={q._id}>{q.title}</option>
            ))}
          </select>

          <button
            onClick={fetchMonitoring}
            className="p-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Refresh Live Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student code or name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Active Candidates: <span className="font-mono text-bwu-700 dark:text-red-400">{filteredStudents.length}</span>
        </div>
      </div>

      {/* Active Students Cards Grid */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-44" />
      ) : filteredStudents.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border space-y-3">
          <Video className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Active Examination Sessions
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no students writing examinations. As soon as a student begins an exam, their live card and activity metrics will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((candidate) => {
            const isTerminated = candidate.monitoringStatus === 'Terminated';
            const isSuspicious = candidate.monitoringStatus === 'Suspicious';
            const isWarning = candidate.monitoringStatus === 'Warning';

            let cardBorder = 'border-slate-200/90 dark:border-darkSurface-border';
            if (isTerminated) cardBorder = 'border-red-500 ring-1 ring-red-500/30';
            else if (isSuspicious) cardBorder = 'border-red-400 ring-2 ring-red-400/20';
            else if (isWarning) cardBorder = 'border-amber-400';

            return (
              <div
                key={candidate.attemptId}
                className={`bg-white dark:bg-darkSurface-card p-5 rounded-2xl border ${cardBorder} shadow-sm space-y-4 transition-all`}
              >
                {/* Card Header: Student identity & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {candidate.student.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {candidate.student.studentCode}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {candidate.student.course}
                    </span>
                  </div>

                  <Badge
                    variant={
                      isTerminated
                        ? 'danger'
                        : isSuspicious
                        ? 'danger'
                        : isWarning
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  >
                    {candidate.monitoringStatus.toUpperCase()}
                  </Badge>
                </div>

                {/* Quiz & Progress */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-semibold truncate pr-2">{candidate.quizTitle}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {candidate.progress.answered} / {candidate.progress.total}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-bwu-700 h-full rounded-full transition-all"
                      style={{ width: `${candidate.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrics: Time & Suspicious Events */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Remaining
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatRemaining(candidate.timeRemainingSeconds)}
                    </span>
                  </div>

                  <div
                    onClick={() => handleViewEvents(candidate)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors flex flex-col items-center justify-center"
                    title="Click to view detailed breach log"
                  >
                    <span className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                      Suspicious
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                      {candidate.suspiciousEventsCount} Events
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Invigilator */}
                {!isTerminated ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-darkSurface-border grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewEvents(candidate)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-darkSurface-subtle hover:bg-slate-200 transition-colors"
                    >
                      Events
                    </button>

                    <button
                      type="button"
                      onClick={() => setWarningTarget(candidate)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-colors"
                    >
                      Warn
                    </button>

                    <button
                      type="button"
                      onClick={() => setTerminateTarget(candidate)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      Terminate
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold">
                    SESSION TERMINATED
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Events Modal */}
      {viewEventsTarget && (
        <Modal
          isOpen={!!viewEventsTarget}
          onClose={() => setViewEventsTarget(null)}
          title={`Breach Audit Log: ${viewEventsTarget.student.name}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-darkSurface-border">
              <span className="font-mono text-slate-500">{viewEventsTarget.student.studentCode}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{viewEventsTarget.quizTitle}</span>
            </div>

            {eventsLoading ? (
              <LoadingSkeleton count={3} height="h-12" />
            ) : eventsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p>No suspicious focus or clipboard events recorded for this candidate.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {eventsList.map((e) => (
                  <div
                    key={e._id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-darkSurface-border bg-slate-50 dark:bg-darkSurface-subtle space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {e.eventType}
                      </span>
                      <Badge
                        variant={e.severity === 'high' ? 'danger' : e.severity === 'medium' ? 'warning' : 'default'}
                        size="xs"
                      >
                        {e.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{e.description}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Send Warning Modal */}
      {warningTarget && (
        <Modal
          isOpen={!!warningTarget}
          onClose={() => setWarningTarget(null)}
          title={`Send Invigilation Warning: ${warningTarget.student.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendWarning} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              This message will be instantly transmitted to the candidate's browser screen as a prominent warning overlay.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Warning Notice
              </label>
              <textarea
                rows={3}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWarningTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={warningSending}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{warningSending ? 'Transmitting...' : 'Dispatch Warning'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Terminate Examination Modal */}
      {terminateTarget && (
        <Modal
          isOpen={!!terminateTarget}
          onClose={() => setTerminateTarget(null)}
          title="Confirm Examination Termination"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleTerminateExam} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400">
              <p className="font-bold text-sm mb-1">Are you sure you want to terminate this examination?</p>
              <p>
                The candidate's test session will immediately freeze, answers will lock, and the attempt will be formally classified as Terminated.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Formal Termination Reason (Required)
              </label>
              <textarea
                rows={3}
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder="e.g. Repeatedly leaving examination window after official warnings."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTerminateTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={terminateSending || !terminateReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{terminateSending ? 'Terminating...' : 'Terminate Exam'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
