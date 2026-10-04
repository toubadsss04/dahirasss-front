import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { extractErrorMessage } from '../../services/apiClient';

/** Shortest reason the audit trail accepts, matching the API. */
const MIN_REASON_LENGTH = 5;

/**
 * Confirmation dialog for sensitive operations.
 *
 * Section 40 of the specification requires a confirmation before closing or
 * reopening an exercise, cancelling an operation, or deactivating a record.
 * When a reason is required the dialog will not submit without one, which is
 * what keeps the audit trail meaningful.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {string} props.title Dialog title.
 * @param {React.ReactNode} props.description What is about to happen.
 * @param {string} [props.confirmLabel] Label of the confirming button.
 * @param {boolean} [props.requireReason] Demand a written reason.
 * @param {string} [props.reasonLabel] Label of the reason field.
 * @param {boolean} [props.danger] Render the action in the destructive tone.
 * @param {(reason: string) => Promise<void>} props.onConfirm Called on confirmation.
 * @param {() => void} props.onClose Called when the dialog is dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  requireReason = false,
  reasonLabel,
  danger = false,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
      setIsBusy(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (requireReason && reason.trim().length < MIN_REASON_LENGTH) {
      setError(t('validation.reasonTooShort', { min: MIN_REASON_LENGTH }));
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (confirmError) {
      // The reason sent by the API, not the transport error, which would read
      // as an unhelpful status code.
      setError(extractErrorMessage(confirmError, 'errors.operationFailed'));
      setIsBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, mb: requireReason ? 2 : 0 }}>
          {description}
        </DialogContentText>
        {requireReason && (
          <TextField
            label={reasonLabel ?? t('common.fields.reason')}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            autoFocus
            disabled={isBusy}
          />
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isBusy} color="inherit">
          {t('common.actions.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={danger ? 'error' : 'primary'}
          disabled={isBusy}
          // Without a field to focus, the button that opened the dialog would
          // keep the focus while the page behind is hidden from assistive
          // technology, which the browser rejects.
          autoFocus={!requireReason}
          startIcon={isBusy ? <CircularProgress size={15} color="inherit" /> : null}
        >
          {confirmLabel ?? t('common.actions.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
