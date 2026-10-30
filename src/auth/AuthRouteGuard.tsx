import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../api/tokenStore';
import { useEmr } from '../context/EmrContext';
import { roleHomeRoute } from './roles';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/patient/login',
  '/patient/register',
  '/logout',
]);

export function AuthRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role, isRoleLoading, mustChangePassword } = useEmr();
  const isAuthenticated = Boolean(getSession()?.token);
  const passwordChangeRequired = mustChangePassword
    || getSession()?.mustChangePassword === true;

  if (location.pathname === '/logout') return children;

  if (!isAuthenticated && !PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isAuthenticated && passwordChangeRequired && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (location.pathname === '/change-password') {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (passwordChangeRequired) return children;
    if (isRoleLoading) {
      return (
        <div className="min-h-screen grid place-items-center text-sm text-slate-600" role="status">
          Checking your account…
        </div>
      );
    }
    if (!role) return <Navigate to="/login" replace />;

    return (
      <Navigate
        to={`/app?tab=${encodeURIComponent(roleHomeRoute[role])}`}
        replace
      />
    );
  }

  return children;
}
