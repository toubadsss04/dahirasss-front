import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { stockMovementKey } from '../../constants/labels';
import { CORRECTION_MOVEMENT, MANUAL_MOVEMENTS } from '../../constants/rental';

/**
 * Recording of a stock movement typed by hand: an entry, a correction, a
 * breakage, a repair. Only a correction accepts a negative quantity.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {string} props.articleName Name of the article moved.
 * @param {{type: string, quantity: string, date: string, reason: string}} props.form Form state.
 * @param {(form: object) => void} props.onChange Called with the new state.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function StockMovementDialog({
  open,
  articleName,
  form,
  onChange,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const quantity = Number(form.quantity);
  const allowsNegative = form.type === CORRECTION_MOVEMENT;
  const isValid =
    Number.isInteger(quantity) && quantity !== 0 && (allowsNegative || quantity > 0);

  return (
    <FormDialog
      open={open}
      title={t('rental.stock.movementTitle', { name: articleName })}
      submitLabel={t('common.actions.save')}
      submitDisabled={!isValid}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <AppSelect
        label={t('rental.stock.type')}
        value={form.type}
        onChange={(value) => onChange({ ...form, type: value })}
        options={MANUAL_MOVEMENTS.map((type) => ({ value: type, label: t(stockMovementKey(type)) }))}
        fullWidth
      />
      <TextField
        label={t('rental.stock.quantity')}
        value={form.quantity}
        onChange={(event) => onChange({ ...form, quantity: event.target.value })}
        size="small"
        type="number"
        inputProps={{ step: 1 }}
        helperText={allowsNegative ? t('rental.stock.correctionHint') : undefined}
        required
      />
      <TextField
        label={t('rental.stock.date')}
        value={form.date}
        onChange={(event) => onChange({ ...form, date: event.target.value })}
        size="small"
        type="date"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={t('common.fields.reason')}
        value={form.reason}
        onChange={(event) => onChange({ ...form, reason: event.target.value })}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
