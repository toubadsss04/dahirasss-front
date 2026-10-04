import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { paymentMethodKey } from '../../constants/labels';
import { PAYMENT_METHODS } from '../../constants/rental';
import { formatMoney } from '../../utils/format';

/**
 * Recording of a payment towards an invoice, never beyond what remains due.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {number} props.balance What the invoice still awaits.
 * @param {{amount: string, date: string, method: string, comment: string}} props.form Form state.
 * @param {(form: object) => void} props.onChange Called with the new state.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function PaymentDialog({ open, balance, form, onChange, onSubmit, onClose }) {
  const { t } = useTranslation();
  const amount = Number(form.amount);
  const isValid = Number.isInteger(amount) && amount > 0 && amount <= balance;

  return (
    <FormDialog
      open={open}
      title={t('rental.payments.newTitle')}
      submitLabel={t('common.actions.save')}
      submitDisabled={!isValid}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <TextField
        label={t('rental.payments.amount')}
        value={form.amount}
        onChange={(event) => onChange({ ...form, amount: event.target.value })}
        size="small"
        type="number"
        inputProps={{ min: 1, max: balance, step: 1 }}
        helperText={t('rental.payments.balanceHint', { amount: formatMoney(balance) })}
        required
        autoFocus
      />
      <TextField
        label={t('rental.payments.date')}
        value={form.date}
        onChange={(event) => onChange({ ...form, date: event.target.value })}
        size="small"
        type="date"
        InputLabelProps={{ shrink: true }}
      />
      <AppSelect
        label={t('rental.payments.method')}
        value={form.method}
        onChange={(value) => onChange({ ...form, method: value })}
        options={PAYMENT_METHODS.map((method) => ({
          value: method,
          label: t(paymentMethodKey(method)),
        }))}
        fullWidth
      />
      <TextField
        label={t('rental.payments.comment')}
        value={form.comment}
        onChange={(event) => onChange({ ...form, comment: event.target.value })}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
