import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';
import { effectiveDays, isReturnValid, toDakarDateTimeInput } from '../../services/rental.service';

/**
 * Return of an order: when the material really came back, how many days the
 * per-day lines are billed on, and the state of each line, which comes back
 * whole unless damaged or lost units are stated on it.
 *
 * The billed days default to the days really spent out, counted in started
 * 24 hours from the check-out. Another figure, for a delay caused by the
 * team rather than the customer, needs a reason.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {Array<{lineId: string, name: string, quantity: number, damaged: string, lost: string}>} props.rows
 *   One row per article line.
 * @param {(rows: Array<object>) => void} props.onRowsChange Called with the new rows.
 * @param {{comment: string, team: string, returnedAt: string, billedDays: string, billedDaysReason: string}} props.values
 *   The rest of the dialog.
 * @param {(values: object) => void} props.onValuesChange Called with the new values.
 * @param {string|null} props.checkedOutAt When the material left, as returned by the API.
 * @param {boolean} props.hasDailyLines Whether some lines are priced per day.
 * @param {number} props.plannedDays Days of the planned period.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ReturnDialog({
  open,
  rows,
  onRowsChange,
  values,
  onValuesChange,
  checkedOutAt,
  hasDailyLines,
  plannedDays,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const update = (index, field, value) =>
    onRowsChange(rows.map((row, position) => (position === index ? { ...row, [field]: value } : row)));
  const set = (field) => (event) => onValuesChange({ ...values, [field]: event.target.value });

  const outInput = checkedOutAt ? toDakarDateTimeInput(checkedOutAt) : '';
  const realDays = effectiveDays(outInput, values.returnedAt);
  const billed = values.billedDays === '' ? realDays : Number(values.billedDays);
  const billedValid = values.billedDays === '' || (Number.isInteger(billed) && billed > 0);
  const needsReason = hasDailyLines && values.billedDays !== '' && billed !== realDays;
  const reasonValid = !needsReason || values.billedDaysReason.trim().length >= 3;
  const momentValid = Boolean(values.returnedAt) && (!outInput || values.returnedAt >= outInput);

  return (
    <FormDialog
      open={open}
      title={t('rental.orders.returnTitle')}
      submitLabel={t('rental.orders.actions.return')}
      submitDisabled={!isReturnValid(rows) || !momentValid || !billedValid || !reasonValid}
      onSubmit={onSubmit}
      onClose={onClose}
      maxWidth="sm"
    >
      <TextField
        label={t('rental.orders.returnedAt')}
        type="datetime-local"
        value={values.returnedAt}
        onChange={set('returnedAt')}
        size="small"
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: outInput || undefined, max: toDakarDateTimeInput() }}
        error={Boolean(values.returnedAt) && !momentValid}
        helperText={
          Boolean(values.returnedAt) && !momentValid
            ? t('rental.orders.returnedBeforeOut')
            : t('rental.orders.returnedAtHint')
        }
        required
      />

      {hasDailyLines && (
        <div className="card" style={{ padding: 12, display: 'grid', gap: 10, boxShadow: 'none' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {t('rental.orders.daysSummary', { planned: plannedDays, real: realDays })}
          </div>
          <TextField
            label={t('rental.orders.billedDaysField')}
            value={values.billedDays}
            onChange={set('billedDays')}
            size="small"
            type="number"
            placeholder={String(realDays || '')}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 1, step: 1 }}
            error={!billedValid}
            helperText={t('rental.orders.billedDaysHint')}
          />
          {needsReason && (
            <TextField
              label={t('rental.orders.billedDaysReason')}
              value={values.billedDaysReason}
              onChange={set('billedDaysReason')}
              size="small"
              multiline
              minRows={2}
              required
              error={!reasonValid}
              inputProps={{ maxLength: 500 }}
            />
          )}
        </div>
      )}

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
        label={t('rental.orders.teamBack')}
        helperText={t('rental.orders.teamBackHint')}
        value={values.team}
        onChange={set('team')}
        size="small"
        multiline
        minRows={2}
        inputProps={{ maxLength: 500 }}
      />
      <TextField
        label={t('rental.orders.returnComment')}
        value={values.comment}
        onChange={set('comment')}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
