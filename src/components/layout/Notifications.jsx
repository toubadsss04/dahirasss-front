import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { useNotificationStore } from '../../store/notificationStore';

/**
 * Confirmation notices shown after an operation.
 *
 * One at a time, oldest first. Placed at the bottom on a phone, where the
 * thumb is, and away from the top bar where the exercise selector sits.
 *
 * @returns {JSX.Element | null} The current notice, or nothing when idle.
 */
export default function Notifications() {
  const queue = useNotificationStore((state) => state.queue);
  const dismiss = useNotificationStore((state) => state.dismiss);
  const duration = useNotificationStore((state) => state.displayDuration);

  const current = queue[0];
  if (!current) return null;

  return (
    <Snackbar
      key={current.id}
      open
      autoHideDuration={duration}
      onClose={(_, reason) => {
        // Clicking elsewhere should not wipe a confirmation the person has
        // not read yet.
        if (reason !== 'clickaway') dismiss(current.id);
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 'env(safe-area-inset-bottom)' }}
    >
      <Alert
        severity={current.severity}
        variant="filled"
        onClose={() => dismiss(current.id)}
        sx={{ width: '100%', maxWidth: 460 }}
      >
        {current.message}
      </Alert>
    </Snackbar>
  );
}
