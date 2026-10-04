import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Ban, Pencil, Plus } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import PotLabel from '../components/ui/PotLabel';
import {
  Callout,
  DataTable,
  EmptyState,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { GAMOU_POT, POT_FILTERS } from '../constants/finance';
import { operationStatusKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { usePotOptions } from '../hooks/usePotOptions';
import { extractErrorMessage } from '../services/apiClient';
import {
  cancelExpense,
  createExpense,
  fetchExpenseCategories,
  fetchExpenses,
  filterByPot,
  isExpenseFormValid,
  potFields,
  potFilterParams,
  toExpenseForm,
  toExpenseUpdate,
  updateExpense,
} from '../services/finance.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatDate, todayInDakar } from '../utils/format';
import { amountValue } from '../utils/formChanges';

/**
 * Expenses of the selected exercise.
 *
 * An expense is paid from a pot: the Gamou of the exercise, or a project. A
 * project tied to this Gamou counts in the exercise too; a project standing
 * apart only lowers its own balance, and its expenses are found under the
 * "outside the Gamou" filter. The pot is chosen once: a wrong one is cancelled
 * and recorded again.
 *
 * Every account records expenses. Each person corrects those they recorded,
 * the super administrator any of them, and only the super administrator
 * cancels one.
 *
 * @returns {JSX.Element} The screen.
 */
export default function ExpensesPage() {
  const { t } = useTranslation();
  const { canCorrectGamouExpense, canCancelGamouExpense } = usePermissions();
  const selected = useExerciseStore((state) => state.selected());
  const exerciseId = selected?.id;

  const [potFilter, setPotFilter] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [toCancel, setToCancel] = useState(null);
  const [editing, setEditing] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    pot: GAMOU_POT,
    category_id: '',
    amount: '',
    expense_date: todayInDakar(),
    description: '',
  });

  const potOptions = usePotOptions(exerciseId, isFormOpen);
  const categories = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => fetchExpenseCategories(true),
  });
  const expenses = useQuery({
    queryKey: ['expenses', exerciseId, potFilter === POT_FILTERS.APART],
    queryFn: () => fetchExpenses({ ...potFilterParams(potFilter, exerciseId), limit: 200 }),
    enabled: Boolean(exerciseId),
  });

  const createMutation = useDomainMutation('expense', createExpense, {
    successMessage: t('expenses.created'),
  });
  const cancelMutation = useDomainMutation(
    'expense',
    ({ id, reason }) => cancelExpense(id, reason),
    { successMessage: t('expenses.cancelled') },
  );
  const updateMutation = useDomainMutation(
    'expense',
    ({ id, payload }) => updateExpense(id, payload),
    { successMessage: t('expenses.updated') },
  );

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('expenses.title')} />
        <div className="card">
          <EmptyState message={t('expenses.noExercise')} />
        </div>
      </>
    );
  }

  if (expenses.isLoading) return <Loader />;
  if (expenses.error) return <ErrorNote message={extractErrorMessage(expenses.error)} />;

  const rows = filterByPot(expenses.data.items, potFilter);
  const activeCategoryOptions = (categories.data ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const isEditedCategoryListed = activeCategoryOptions.some(
    (option) => option.value === editing?.category_id,
  );
  const categoryOptions =
    editing && !isEditedCategoryListed
      ? [
          { value: editing.category_id, label: editing.category_name },
          ...activeCategoryOptions,
        ]
      : activeCategoryOptions;

  const openForm = () => {
    setEditing(null);
    setInitialForm(null);
    setForm({
      pot: GAMOU_POT,
      category_id: activeCategoryOptions[0]?.value ?? '',
      amount: '',
      expense_date: todayInDakar(),
      description: '',
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    const initial = toExpenseForm(row);
    setEditing(row);
    setInitialForm(initial);
    setForm(initial);
    setFormOpen(true);
  };

  const isFormValid = isExpenseFormValid(form);
  const expenseUpdate = editing ? toExpenseUpdate(initialForm, form) : {};
  const canSubmit = editing
    ? isFormValid && Object.keys(expenseUpdate).length > 0
    : isFormValid;

  const submitForm = () =>
    editing
      ? updateMutation.mutateAsync({ id: editing.id, payload: expenseUpdate })
      : createMutation.mutateAsync({
          ...potFields(form.pot, exerciseId),
          category_id: form.category_id,
          amount: amountValue(form.amount),
          expense_date: form.expense_date,
          description: form.description.trim(),
        });

  return (
    <>
      <PageHeader
        title={t('expenses.title')}
        subtitle={`${t('expenses.subtitle')} · ${selected.name}`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openForm}>
            {t('expenses.add')}
          </Button>
        }
      />

      <Callout>
        <Trans i18nKey="expenses.notice" components={{ b: <b /> }} />
      </Callout>

      <FilterBar>
        <AppSelect
          value={potFilter}
          onChange={setPotFilter}
          options={[
            { value: POT_FILTERS.GAMOU, label: t('pots.filters.gamou') },
            { value: POT_FILTERS.PROJECTS, label: t('pots.filters.projects') },
            { value: POT_FILTERS.APART, label: t('pots.filters.apart') },
          ]}
          allowEmpty
          placeholder={t('pots.filters.all')}
          sx={{ minWidth: 200 }}
        />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'date', label: t('expenses.columns.date') },
          { key: 'category', label: t('expenses.columns.category') },
          { key: 'description', label: t('expenses.columns.description') },
          { key: 'scope', label: t('expenses.columns.scope') },
          { key: 'status', label: t('expenses.columns.status') },
          { key: 'amount', label: t('expenses.columns.amount'), align: 'right' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={rows}
        emptyMessage={t('expenses.empty')}
        renderRow={(row) => {
          const cancelled = row.status === 'CANCELLED';
          const canCorrect = canCorrectGamouExpense(row);
          const canCancel = canCancelGamouExpense;
          return (
            <tr key={row.id}>
              <td className="num">{formatDate(row.expense_date)}</td>
              <td>
                <span className="chip">{row.category_name}</span>
              </td>
              <td>
                <div>{row.description}</div>
                {row.created_by_name && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {t('common.recordedBy', { name: row.created_by_name })}
                  </div>
                )}
              </td>
              <td>
                <PotLabel operation={row} />
              </td>
              <td>
                <StatusBadge
                  label={t(operationStatusKey(row.status))}
                  tone={cancelled ? 'cancel' : 'open'}
                />
              </td>
              <td className="r">
                <Money value={row.amount} strike={cancelled} />
              </td>
              <td className="r" style={{ width: '1%' }}>
                {!cancelled && (canCorrect || canCancel) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 4,
                    }}
                  >
                    {canCorrect && (
                      <Tooltip title={t('common.actions.edit')}>
                        <IconButton
                          size="small"
                          aria-label={t('common.actions.edit')}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canCancel && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Ban size={14} />}
                        onClick={() => setToCancel(row)}
                      >
                        {t('common.actions.cancel')}
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );
        }}
      />

      <FormDialog
        open={isFormOpen}
        title={editing ? t('expenses.form.editTitle') : t('expenses.form.title')}
        submitLabel={editing ? t('common.actions.edit') : t('common.actions.save')}
        submitDisabled={!canSubmit}
        onClose={() => setFormOpen(false)}
        onSubmit={submitForm}
      >
        {editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <PotLabel operation={editing} />
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {t('pots.locked')}
            </span>
          </div>
        )}
        {!editing && (
          <AppSelect
            label={t('pots.field')}
            value={form.pot}
            onChange={(value) => setForm({ ...form, pot: value })}
            options={potOptions}
            fullWidth
          />
        )}
        <AppSelect
          label={t('expenses.form.category')}
          value={form.category_id}
          onChange={(value) => setForm({ ...form, category_id: value })}
          options={categoryOptions}
          fullWidth
        />
        <TextField
          label={t('common.fields.amount')}
          value={form.amount}
          onChange={(event) =>
            setForm({ ...form, amount: event.target.value.replace(/[^0-9]/g, '') })
          }
          size="small"
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          required
        />
        <TextField
          label={t('common.fields.date')}
          type="date"
          value={form.expense_date}
          onChange={(event) => setForm({ ...form, expense_date: event.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label={t('common.fields.description')}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          size="small"
          required
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('expenses.confirmCancel.title')}
        description={t('expenses.confirmCancel.body', { description: toCancel?.description })}
        confirmLabel={t('expenses.confirmCancel.confirm')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync({ id: toCancel.id, reason })}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
