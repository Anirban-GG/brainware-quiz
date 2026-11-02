import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FileQuestion, Clock, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export default function QuestionReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await studentService.getMyReports();
        if (res.success) {
          setReports(res.reports || []);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Question Remarks & Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Track issues reported on examination questions and view faculty responses.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
          <FileQuestion className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No Question Reports Filed
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            You can flag questionable items or typographical issues directly during exams or from scorecards.
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {report.quizId?.title || 'Examination Quiz'}
                    </span>
                    <Badge variant="default" size="xs">
                      {report.reason}
                    </Badge>
                  </div>

                  <Badge
                    variant={isResolved ? 'success' : isRejected ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {report.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-darkSurface-subtle/40 p-3 rounded-xl border border-slate-200/60 dark:border-darkSurface-border/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                    Your Concern:
                  </span>
                  <p className="whitespace-pre-wrap">{report.message}</p>
                </div>

                {report.teacherResponse && (
                  <div className="text-xs text-slate-700 dark:text-slate-200 bg-blue-50/60 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Faculty Feedback:</span>
                    </div>
                    <p className="whitespace-pre-wrap">{report.teacherResponse}</p>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Reported on {new Date(report.createdAt).toLocaleString()}</span>
                  {report.resolvedAt && (
                    <span>Resolved on {new Date(report.resolvedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
