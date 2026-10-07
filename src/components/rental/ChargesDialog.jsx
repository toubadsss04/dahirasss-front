import { useTranslation } from 'react-i18next';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { Money } from '../ui';
import { chargeKindKey } from '../../constants/labels';
import { CHARGE_KINDS } from '../../constants/rental';
import { chargeRowAmount, isChargeRowValid } from '../../services/rental.service';

/**
 * Fees to bill on top of an order, for lateness, damage, loss or anything else.
 *
 * After a return it lists the fees the application proposes, each ticked
 * when a figure could be proposed; the person keeps, changes or unticks
 * each one, or bills nothing at all. Opened from the order, it holds one fee
 * typed by hand, whose kind can be chosen.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {'proposals'|'manual'} props.mode Proposals after a return, or one fee typed by hand.
 * @param {Array<object>} props.rows Fee rows, as built by proposalsToRows or emptyChargeRow.
 * @param {(rows: Array<object>) => void} props.onRowsChange Called with the new rows.
 * @param {string} props.chargeDate Day the fees are dated.
 * @param {(value: string) => void} props.onChargeDateChange Called with the new day.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed, billing nothing.
 * @returns {JSX.Element} The dialog.
 */
export default function ChargesDialog({
  open,
  mode,
  rows,
  onRowsChange,
  chargeDate,
  onChargeDateChange,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const isManual = mode === 'manual';
  const selected = rows.filter((row) => row.selected);
  const total = selected.reduce((sum, row) => sum + chargeRowAmount(row), 0);
  const isValid = selected.length > 0 && selected.every(isChargeRowValid) && Boolean(chargeDate);
  const update = (index, field, value) =>
    onRowsChange(rows.map((row, position) => (position === index ? { ...row, [field]: value } : row)));

  return (
    <FormDialog
      open={open}
      title={isManual ? t('rental.charges.newTitle') : t('rental.charges.proposalsTitle')}
      submitLabel={isManual ? t('rental.charges.add') : t('rental.charges.billSelection')}
      cancelLabel={isManual ? undefined : t('rental.charges.billNothing')}
      submitDisabled={!isValid}
      onSubmit={onSubmit}
      onClose={onClose}
      maxWidth="sm"
    >
      {!isManual && (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('rental.charges.proposalsHint')}</div>
      )}
      <div>
        {rows.map((row, index) => (
          <div key={row.key} className={isManual ? undefined : 'charge-row'}>
            {!isManual && (
              <Checkbox
                checked={row.selected}
                onChange={(event) => update(index, 'selected', event.target.checked)}
                inputProps={{ 'aria-label': row.label }}
                sx={{ p: 0.5 }}
              />
            )}
            <div style={{ display: 'grid', gap: 10 }}>
              {isManual ? (
                <AppSelect
                  label={t('rental.charges.kind')}
                  value={row.kind}
                  onChange={(value) => update(index, 'kind', value)}
                  options={CHARGE_KINDS.map((kind) => ({ value: kind, label: t(chargeKindKey(kind)) }))}
                  fullWidth
                />
              ) : (
                <span className="chip" style={{ justifySelf: 'start' }}>
                  {t(chargeKindKey(row.kind))}
                </span>
              )}
              <div className="charge-fields">
                <TextField
                  label={t('rental.charges.label')}
                  value={row.label}
                  onChange={(event) => update(index, 'label', event.target.value)}
                  size="small"
                  disabled={!row.selected}
                  inputProps={{ maxLength: 200 }}
                  required
                />
                <TextField
                  label={t('rental.charges.quantity')}
                  value={row.quantity}
                  onChange={(event) => update(index, 'quantity', event.target.value)}
                  size="small"
                  type="number"
                  disabled={!row.selected}
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label={t('rental.charges.unitAmount')}
                  value={row.unitAmount}
                  onChange={(event) => update(index, 'unitAmount', event.target.value)}
                  size="small"
                  type="number"
                  disabled={!row.selected}
                  inputProps={{ min: 1, step: 1 }}
                  error={row.selected && row.unitAmount === ''}
                  helperText={
                    row.selected && row.unitAmount === '' ? t('rental.charges.amountMissing') : undefined
                  }
                />
              </div>
              {row.selected && chargeRowAmount(row) > 0 && (
                <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t('rental.charges.lineAmount')} <Money value={chargeRowAmount(row)} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <TextField
        label={t('rental.charges.date')}
        type="date"
        value={chargeDate}
        onChange={(event) => onChargeDateChange(event.target.value)}
        size="small"
        InputLabelProps={{ shrink: true }}
        required
      />
      <div className="r-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
        <span>{t('rental.charges.total')}</span>
        <Money value={total} />
      </div>
    </FormDialog>
  );
}
