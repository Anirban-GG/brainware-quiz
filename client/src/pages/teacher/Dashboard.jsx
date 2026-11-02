import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Video,
  ShieldAlert,
  FileQuestion,
  Plus,
  ArrowRight,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await teacherService.getDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const chartData = data?.charts?.scoreBuckets || [];
  const recentAttempts = data?.recentAttempts || [];

  return (
    <div className="space-y-6">
      {/* Faculty Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-bwu-700 dark:text-red-400 uppercase tracking-wider">
            Faculty Control Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Examinations & Assessment Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor active sessions, manage question repositories, and evaluate student cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/teacher/monitoring"
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 inline-flex items-center gap-2 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <Video className="w-3.5 h-3.5" />
            <span>Live Invigilation ({stats.activeExams || 0})</span>
          </Link>

          <Link
            to="/teacher/quizzes/new"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Quizzes"
          value={loading ? '...' : stats.totalQuizzes || 0}
          icon={BookOpen}
          color="blue"
          subtitle={`${stats.publishedQuizzes || 0} Published • ${stats.draftQuizzes || 0} Draft`}
        />
        <StatCard
          title="Active Exams"
          value={loading ? '...' : stats.activeExams || 0}
          icon={Video}
          color="red"
          subtitle="Students currently taking exams"
        />
        <StatCard
          title="Total Submissions"
          value={loading ? '...' : stats.totalAttempts || 0}
          icon={Award}
          color="green"
          subtitle={`Pass Rate: ${stats.passPercentage || 0}%`}
        />
        <StatCard
          title="Suspicious Events"
          value={loading ? '...' : stats.suspiciousAttempts || 0}
          icon={ShieldAlert}
          color="amber"
          subtitle={`${stats.pendingReports || 0} Question Remarks Pending`}
        />
      </div>

      {/* Analytics Charts & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Score Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-bwu-700 dark:text-red-500" />
                <span>Cohort Score Distribution</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregated percentages across completed examinations
              </p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle text-slate-700 dark:text-slate-300">
              Avg Score: {stats.averageScore || 0}%
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {loading ? (
              <LoadingSkeleton count={1} height="h-56" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attempt data available to render distribution chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171A21',
                      borderColor: '#2A2F3D',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index > 2 ? '#10B981' : index === 2 ? '#F59E0B' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Attempts Feed */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Submissions
            </h2>
            <Link
              to="/teacher/results"
              className="text-xs font-semibold text-bwu-700 dark:text-red-400 hover:underline"
            >
              All Results
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={4} height="h-14" />
          ) : recentAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No recent examination submissions recorded.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-darkSurface-border">
              {recentAttempts.map((att) => (
                <div key={att._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {att.studentName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">
                      {att.studentCode} • {att.quizTitle}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                      {att.score} pts ({att.percentage}%)
                    </span>
                    <Badge variant={att.status === 'terminated' ? 'danger' : 'success'} size="xs">
                      {att.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
