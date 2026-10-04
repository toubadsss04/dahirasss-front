import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';

/**
 * Gate for authenticated areas.
 *
 * While the session is being restored from the stored refresh token, a
 * spinner is shown rather than bouncing the user to the sign-in screen and
 * back, which would flash on every reload.
 *
 * @param {object} props Component props.
 * @param {string[]} [props.roles] Roles allowed through, all when omitted.
 * @returns {JSX.Element} The gated outlet.
 */
export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const user = useAuthStore((state) => state.user);

  if (isBootstrapping) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={26} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
