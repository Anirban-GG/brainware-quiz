import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/LoadingSkeleton';
import { ShieldX } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkSurface-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Validating academic credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change on first login or after admin reset
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-darkSurface-bg">
        <div className="max-w-md w-full text-center bg-white dark:bg-darkSurface-card p-8 rounded-2xl border border-slate-200 dark:border-darkSurface-border shadow-lg">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            403 - Access Forbidden
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Your account ({user.role}) is not authorized to access this academic partition.
          </p>
          <Link
            to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-bwu-700 hover:bg-bwu-800 rounded-xl transition-colors shadow-sm"
          >
            Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
