import { Navigate } from 'react-router-dom';

import { ROUTES } from '../constants/routes';
import { usePermissions } from '../hooks/usePermissions';
import DashboardPage from '../pages/DashboardPage';

/**
 * The home page of each role.
 *
 * The Dahira dashboard reads the exercises, which a rental manager cannot
 * reach, so that role lands on the rental dashboard instead. A member lands
 * on their own space.
 *
 * @returns {JSX.Element} The home page.
 */
export default function HomeRoute() {
  const { canSeeDahira, canSeeRental } = usePermissions();
  if (canSeeDahira) return <DashboardPage />;
  if (canSeeRental) return <Navigate to={ROUTES.rental} replace />;
  return <Navigate to={ROUTES.memberSpace} replace />;
}
