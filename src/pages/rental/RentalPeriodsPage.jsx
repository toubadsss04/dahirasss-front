import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Lock, LockOpen, Pencil } from 'lucide-react';

import AppSelect from '../../components/forms/AppSelect';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormDialog from '../../components/ui/FormDialog';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../../components/ui';
import { KEYS } from '../../constants/queryKeys';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import {
  closeRentalPeriod,
  fetchRentalPeriods,
  rentalPeriodsOfYear,
  rentalPeriodYears,
  reopenRentalPeriod,
  setRentalOpeningBalance,
} from '../../services/rental-cash.service';
import { requiredText } from '../../utils/formChanges';
import { formatDate, formatMonth } from '../../utils/format';

/**
 * The months of the rental cash book, latest first.
 *
 * Each month opens on the previous month's closing balance. The super
 * administrator closes months in order, which freezes their figures and
 * refuses any entry dated within them, reopens the latest closed one to
 * correct it, and may type the opening balance of an open month by hand.
 *
 * The table shows one calendar year at a time, the latest by default. The
 * months to close or reopen are found across the whole history, so their
 * buttons only appear when their year is on screen.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalPeriodsPage() {
  const { t } = useTranslation();
  const { canManageRentalPeriods } = usePermissions();
  const [toClose, setToClose] = useState(null);
  const [toReopen, setToReopen] = useState(null);
  const [opening, setOpening] = useState(null);
  const [yearFilter, setYearFilter] = useState(null);

  const periods = useQuery({ queryKey: [KEYS.rentalPeriods], queryFn: fetchRentalPeriods });

  const closeMutation = useDomainMutation('rentalCash', (month) => closeRentalPeriod(month), {
    successMessage: t('rental.periods.closed'),
  });
  const reopenMutation = useDomainMutation(
    'rentalCash',
    ({ month, reason }) => reopenRentalPeriod(month, reason),
    { successMessage: t('rental.periods.reopened') },
  );
  const openingMutation = useDomainMutation(
    'rentalCash',
    ({ month, payload }) => setRentalOpeningBalance(month, payload),
    { successMessage: t('rental.periods.openingSaved') },
  );

  const rows = periods.data ?? [];
  const latestClosed = rows.find((row) => row.status === 'CLOSED')?.month;
  const oldestOpen = [...rows].reverse().find((row) => row.status === 'OPEN')?.month;
  const yearOptions = rentalPeriodYears(rows);
  const year = yearOptions.includes(yearFilter) ? yearFilter : (yearOptions[0] ?? null);
  const yearRows = year === null ? rows : rentalPeriodsOfYear(rows, year);
  const openingAmount = opening ? Number(opening.amount) : 0;
  const openingValid =
    opening !== null &&
    requiredText(opening.reason).length >= 3 &&
    (opening.amount === '' || Number.isInteger(openingAmount));

  return (
    <>
      <PageHeader title={t('rental.periods.title')} subtitle={t('rental.periods.subtitle')} />

      {!canManageRentalPeriods && (
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>{t('rental.periods.adminOnly')}</p>
      )}

      {yearOptions.length > 0 && (
        <FilterBar>
          <AppSelect
            label={t('rental.periods.year')}
            value={String(year)}
            onChange={(value) => setYearFilter(Number(value))}
            options={yearOptions.map((value) => ({ value: String(value), label: String(value) }))}
            sx={{ minWidth: 120 }}
          />
        </FilterBar>
      )}

      {periods.isLoading && <Loader />}
      {periods.error && <ErrorNote message={extractErrorMessage(periods.error)} />}

      {periods.data && (
        <DataTable
          columns={[
            { key: 'month', label: t('rental.periods.month') },
            { key: 'opening', label: t('rental.periods.opening'), align: 'right' },
            { key: 'income', label: t('rental.periods.income'), align: 'right' },
            { key: 'expenses', label: t('rental.periods.expenses'), align: 'right' },
            { key: 'closing', label: t('rental.periods.closing'), align: 'right' },
            { key: 'actions', label: '', align: 'right' },
          ]}
          rows={yearRows}
          renderRow={(row) => {
            const closed = row.status === 'CLOSED';
            return (
              <tr key={row.month}>
                <td>
                  <div style={{ fontWeight: 600 }}>{formatMonth(row.month)}</div>
                  <StatusBadge
                    label={t(`rental.periods.status.${row.status}`)}
                    tone={closed ? 'closed' : 'open'}
                  />
                  {closed && row.closed_at && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {t('rental.periods.closedBy', {
                        date: formatDate(row.closed_at),
                        name: row.closed_by_name ?? '—',
                      })}
                    </div>
                  )}
                </td>
                <td className="r">
                  <Money value={row.opening_balance} />
                  {row.opening_override && (
                    <Tooltip title={row.override_reason ?? ''}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t('rental.periods.openingManual')}
                      </div>
                    </Tooltip>
                  )}
                </td>
                <td className="r">
                  <Money value={row.income} />
                </td>
                <td className="r">
                  <Money value={-row.expenses} />
                </td>
                <td className="r">
                  <Money value={row.closing_balance} />
                </td>
                <td className="r" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                  {canManageRentalPeriods && !closed && (
                    <Tooltip title={t('rental.periods.editOpening')}>
                      <IconButton
                        size="small"
                        aria-label={t('rental.periods.editOpening')}
                        onClick={() =>
                          setOpening({
                            month: row.month,
                            amount: row.opening_override ? String(row.opening_balance) : '',
                            reason: '',
                          })
                        }
                      >
                        <Pencil size={15} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canManageRentalPeriods && !closed && row.month === oldestOpen && (
                    <Button
                      size="small"
                      startIcon={<Lock size={14} />}
                      onClick={() => setToClose(row.month)}
                    >
                      {t('rental.periods.close')}
                    </Button>
                  )}
                  {canManageRentalPeriods && closed && row.month === latestClosed && (
                    <Button
                      size="small"
                      startIcon={<LockOpen size={14} />}
                      onClick={() => setToReopen(row.month)}
                    >
                      {t('rental.periods.reopen')}
                    </Button>
                  )}
                </td>
              </tr>
            );
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toClose)}
        title={t('rental.periods.closeTitle', { month: toClose ? formatMonth(toClose) : '' })}
        description={t('rental.periods.closeDescription')}
        confirmLabel={t('rental.periods.close')}
        onConfirm={() => closeMutation.mutateAsync(toClose)}
        onClose={() => setToClose(null)}
      />

      <ConfirmDialog
        open={Boolean(toReopen)}
        title={t('rental.periods.reopenTitle', { month: toReopen ? formatMonth(toReopen) : '' })}
        description={t('rental.periods.reopenDescription')}
        confirmLabel={t('rental.periods.reopen')}
        requireReason
        onConfirm={(reason) => reopenMutation.mutateAsync({ month: toReopen, reason })}
        onClose={() => setToReopen(null)}
      />

      {opening && (
        <FormDialog
          open={Boolean(opening)}
          title={t('rental.periods.openingTitle', { month: formatMonth(opening.month) })}
          submitLabel={t('common.actions.save')}
          submitDisabled={!openingValid}
          onSubmit={() =>
            openingMutation.mutateAsync({
              month: opening.month,
              payload: {
                amount: opening.amount === '' ? null : openingAmount,
                reason: requiredText(opening.reason),
              },
            })
          }
          onClose={() => setOpening(null)}
        >
          <TextField
            label={t('rental.periods.openingAmount')}
            value={opening.amount}
            onChange={(event) => setOpening({ ...opening, amount: event.target.value })}
            size="small"
            type="number"
            inputProps={{ step: 1 }}
            helperText={t('rental.periods.openingHint')}
            autoFocus
          />
          <TextField
            label={t('rental.periods.openingReason')}
            value={opening.reason}
            onChange={(event) => setOpening({ ...opening, reason: event.target.value })}
            size="small"
            multiline
            minRows={2}
            required
            inputProps={{ maxLength: 500 }}
          />
        </FormDialog>
      )}
    </>
  );
}
