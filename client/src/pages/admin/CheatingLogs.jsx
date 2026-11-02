import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ShieldAlert, AlertTriangle, Search, Filter, ShieldCheck } from 'lucide-react';

export default function CheatingLogs() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, typeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (typeFilter !== 'all') params.eventType = typeFilter;
      const res = await adminService.getCheatingLogs(params);
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load cheating logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const studentName = e.studentId ? `${e.studentId.firstName} ${e.studentId.lastName}`.toLowerCase() : '';
    const studentCode = e.studentId?.studentCode?.toLowerCase() || '';
    const quizTitle = e.quizId?.title?.toLowerCase() || '';
    return studentName.includes(q) || studentCode.includes(q) || quizTitle.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Anti-Cheating Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browser focus loss, tab switching, and clipboard violation logs captured during examination sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="TAB_SWITCH">TAB_SWITCH</option>
            <option value="WINDOW_BLUR">WINDOW_BLUR</option>
            <option value="COPY_ATTEMPT">COPY_ATTEMPT</option>
            <option value="PASTE_ATTEMPT">PASTE_ATTEMPT</option>
            <option value="FULLSCREEN_EXIT">FULLSCREEN_EXIT</option>
            <option value="RIGHT_CLICK">RIGHT_CLICK</option>
            <option value="TEACHER_WARNING">TEACHER_WARNING</option>
            <option value="EXAM_TERMINATED">EXAM_TERMINATED</option>
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
            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p>No suspicious event logs match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Examination</th>
                  <th className="px-6 py-4">Breach Event Type</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Incident Log Description</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.studentId ? `${log.studentId.firstName} ${log.studentId.lastName}` : 'Candidate'}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {log.studentId?.studentCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.quizId?.title || 'Examination'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={log.severity === 'high' ? 'danger' : log.severity === 'medium' ? 'warning' : 'default'}
                        size="xs"
                      >
                        {log.severity?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
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
