import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        isDark
          ? 'bg-darkSurface-card border-darkSurface-border text-yellow-400 hover:bg-darkSurface-cardHover'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
      } ${className}`}
      aria-label="Toggle visual theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span>☀ Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-600" />
          <span>🌙 Dark</span>
        </>
      )}
    </button>
  );
}
