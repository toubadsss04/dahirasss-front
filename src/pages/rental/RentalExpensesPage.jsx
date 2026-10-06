import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Pencil, Plus, Undo2 } from 'lucide-react';

import AppSelect from '../../components/forms/AppSelect';
import Pager from '../../components/projects/Pager';
import ExpenseDialog from '../../components/rental/ExpenseDialog';
import PeriodFilter from '../../components/rental/PeriodFilter';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../../components/ui';
import { operationStatusKey, paymentMethodKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import { RENTAL_PAGE_SIZE } from '../../constants/rental';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import {
  cancelRentalExpense,
  createRentalExpense,
  emptyExpenseForm,
  expenseToForm,
  fetchRentalExpenseCategories,
  fetchRentalExpenses,
  toExpensePayload,
  updateRentalExpense,
} from '../../services/rental-cash.service';
import { currentMonthPeriod, isValidPeriod } from '../../services/rental.service';
import { formatDate, formatMoney } from '../../utils/format';

const STATUSES = ['ACTIVE', 'CANCELLED'];

/**
 * Money paid out by the rental business over a period, the current month by
 * default. Each expense lowers the balance; a cancelled one stays listed,
 * struck through, with its reason.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalExpensesPage() {
  const { t } = useTranslation();
  const { canCorrectRentalExpense, canWrite } = usePermissions();
  const [period, setPeriod] = useState(currentMonthPeriod);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState(null);
  const [toCancel, setToCancel] = useState(null);

  const categories = useQuery({
    queryKey: [KEYS.rentalExpenseCategories],
    queryFn: fetchRentalExpenseCategories,
  });
  const expenses = useQuery({
    queryKey: [KEYS.rentalExpenses, period.dateFrom, period.dateTo, categoryId, status, offset],
    queryFn: () =>
      fetchRentalExpenses({
        date_from: period.dateFrom,
        date_to: period.dateTo,
        category_id: categoryId || undefined,
        status: status || undefined,
        limit: RENTAL_PAGE_SIZE,
        offset,
      }),
    enabled: isValidPeriod(period),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useDomainMutation(
    'rentalCash',
    ({ id, payload }) => (id ? updateRentalExpense(id, payload) : createRentalExpense(payload)),
    { successMessage: form?.id ? t('rental.expenses.updated') : t('rental.expenses.created') },
  );
  const cancelMutation = useDomainMutation(
    'rentalCash',
    ({ id, reason }) => cancelRentalExpense(id, reason),
    { successMessage: t('rental.expenses.cancelled') },
  );

  const categoryList = categories.data ?? [];
  const activeCategories = categoryList.filter((category) => category.is_active);
  const rows = expenses.data?.items ?? [];
  const total = expenses.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('rental.expenses.title')}
        subtitle={t('rental.expenses.subtitle', { count: total })}
        actions={
          canWrite && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              disabled={activeCategories.length === 0}
              onClick={() => setForm(emptyExpenseForm(activeCategories[0]?.id ?? ''))}
            >
              {t('rental.expenses.new')}
            </Button>
          )
        }
      />

      <PeriodFilter
        dateFrom={period.dateFrom}
        dateTo={period.dateTo}
        onChange={(next) => {
          setPeriod(next);
          setOffset(0);
        }}
      />

      <FilterBar>
        <AppSelect
          label={t('rental.expenses.category')}
          value={categoryId}
          onChange={(value) => {
            setCategoryId(value);
            setOffset(0);
          }}
          options={categoryList.map((category) => ({ value: category.id, label: category.name }))}
          allowEmpty
          sx={{ minWidth: 180 }}
        />
        <AppSelect
          label={t('common.fields.status')}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={STATUSES.map((value) => ({ value, label: t(operationStatusKey(value)) }))}
          allowEmpty
          sx={{ minWidth: 150 }}
        />
      </FilterBar>

      {canWrite && categories.data && activeCategories.length === 0 && (
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>{t('rental.expenses.noCategory')}</p>
      )}

      {expenses.isLoading && <Loader />}
      {expenses.error && <ErrorNote message={extractErrorMessage(expenses.error)} />}

      {expenses.data && (
        <>
          <div className="card recap" style={{ marginBottom: 16 }}>
            <div className="r-row grand">
              <span className="l">{t('rental.expenses.activeTotal')}</span>
              <span className="money">{formatMoney(expenses.data.active_total)}</span>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'date', label: t('rental.expenses.date') },
              { key: 'description', label: t('rental.expenses.description') },
              { key: 'method', label: t('rental.expenses.method') },
              { key: 'amount', label: t('rental.expenses.amount'), align: 'right' },
              { key: 'actions', label: '', align: 'right' },
            ]}
            rows={rows}
            emptyMessage={t('rental.expenses.empty')}
            renderRow={(expense) => {
              const cancelled = expense.status === 'CANCELLED';
              const editable = !cancelled && canCorrectRentalExpense(expense);
              return (
                <tr key={expense.id}>
                  <td className="num">{formatDate(expense.expense_date)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{expense.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {expense.category_name}
                      {expense.created_by_name &&
                        ` · ${t('rental.expenses.author', { name: expense.created_by_name })}`}
                    </div>
                    {cancelled && (
                      <>
                        <StatusBadge label={t(operationStatusKey(expense.status))} tone="cancel" />
                        {expense.cancel_reason && (
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {t('common.cancelledWithReason', { reason: expense.cancel_reason })}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td>{t(paymentMethodKey(expense.method))}</td>
                  <td className="r">
                    <Money value={expense.amount} strike={cancelled} />
                  </td>
                  <td className="r" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                    {editable && (
                      <>
                        <Tooltip title={t('common.actions.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => setForm(expenseToForm(expense))}
                            aria-label={t('common.actions.edit')}
                          >
                            <Pencil size={15} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('rental.expenses.cancel')}>
                          <IconButton
                            size="small"
                            onClick={() => setToCancel(expense)}
                            aria-label={t('rental.expenses.cancel')}
                          >
                            <Undo2 size={15} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </td>
                </tr>
              );
            }}
          />
          <Pager total={total} offset={offset} limit={RENTAL_PAGE_SIZE} onChange={setOffset} />
        </>
      )}

      {form && (
        <ExpenseDialog
          open={Boolean(form)}
          form={form}
          categories={categoryList}
          onChange={setForm}
          onSubmit={() => saveMutation.mutateAsync({ id: form.id, payload: toExpensePayload(form) })}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('rental.expenses.cancelTitle')}
        description={t('rental.expenses.cancelDescription')}
        confirmLabel={t('rental.expenses.cancel')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync({ id: toCancel.id, reason })}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
