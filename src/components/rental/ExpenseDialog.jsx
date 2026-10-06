import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { paymentMethodKey } from '../../constants/labels';
import { PAYMENT_METHODS } from '../../constants/rental';
import { isExpenseFormValid } from '../../services/rental-cash.service';

/**
 * Recording or correction of a rental expense.
 *
 * An inactive category stays offered to the expense already filed under it,
 * so correcting the amount never forces a new category.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {object} props.form Form state, see emptyExpenseForm.
 * @param {Array<{id: string, name: string, is_active: boolean}>} props.categories Expense categories.
 * @param {(form: object) => void} props.onChange Called with the new state.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ExpenseDialog({ open, form, categories, onChange, onSubmit, onClose }) {
  const { t } = useTranslation();
  const options = categories
    .filter((category) => category.is_active || category.id === form.categoryId)
    .map((category) => ({ value: category.id, label: category.name }));

  return (
    <FormDialog
      open={open}
      title={form.id ? t('rental.expenses.editTitle') : t('rental.expenses.newTitle')}
      submitLabel={t('common.actions.save')}
      submitDisabled={!isExpenseFormValid(form)}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <AppSelect
        label={t('rental.expenses.category')}
        value={form.categoryId}
        onChange={(value) => onChange({ ...form, categoryId: value })}
        options={options}
        fullWidth
      />
      <TextField
        label={t('rental.expenses.amount')}
        value={form.amount}
        onChange={(event) => onChange({ ...form, amount: event.target.value })}
        size="small"
        type="number"
        inputProps={{ min: 1, step: 1 }}
        required
        autoFocus
      />
      <TextField
        label={t('rental.expenses.date')}
        value={form.date}
        onChange={(event) => onChange({ ...form, date: event.target.value })}
        size="small"
        type="date"
        InputLabelProps={{ shrink: true }}
        required
      />
      <AppSelect
        label={t('rental.expenses.method')}
        value={form.method}
        onChange={(value) => onChange({ ...form, method: value })}
        options={PAYMENT_METHODS.map((method) => ({
          value: method,
          label: t(paymentMethodKey(method)),
        }))}
        fullWidth
      />
      <TextField
        label={t('rental.expenses.description')}
        value={form.description}
        onChange={(event) => onChange({ ...form, description: event.target.value })}
        size="small"
        multiline
        minRows={2}
        required
        inputProps={{ maxLength: 500 }}
      />
    </FormDialog>
  );
}
