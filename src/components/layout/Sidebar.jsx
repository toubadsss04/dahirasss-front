import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import { LogOut } from 'lucide-react';

import logo from '../../assets/logo.png';
import { NAVIGATION } from '../../constants/navigation';
import { roleKey } from '../../constants/labels';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { initials } from '../../utils/format';

/**
 * Navigation rail.
 *
 * The brand block carries the logo alone: it already spells out the name of
 * the daara, so no wordmark is added beside it. Items are filtered by role,
 * which mirrors rather than replaces the checks enforced by the API.
 *
 * @returns {JSX.Element} The sidebar.
 */
export default function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  const isVisible = (item) => !item.roles || item.roles.includes(user?.role);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="plaque">
          <img src={logo} alt={t('common.logoAlt')} />
        </div>
      </div>

      <nav className="nav">
        {NAVIGATION.map((section) => {
          const items = section.items.filter(isVisible);
          if (items.length === 0) return null;

          return (
            <div key={section.group ?? 'root'}>
              {section.group && <div className="nav-group">{t(section.group)}</div>}
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeSidebar}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                  >
                    <Icon />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="side-foot">
        <div className="avatar">{initials(user?.full_name)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="who">{user?.full_name}</div>
          <div className="role">{user?.role ? t(roleKey(user.role)) : ''}</div>
        </div>
        <Tooltip title={t('common.signOut')}>
          <button
            type="button"
            onClick={signOut}
            aria-label={t('common.signOut')}
            style={{
              background: 'rgba(255,255,255,.08)',
              border: 'none',
              borderRadius: 9,
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--sidebar-text)',
              flex: '0 0 auto',
            }}
          >
            <LogOut size={16} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
