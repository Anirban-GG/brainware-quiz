import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  Users,
  UserCheck,
  BookOpen,
  Award,
  Video,
  ShieldAlert,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  XCircle,
  Building
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const passFailData = charts.passFail || [];
  const courseData = charts.courseDistribution || [];
  const cheatingData = charts.cheatingDistribution || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Brainware University Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            System Operations & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Institutional oversight of students, faculty, examinations, security breaches, and audit compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md" className="font-bold">
            ADMIN ROOT ACCESS
          </Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Students"
          value={loading ? '...' : stats.totalStudents || 0}
          icon={Users}
          color="blue"
          subtitle="Enrolled candidates"
        />
        <StatCard
          title="Faculty Instructors"
          value={loading ? '...' : stats.totalTeachers || 0}
          icon={UserCheck}
          color="purple"
          subtitle="Authorized examiners"
        />
        <StatCard
          title="Total Quizzes"
          value={loading ? '...' : stats.totalQuizzes || 0}
          icon={BookOpen}
          color="green"
          subtitle={`${stats.totalQuestions || 0} Questions`}
        />
        <StatCard
          title="Total Attempts"
          value={loading ? '...' : stats.totalAttempts || 0}
          icon={Award}
          color="amber"
          subtitle={`${stats.completedExams || 0} Completed`}
        />
        <StatCard
          title="Active Exams"
          value={loading ? '...' : stats.activeExams || 0}
          icon={Video}
          color="red"
          subtitle={`${stats.terminatedExams || 0} Terminated`}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass / Fail Donut */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Overall Pass / Fail Ratio
          </h3>
          <p className="text-[11px] text-slate-500">
            Outcome across all evaluated university examinations
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            {loading ? (
              <LoadingSkeleton count={1} height="h-48" />
            ) : passFailData.length === 0 || (passFailData[0].value === 0 && passFailData[1].value === 0) ? (
              <p className="text-xs text-slate-400">No completed attempt records yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Student Enrollment by Course */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Student Distribution by Programme
          </h3>
          <p className="text-[11px] text-slate-500">
            Registered candidates categorized by academic degree
          </p>

          <div className="h-56 w-full pt-2">
            {loading ? (
              <LoadingSkeleton count={1} height="h-48" />
            ) : courseData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-16">No student records.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#b91c1c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cheating Event Breakdown */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Suspicious Incident Breakdown
          </h3>
          <p className="text-[11px] text-slate-500">
            Anti-cheating detection distribution
          </p>

          <div className="h-56 w-full pt-2">
            {loading ? (
              <LoadingSkeleton count={1} height="h-48" />
            ) : cheatingData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-16">No cheating incidents recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cheatingData} layout="vertical" margin={{ top: 5, right: 15, left: 30, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D97706" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
