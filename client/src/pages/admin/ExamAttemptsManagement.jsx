import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { Award, Search, ShieldAlert, Clock } from 'lucide-react';

export default function ExamAttemptsManagement() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAttempts();
  }, [statusFilter]);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminService.getAllAttempts(params);
      if (res.success) {
        setAttempts(res.attempts || []);
      }
    } catch (err) {
      console.error('Failed to load attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts.filter(att => {
    const q = search.toLowerCase();
    const student = att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}`.toLowerCase() : '';
    const code = att.studentId?.studentCode?.toLowerCase() || '';
    const quiz = att.quizId?.title?.toLowerCase() || '';
    return student.includes(q) || code.includes(q) || quiz.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Examination Attempts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete institutional archive of in-progress, submitted, and terminated examination sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or quiz..."
              className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="in-progress">In-Progress</option>
            <option value="submitted">Submitted</option>
            <option value="terminated">Terminated</option>
          </select>
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
            No examination attempt records match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Examination</th>
                  <th className="px-6 py-4">Score & %</th>
                  <th className="px-6 py-4">Attempt Status</th>
                  <th className="px-6 py-4">Suspicious Events</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Candidate'}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {att.studentId?.studentCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {att.quizId?.title}
                      </div>
                      <span className="text-[10px] text-slate-400">{att.quizId?.category}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{att.score}</span>
                      <span className="text-slate-400"> / {att.totalMarksPossible || att.quizId?.totalMarks}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">{att.percentage}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          att.status === 'submitted'
                            ? 'success'
                            : att.status === 'terminated'
                            ? 'danger'
                            : 'warning'
                        }
                        size="xs"
                      >
                        {att.status?.toUpperCase()}
                      </Badge>
                      {att.terminationReason && (
                        <span className="text-[10px] text-rose-500 block truncate max-w-xs">
                          {att.terminationReason}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {att.suspiciousEventsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {att.suspiciousEventsCount}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {att.timeTaken ? `${Math.floor(att.timeTaken / 60)}m ${att.timeTaken % 60}s` : 'Active'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(att.startedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
