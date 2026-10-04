import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';
import { isReturnValid } from '../../services/rental.service';

/**
 * Return of an order: every line comes back whole unless damaged or lost
 * units are stated on it.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {Array<{lineId: string, name: string, quantity: number, damaged: string, lost: string}>} props.rows
 *   One row per order line.
 * @param {(rows: Array<object>) => void} props.onRowsChange Called with the new rows.
 * @param {string} props.comment Free comment.
 * @param {(comment: string) => void} props.onCommentChange Called with the new comment.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ReturnDialog({
  open,
  rows,
  onRowsChange,
  comment,
  onCommentChange,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const update = (index, field, value) =>
    onRowsChange(rows.map((row, position) => (position === index ? { ...row, [field]: value } : row)));

  return (
    <FormDialog
      open={open}
      title={t('rental.orders.returnTitle')}
      submitLabel={t('rental.orders.actions.return')}
      submitDisabled={!isReturnValid(rows)}
      onSubmit={onSubmit}
      onClose={onClose}
      maxWidth="sm"
    >
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('rental.orders.returnHint')}</div>
      {rows.map((row, index) => (
        <div key={row.lineId} style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>
            {row.name} · {t('rental.orders.returnOut', { count: row.quantity })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <TextField
              label={t('rental.orders.returnDamaged')}
              value={row.damaged}
              onChange={(event) => update(index, 'damaged', event.target.value)}
              size="small"
              type="number"
              inputProps={{ min: 0, max: row.quantity, step: 1 }}
            />
            <TextField
              label={t('rental.orders.returnLost')}
              value={row.lost}
              onChange={(event) => update(index, 'lost', event.target.value)}
              size="small"
              type="number"
              inputProps={{ min: 0, max: row.quantity, step: 1 }}
            />
          </div>
        </div>
      ))}
      <TextField
        label={t('rental.orders.returnComment')}
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
