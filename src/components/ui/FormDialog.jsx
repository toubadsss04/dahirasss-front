import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import { extractErrorMessage } from '../../services/apiClient';

/**
 * Dialog wrapping a creation or edition form.
 *
 * Submission errors coming from the API are shown inside the dialog rather
 * than closing it, so a rejected entry is never silently lost. The message is
 * cleared each time the dialog opens, so a failure from an earlier attempt is
 * never shown against a fresh one.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {string} props.title Dialog title.
 * @param {React.ReactNode} props.children Form fields.
 * @param {string} [props.submitLabel] Label of the submitting button.
 * @param {boolean} [props.submitDisabled] Hold the submitting button back, for
 *   instance while a correction has not changed anything yet.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission. Resolving
 *   to false keeps the dialog open, for a submission that first needs another
 *   decision, such as a confirmation shown on top.
 * @param {() => void} props.onClose Called when the dialog is dismissed.
 * @param {'xs'|'sm'|'md'} [props.maxWidth] Dialog width.
 * @returns {JSX.Element} The dialog.
 */
export default function FormDialog({
  open,
  title,
  children,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onClose,
  maxWidth = 'xs',
}) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitDisabled) return;
    setIsBusy(true);
    setError('');
    try {
      const result = await onSubmit();
      if (result !== false) onClose();
    } catch (submitError) {
      setError(extractErrorMessage(submitError, 'errors.saveFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isBusy} color="inherit">
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isBusy || submitDisabled}
            startIcon={isBusy ? <CircularProgress size={15} color="inherit" /> : null}
          >
            {submitLabel ?? t('common.actions.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
