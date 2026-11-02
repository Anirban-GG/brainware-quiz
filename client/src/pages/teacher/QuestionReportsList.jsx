import React, { useEffect, useState } from 'react';
import { teacherService } from '../../services/teacherService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import { FileQuestion, CheckCircle2, XCircle, MessageSquare, AlertCircle } from 'lucide-react';

export default function QuestionReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Response Modal
  const [activeReport, setActiveReport] = useState(null);
  const [status, setStatus] = useState('resolved');
  const [responseMsg, setResponseMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await teacherService.getReports();
      if (res.success) {
        setReports(res.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (rep) => {
    setActiveReport(rep);
    setStatus(rep.status === 'pending' ? 'resolved' : rep.status);
    setResponseMsg(rep.teacherResponse || '');
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!activeReport) return;

    setSubmitting(true);
    try {
      const res = await teacherService.resolveReport(activeReport._id, status, responseMsg);
      if (res.success) {
        setReports(prev => prev.map(r => r._id === activeReport._id ? res.report : r));
        setActiveReport(null);
      }
    } catch (err) {
      alert('Failed to update report resolution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Question Inquiries & Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review student questions, typographical error reports, and respond with academic feedback.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
          <FileQuestion className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No Pending Question Inquiries
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Students have not flagged any issues with your examination questions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isResolved = report.status === 'resolved';
            const isRejected = report.status === 'rejected';

            return (
              <div
                key={report._id}
                className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {report.studentId ? `${report.studentId.firstName} ${report.studentId.lastName}` : 'Student'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({report.studentId?.studentCode})
                      </span>
                      <Badge variant="primary" size="xs">
                        {report.quizId?.title}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-semibold text-bwu-700 dark:text-red-400 block mt-0.5">
                      Issue: {report.reason}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isResolved ? 'success' : isRejected ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {report.status.toUpperCase()}
                    </Badge>

                    <button
                      onClick={() => handleOpenResolve(report)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bwu-700 hover:bg-bwu-800 text-white shadow-xs"
                    >
                      {isResolved || isRejected ? 'Edit Response' : 'Respond & Resolve'}
                    </button>
                  </div>
                </div>

                {report.questionId && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle/50 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Reported Question:
                    </span>
                    <p className="font-medium">{report.questionId.questionText}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-slate-800 dark:text-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">
                    Student Remark:
                  </span>
                  <p>{report.message}</p>
                </div>

                {report.teacherResponse && (
                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                      Faculty Response:
                    </span>
                    <p>{report.teacherResponse}</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 pt-1">
                  Received on {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve / Respond Modal */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title="Resolve Question Inquiry"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitResolution} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Resolution Decision
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
              >
                <option value="resolved">Resolved (Accept / Clarify)</option>
                <option value="rejected">Rejected (Question verified correct)</option>
                <option value="pending">Pending Further Department Review</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Faculty Academic Feedback
              </label>
              <textarea
                rows={4}
                value={responseMsg}
                onChange={(e) => setResponseMsg(e.target.value)}
                placeholder="Explain the academic rationale or acknowledge the correction..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save & Publish Feedback'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
