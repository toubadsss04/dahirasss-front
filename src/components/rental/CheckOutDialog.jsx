import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';

/**
 * Hand-over of an order's material, with the team delivering it if known.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {(team: string) => Promise<unknown>} props.onSubmit Called with the team, possibly blank.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function CheckOutDialog({ open, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [team, setTeam] = useState('');

  useEffect(() => {
    if (open) setTeam('');
  }, [open]);

  return (
    <FormDialog
      open={open}
      title={t('rental.orders.checkOutTitle')}
      submitLabel={t('common.actions.confirm')}
      onSubmit={() => onSubmit(team)}
      onClose={onClose}
      maxWidth="sm"
    >
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('rental.orders.checkOutDescription')}</div>
      <TextField
        label={t('rental.orders.teamOut')}
        helperText={t('rental.orders.teamOutHint')}
        value={team}
        onChange={(event) => setTeam(event.target.value)}
        size="small"
        multiline
        minRows={2}
        autoFocus
        inputProps={{ maxLength: 500 }}
      />
    </FormDialog>
  );
}
