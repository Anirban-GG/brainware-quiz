import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ClipboardList, Search, User, ShieldCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await adminService.getAuditLogs();
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const action = l.action.toLowerCase();
    const user = l.userId ? `${l.userId.firstName} ${l.userId.lastName}`.toLowerCase() : '';
    return action.includes(q) || user.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident logs of administrative actions, faculty interventions, password resets, and terminations.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or user..."
            className="pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-slate-900 dark:text-white focus:outline-none"
          />
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
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-darkSurface-subtle/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-darkSurface-border">
                <tr>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">System Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Metadata</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkSurface-border">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-darkSurface-subtle/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'}
                      {log.userId?.studentCode && (
                        <span className="text-[10px] font-mono text-slate-500 block">{log.userId.studentCode}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={log.role === 'admin' ? 'purple' : log.role === 'teacher' ? 'info' : 'default'} size="xs">
                        {log.role?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {log.targetType || 'Global'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
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
