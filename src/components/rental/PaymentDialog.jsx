import { useTranslation } from 'react-i18next';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { Money } from '../ui';
import { paymentMethodKey } from '../../constants/labels';
import { PAYMENT_METHODS } from '../../constants/rental';
import { isPaymentFormValid, paymentFormTotal } from '../../services/rental.service';
import { formatMoney } from '../../utils/format';

/**
 * Recording of money received on an invoice, spread over what it pays: the
 * rental and any of its fees. Each ticked element carries its own amount,
 * prefilled with what remains of it and never above that.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {Array<{value: string, label: string, balance: number}>} props.targets What can be
 *   paid: the rental, under RENTAL_PAYMENT_TARGET, and each fee with something left.
 * @param {{items: Object<string, {selected: boolean, amount: string}>, date: string, method: string,
 *   comment: string}} props.form Form state, items keyed by target value.
 * @param {(form: object) => void} props.onChange Called with the new state.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function PaymentDialog({ open, targets, form, onChange, onSubmit, onClose }) {
  const { t } = useTranslation();
  const setItem = (value, changes) =>
    onChange({ ...form, items: { ...form.items, [value]: { ...form.items[value], ...changes } } });

  return (
    <FormDialog
      open={open}
      title={t('rental.payments.newTitle')}
      submitLabel={t('common.actions.save')}
      submitDisabled={!isPaymentFormValid(form, targets)}
      onSubmit={onSubmit}
      onClose={onClose}
      maxWidth="sm"
    >
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('rental.payments.targetsHint')}</div>
      <div>
        {targets.map((target) => {
          const item = form.items[target.value];
          const amount = Number(item.amount);
          const tooMuch = item.selected && amount > target.balance;
          return (
            <div key={target.value} className="charge-row">
              <Checkbox
                checked={item.selected}
                onChange={(event) => setItem(target.value, { selected: event.target.checked })}
                inputProps={{ 'aria-label': target.label }}
                sx={{ p: 0.5 }}
              />
              <div className="payment-target">
                <div>
                  <div style={{ fontWeight: 600 }}>{target.label}</div>
                  <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {t('rental.payments.balanceHint', { amount: formatMoney(target.balance) })}
                  </div>
                </div>
                <TextField
                  label={t('rental.payments.amount')}
                  value={item.amount}
                  onChange={(event) => setItem(target.value, { amount: event.target.value })}
                  size="small"
                  type="number"
                  disabled={!item.selected}
                  inputProps={{ min: 1, max: target.balance, step: 1 }}
                  error={tooMuch}
                  helperText={tooMuch ? t('rental.payments.tooMuch') : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
        <span>{t('rental.payments.total')}</span>
        <Money value={paymentFormTotal(form)} />
      </div>
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
