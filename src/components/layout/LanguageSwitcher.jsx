import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import { Globe } from 'lucide-react';

import { LOCALES, LOCALE_NAMES, currentLocale, setLocale } from '../../i18n';

/**
 * Switch between the languages the interface speaks.
 *
 * Two languages need no menu: one tap swaps them, and the button names the
 * other language rather than the current one, so it reads as a destination.
 *
 * It floats over the corner of the content instead of sitting in the top bar,
 * which was getting crowded. That corner follows the reading direction, so it
 * stays over the content and never lands on the navigation rail.
 *
 * @returns {JSX.Element} The switch.
 */
export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const active = currentLocale();
  const next = active === LOCALES.FR ? LOCALES.AR : LOCALES.FR;

  return (
    <Tooltip title={LOCALE_NAMES[next]} placement="left">
      <button
        type="button"
        className="lang-fab"
        onClick={() => setLocale(next)}
        aria-label={`${t('common.language.switch')} : ${LOCALE_NAMES[next]}`}
      >
        <Globe size={20} />
      </button>
    </Tooltip>
  );
}
