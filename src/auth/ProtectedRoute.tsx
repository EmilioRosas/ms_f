import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, expired } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    sessionStorage.setItem('auth.returnTo', location.pathname);
    return <Navigate to={`/login?reason=${expired ? 'expired' : 'required'}`} replace />;
  }
  return <Outlet />;
}
