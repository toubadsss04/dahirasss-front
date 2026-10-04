import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAVIGATION } from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { usePermissions } from '../../hooks/usePermissions';
import { useScrollToTopOnNavigation } from '../../hooks/useScrollToTopOnNavigation';
import { useUiStore } from '../../store/uiStore';
import LanguageSwitcher from './LanguageSwitcher';
import MembershipPrompt from './MembershipPrompt';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Resolve the title key of the page from the current path.
 *
 * @param {string} pathname The active path.
 * @returns {string} The translation key of the matching navigation entry.
 */
function resolveTitleKey(pathname) {
  const items = NAVIGATION.flatMap((section) => section.items);
  const exact = items.find((item) => item.to === pathname);
  if (exact) return exact.labelKey;

  const nested = items
    .filter((item) => item.to !== ROUTES.dashboard && pathname.startsWith(item.to))
    .sort((left, right) => right.to.length - left.to.length)[0];
  return nested?.labelKey ?? 'nav.dashboard';
}

/**
 * Application frame: navigation rail, top bar and routed content.
 *
 * @returns {JSX.Element} The shell.
 */
export default function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const { canChooseLanguage, canSeeDahira } = usePermissions();
  const showExercise = canSeeDahira && !location.pathname.startsWith(ROUTES.rental);
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  useScrollToTopOnNavigation();

  return (
    <div className={isSidebarOpen ? 'app open' : 'app'}>
      <Sidebar />
      <div
        className="scrim"
        onClick={closeSidebar}
        onKeyDown={(event) => event.key === 'Escape' && closeSidebar()}
        role="presentation"
      />
      <div className="main">
        <Topbar title={t(resolveTitleKey(location.pathname))} showExercise={showExercise} />
        <main className="content">
          <MembershipPrompt />
          <Outlet />
        </main>
      </div>
      {canChooseLanguage && <LanguageSwitcher />}
    </div>
  );
}
