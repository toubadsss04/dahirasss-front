import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import FormDialog from '../ui/FormDialog';
import {
  effectiveDays,
  isReturnValid,
  stillOutAfter,
  toDakarDateTimeInput,
} from '../../services/rental.service';

/**
 * One go of material coming back: when it really came back, and for each
 * line still partly out how many units came back usable, damaged or lost.
 * Whatever is not declared stays with the customer and can be recorded in a
 * later go.
 *
 * At the first go only, the per-day lines are billed on a number of days,
 * which defaults to the days really spent out, counted in started 24 hours
 * from the check-out. Another figure, for a delay caused by the team rather
 * than the customer, needs a reason.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {Array<{lineId: string, name: string, quantity: number, already: number, outstanding: number,
 *   returned: string, damaged: string, lost: string}>} props.rows One row per line still partly out.
 * @param {(rows: Array<object>) => void} props.onRowsChange Called with the new rows.
 * @param {{comment: string, team: string, returnedAt: string, billedDays: string, billedDaysReason: string}} props.values
 *   The rest of the dialog.
 * @param {(values: object) => void} props.onValuesChange Called with the new values.
 * @param {string|null} props.checkedOutAt When the material left, as returned by the API.
 * @param {boolean} props.hasDailyLines Whether some per-day lines are still to be priced, which
 *   only holds at the first go of an order not yet invoiced.
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
      submitLabel={t('rental.orders.actions.saveReturn')}
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
      {rows.map((row, index) => {
        const left = stillOutAfter(row);
        return (
          <div key={row.lineId} style={{ display: 'grid', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{row.name}</div>
              <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('rental.orders.returnProgress', {
                  out: row.quantity,
                  back: row.already,
                  left: row.outstanding,
                })}
              </div>
            </div>
            <div className="return-grid">
              {[
                ['returned', t('rental.orders.returnReturned')],
                ['damaged', t('rental.orders.returnDamaged')],
                ['lost', t('rental.orders.returnLost')],
              ].map(([field, label]) => (
                <TextField
                  key={field}
                  label={label}
                  value={row[field]}
                  onChange={(event) => update(index, field, event.target.value)}
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: row.outstanding, step: 1 }}
                />
              ))}
            </div>
            <div
              className="num"
              role="status"
              style={{ fontSize: 12, color: left < 0 ? 'var(--neg)' : 'var(--muted)' }}
            >
              {left < 0
                ? t('rental.orders.returnTooMany', { count: row.outstanding })
                : t('rental.orders.returnStillOut', { count: left })}
            </div>
          </div>
        );
      })}
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
