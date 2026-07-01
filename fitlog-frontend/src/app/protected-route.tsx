import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentAccount } from '@/modules/auth/hooks/use-auth';

export function ProtectedRoute() {
  const { isAuthenticated } = useCurrentAccount();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
