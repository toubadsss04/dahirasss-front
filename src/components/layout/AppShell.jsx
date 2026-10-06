import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAVIGATION } from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { usePermissions } from '../../hooks/usePermissions';
import { useScrollToTopOnNavigation } from '../../hooks/useScrollToTopOnNavigation';
import { useUiStore } from '../../store/uiStore';
import { playOpeningSoundIfNeeded } from '../../utils/soundService';
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
 * The opening chime owed by a sign-in is played here, once, whatever home
 * page the role lands on: the Dahira dashboard, the rental dashboard or a
 * member's own space. The sign-in screen leaves word and this reads it once,
 * so later visits stay silent.
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

  useEffect(() => {
    playOpeningSoundIfNeeded();
  }, []);

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
