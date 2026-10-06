import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';
import { toDakarDateTimeInput } from '../../services/rental.service';

/**
 * Hand-over of an order's material: when it really left, now by default, and
 * the team delivering it if known.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {(values: {team: string, checkedOutAt: string}) => Promise<unknown>} props.onSubmit
 *   Called with the team, possibly blank, and the moment as a datetime-local value.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function CheckOutDialog({ open, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [team, setTeam] = useState('');
  const [checkedOutAt, setCheckedOutAt] = useState('');

  useEffect(() => {
    if (open) {
      setTeam('');
      setCheckedOutAt(toDakarDateTimeInput());
    }
  }, [open]);

  return (
    <FormDialog
      open={open}
      title={t('rental.orders.checkOutTitle')}
      submitLabel={t('common.actions.confirm')}
      submitDisabled={!checkedOutAt}
      onSubmit={() => onSubmit({ team, checkedOutAt })}
      onClose={onClose}
      maxWidth="sm"
    >
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('rental.orders.checkOutDescription')}</div>
      <TextField
        label={t('rental.orders.checkedOutAt')}
        type="datetime-local"
        value={checkedOutAt}
        onChange={(event) => setCheckedOutAt(event.target.value)}
        size="small"
        InputLabelProps={{ shrink: true }}
        inputProps={{ max: toDakarDateTimeInput() }}
        helperText={t('rental.orders.checkedOutAtHint')}
        required
      />
      <TextField
        label={t('rental.orders.teamOut')}
        helperText={t('rental.orders.teamOutHint')}
        value={team}
        onChange={(event) => setTeam(event.target.value)}
        size="small"
        multiline
        minRows={2}
        inputProps={{ maxLength: 500 }}
      />
    </FormDialog>
  );
}
