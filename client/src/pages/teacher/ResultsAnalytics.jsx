import React, { useEffect, useState } from 'react';
import { teacherService } from '../../services/teacherService';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  BarChart3,
  Award,
  TrendingUp,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

export default function ResultsAnalytics() {
  const [data, setData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, [selectedQuizId]);

  const fetchResults = async () => {
    try {
      const res = await teacherService.getResults(selectedQuizId);
      if (res.success) {
        setData(res);
        if (res.quizzes) setQuizzes(res.quizzes);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const attempts = data?.attempts || [];

  const filteredAttempts = attempts.filter(att => {
    const q = search.toLowerCase();
    return att.studentName.toLowerCase().includes(q) ||
           att.studentCode?.toLowerCase().includes(q) ||
           att.quizTitle?.toLowerCase().includes(q);
  });

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Results & Academic Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate cohort performance, verify passing metrics, and inspect suspicious incidents.
          </p>
        </div>

        <select
          value={selectedQuizId}
          onChange={(e) => setSelectedQuizId(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">All Examinations</option>
          {quizzes.map(q => (
            <option key={q._id} value={q._id}>{q.title}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={loading ? '...' : summary.totalAttempts || 0}
          icon={Award}
          color="blue"
          subtitle="Submitted evaluations"
        />
        <StatCard
          title="Average Score"
          value={loading ? '...' : `${summary.averageScore || 0}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Cohort mean performance"
        />
        <StatCard
          title="Pass Percentage"
          value={loading ? '...' : `${summary.passPercentage || 0}%`}
          icon={BarChart3}
          color="purple"
          subtitle="Met minimum threshold"
        />
        <StatCard
          title="Score Range"
          value={loading ? '...' : `${summary.lowestScore || 0}% - ${summary.highestScore || 0}%`}
          icon={ArrowUpDown}
          color="amber"
          subtitle="Min vs Max recorded"
        />
      </div>

      {/* Submissions Table with Search */}
      <div className="bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200/90 dark:border-darkSurface-border overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Student Attempt Records
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or code..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} height="h-16" />
        ) : filteredAttempts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No student attempt records match your query.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student Code</th>
                  <th className="px-4 py-3">Examination</th>
                  <th className="px-4 py-3">Score & %</th>
                  <th className="px-4 py-3">Result Status</th>
                  <th className="px-4 py-3">Suspicious Events</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filteredAttempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {att.studentName}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {att.studentCode}
                    </td>
                    <td className="px-4 py-3">
                      {att.quizTitle}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{att.score}</span>
                      <span className="text-slate-400"> / {att.totalMarks}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">{att.percentage}%</span>
                    </td>
                    <td className="px-4 py-3">
                      {att.status === 'terminated' ? (
                        <Badge variant="danger" size="xs">
                          Terminated
                        </Badge>
                      ) : (
                        <Badge variant={att.isPassed ? 'success' : 'danger'} size="xs">
                          {att.isPassed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {att.suspiciousEventsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {att.suspiciousEventsCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDuration(att.timeTaken)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(att.date).toLocaleDateString()}
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
