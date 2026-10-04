import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Notice offering a new version of the application.
 *
 * The update is proposed, never applied on its own. Someone may be halfway
 * through entering contributions, and reloading under them would throw the
 * entry away.
 *
 * @returns {JSX.Element | null} The notice, or nothing when up to date.
 */
export default function UpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message={t('common.update.available')}
      action={
        <>
          <Button
            size="small"
            color="inherit"
            onClick={() => updateServiceWorker(true)}
          >
            {t('common.update.apply')}
          </Button>
          <Button size="small" color="inherit" onClick={() => setNeedRefresh(false)}>
            {t('common.update.later')}
          </Button>
        </>
      }
      sx={{ mb: 1 }}
    />
  );
}
