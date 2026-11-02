import React, { useState } from 'react';
import Badge from '../../components/Badge';
import { Sliders, Shield, Building, Database, Server, CheckCircle2 } from 'lucide-react';

export default function SystemSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    institutionName: 'Brainware University',
    institutionCode: 'BWU',
    systemTitle: 'Online Quiz Examination & Monitoring System',
    defaultGraceSeconds: 10,
    enforceFullscreen: true,
    maxCheatingAlertsBeforeFlag: 3
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          System & Examination Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure institutional parameters, examination security thresholds, and system governance.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System configuration successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* University Identity */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-bwu-700 dark:text-red-400">
            <Building className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Institutional Identity Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                University Name
              </label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Institution Code
              </label>
              <input
                type="text"
                value={settings.institutionCode}
                onChange={(e) => setSettings({ ...settings, institutionCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Portal Subtitle / System Tagline
            </label>
            <input
              type="text"
              value={settings.systemTitle}
              onChange={(e) => setSettings({ ...settings, systemTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
              required
            />
          </div>
        </div>

        {/* Security & Integrity Settings */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-bwu-700 dark:text-red-400">
            <Shield className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Examination Integrity & Timing Controls
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Server-Enforced Timer Grace Period
                </span>
                <span className="text-[11px] text-slate-500">
                  Buffer time (in seconds) allowed for high-latency network packet auto-saves before locking attempt
                </span>
              </div>
              <input
                type="number"
                value={settings.defaultGraceSeconds}
                onChange={(e) => setSettings({ ...settings, defaultGraceSeconds: Number(e.target.value) })}
                className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-center"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Suspicious Event Flagging Threshold
                </span>
                <span className="text-[11px] text-slate-500">
                  Number of browser focus / tab loss events before candidate status escalates to Suspicious
                </span>
              </div>
              <input
                type="number"
                value={settings.maxCheatingAlertsBeforeFlag}
                onChange={(e) => setSettings({ ...settings, maxCheatingAlertsBeforeFlag: Number(e.target.value) })}
                className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-center"
              />
            </div>
          </div>
        </div>

        {/* System Health Info */}
        <div className="bg-white dark:bg-darkSurface-card p-6 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
            System Infrastructure Health
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle flex items-center justify-between">
              <span className="text-slate-500">Database</span>
              <Badge variant="success" size="xs">ONLINE (MongoDB)</Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle flex items-center justify-between">
              <span className="text-slate-500">WebSockets</span>
              <Badge variant="success" size="xs">ACTIVE (Socket.IO)</Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle flex items-center justify-between">
              <span className="text-slate-500">Auth Engine</span>
              <Badge variant="purple" size="xs">JWT + BCRYPT</Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20"
          >
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
