import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'red', subtitle, trend }) {
  const colorStyles = {
    red: 'bg-red-500/10 text-bwu-700 dark:text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  };

  return (
    <div className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {value}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.red}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-darkSurface-border text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
