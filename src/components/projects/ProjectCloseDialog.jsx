import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';

/** Shortest closing reason accepted, matching the confirmation dialogs. */
const MIN_REASON_LENGTH = 5;

/**
 * Closing of a project, with its reason and final amount.
 *
 * The amount starts at what has been collected, which is the usual answer,
 * and stays editable for a project settled for a different figure.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {string} props.projectName Name of the project being closed.
 * @param {number} props.collected Amount collected so far.
 * @param {(payload: {reason: string, closed_amount: number}) => Promise<void>} props.onSubmit
 *   Called with the closing payload.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ProjectCloseDialog({
  open,
  projectName,
  collected,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setAmount(String(collected ?? 0));
    }
  }, [open, collected]);

  const isValid = reason.trim().length >= MIN_REASON_LENGTH && amount !== '';

  return (
    <FormDialog
      open={open}
      title={t('projects.close.title', { name: projectName })}
      submitLabel={t('projects.close.confirm')}
      submitDisabled={!isValid}
      onSubmit={() =>
        onSubmit({ reason: reason.trim(), closed_amount: Math.round(Number(amount)) })
      }
      onClose={onClose}
    >
      <TextField
        label={t('projects.close.amount')}
        value={amount}
        onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
        helperText={t('projects.close.amountHint')}
        size="small"
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        required
      />
      <TextField
        label={t('common.fields.reason')}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        helperText={t('validation.reasonTooShort', { min: MIN_REASON_LENGTH })}
        size="small"
        multiline
        minRows={2}
        autoFocus
        required
      />
    </FormDialog>
  );
}
