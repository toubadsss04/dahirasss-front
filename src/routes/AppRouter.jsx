import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from '../components/layout/AppShell';
import { DAHIRA_ROLES, RENTAL_ROLES, RENTAL_WRITE_ROLES, ROLES } from '../constants/navigation';
import { ROUTES } from '../constants/routes';
import AuditLogPage from '../pages/AuditLogPage';
import DaarasPage from '../pages/DaarasPage';
import DonationsPage from '../pages/DonationsPage';
import ExercisesPage from '../pages/ExercisesPage';
import ExpensesPage from '../pages/ExpensesPage';
import FinancialJournalPage from '../pages/FinancialJournalPage';
import FinancialStatementPage from '../pages/FinancialStatementPage';
import MeetingDetailPage from '../pages/MeetingDetailPage';
import MeetingsPage from '../pages/MeetingsPage';
import MemberDetailPage from '../pages/MemberDetailPage';
import MemberSpacePage from '../pages/MemberSpacePage';
import MembersPage from '../pages/MembersPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import ProjectsPage from '../pages/ProjectsPage';
import UsersPage from '../pages/UsersPage';
import LoginPage from '../pages/auth/LoginPage';
import RentalArticleDetailPage from '../pages/rental/RentalArticleDetailPage';
import RentalArticlesPage from '../pages/rental/RentalArticlesPage';
import RentalDashboardPage from '../pages/rental/RentalDashboardPage';
import RentalExpensesPage from '../pages/rental/RentalExpensesPage';
import RentalInvoiceDetailPage from '../pages/rental/RentalInvoiceDetailPage';
import RentalInvoicesPage from '../pages/rental/RentalInvoicesPage';
import RentalOrderDetailPage from '../pages/rental/RentalOrderDetailPage';
import RentalOrderFormPage from '../pages/rental/RentalOrderFormPage';
import RentalOrdersPage from '../pages/rental/RentalOrdersPage';
import RentalPeriodsPage from '../pages/rental/RentalPeriodsPage';
import RentalSettingsPage from '../pages/rental/RentalSettingsPage';
import RentalStatementPage from '../pages/rental/RentalStatementPage';
import HomeRoute from './HomeRoute';
import ProtectedRoute from './ProtectedRoute';

/**
 * Application routes.
 *
 * Each area is opened to the roles the API opens it to: the Dahira to the
 * section managers, the rental business to the rental managers, both to the
 * super administrator and, for reading only, to the supervisor. A member's
 * own space opens to any account linked to a member. Role restrictions here mirror the API and only shape
 * the interface. The
 * backend remains the authority, so hiding a route is never the security
 * mechanism.
 *
 * @returns {JSX.Element} The route tree.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.dashboard} element={<HomeRoute />} />
          <Route path={ROUTES.memberSpace} element={<MemberSpacePage />} />

          <Route element={<ProtectedRoute roles={DAHIRA_ROLES} />}>
            <Route path={ROUTES.members} element={<MembersPage />} />
            <Route path={ROUTES.memberDetail} element={<MemberDetailPage />} />
            <Route path={ROUTES.entities} element={<DaarasPage />} />
            <Route path={ROUTES.meetings} element={<MeetingsPage />} />
            <Route path={ROUTES.meetingDetail} element={<MeetingDetailPage />} />
            {/* Contributions were shown on their own entry, on the very screen
                the meetings already are. The entry is gone; the address stays
                and leads there, so a link kept open still lands somewhere. */}
            <Route
              path={ROUTES.contributions}
              element={<Navigate to={ROUTES.meetings} replace />}
            />
            <Route path={ROUTES.expenses} element={<ExpensesPage />} />
            <Route path={ROUTES.donations} element={<DonationsPage />} />
            <Route path={ROUTES.exercises} element={<ExercisesPage />} />
            <Route path={ROUTES.financialStatement} element={<FinancialStatementPage />} />
            <Route path={ROUTES.financialJournal} element={<FinancialJournalPage />} />
            <Route path={ROUTES.projects} element={<ProjectsPage />} />
            <Route path={ROUTES.projectDetail} element={<ProjectDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={RENTAL_ROLES} />}>
            <Route path={ROUTES.rental} element={<RentalDashboardPage />} />
            <Route path={ROUTES.rentalStatement} element={<RentalStatementPage />} />
            <Route path={ROUTES.rentalExpenses} element={<RentalExpensesPage />} />
            <Route path={ROUTES.rentalPeriods} element={<RentalPeriodsPage />} />
            <Route path={ROUTES.rentalArticles} element={<RentalArticlesPage />} />
            <Route path={ROUTES.rentalArticleDetail} element={<RentalArticleDetailPage />} />
            <Route path={ROUTES.rentalSettings} element={<RentalSettingsPage />} />
            <Route path={ROUTES.rentalOrders} element={<RentalOrdersPage />} />
            <Route element={<ProtectedRoute roles={RENTAL_WRITE_ROLES} />}>
              <Route path={ROUTES.rentalOrderNew} element={<RentalOrderFormPage />} />
              <Route path={ROUTES.rentalOrderEdit} element={<RentalOrderFormPage />} />
            </Route>
            <Route path={ROUTES.rentalOrderDetail} element={<RentalOrderDetailPage />} />
            <Route path={ROUTES.rentalInvoices} element={<RentalInvoicesPage />} />
            <Route path={ROUTES.rentalInvoiceDetail} element={<RentalInvoiceDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.SUPER_ADMIN]} />}>
            <Route path={ROUTES.users} element={<UsersPage />} />
            <Route path={ROUTES.auditLog} element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
