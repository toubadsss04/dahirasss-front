import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import { Menu, Moon, Sun } from 'lucide-react';

import { useUiStore } from '../../store/uiStore';
import ExerciseSelector from './ExerciseSelector';

/**
 * Top bar carrying the page title, the exercise selector and the theme toggle.
 *
 * @param {object} props Component props.
 * @param {string} props.title Current page name.
 * @param {boolean} [props.showExercise] Show the exercise selector, which only the Dahira pages use.
 * @returns {JSX.Element} The top bar.
 */
export default function Topbar({ title, showExercise = true }) {
  const { t } = useTranslation();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const themeMode = useUiStore((state) => state.themeMode);
  const resolvedTheme = useUiStore((state) => state.resolvedTheme);

  const isDark = resolvedTheme(themeMode) === 'dark';

  return (
    <header className="topbar">
      <button type="button" className="burger" onClick={toggleSidebar} aria-label={t('common.menu')}>
        <Menu size={19} />
      </button>

      <div className="crumb">
        <b>{title}</b>
      </div>

      <div className="spacer" />

      {showExercise && <ExerciseSelector />}

      <Tooltip title={isDark ? t('common.theme.light') : t('common.theme.dark')}>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? t('common.theme.light') : t('common.theme.dark')}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </Tooltip>
    </header>
  );
}
