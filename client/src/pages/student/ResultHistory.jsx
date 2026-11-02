import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { History, Award, Clock, ArrowRight, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function ResultHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await studentService.getResults();
        if (res.success) {
          setResults(res.results || []);
        }
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Examination History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your performance scores, pass/fail status, and detailed answer breakdowns.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : results.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border">
          <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No examination history found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            You have not attempted or submitted any examinations yet.
          </p>
          <Link
            to="/student/quizzes"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-bwu-700 shadow-sm"
          >
            <span>Explore Available Quizzes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Examination</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Score & %</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time Taken</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.quizTitle}
                      </div>
                      {r.suspiciousEventsCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{r.suspiciousEventsCount} Suspicious Events</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="primary" size="xs">
                        {r.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.score}
                      </span>
                      <span className="text-slate-400"> / {r.totalMarks}</span>
                      <span className="text-[11px] text-slate-500 block font-sans">
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'terminated' ? (
                        <Badge variant="danger" size="xs">
                          Terminated
                        </Badge>
                      ) : (
                        <Badge variant={r.isPassed ? 'success' : 'danger'} size="xs">
                          {r.isPassed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDuration(r.timeTaken)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/student/results/${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-bwu-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <span>View Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
