import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import AppSelect from '../components/forms/AppSelect';
import DaaraLabel from '../components/ui/DaaraLabel';
import {
  DataTable,
  EmptyState,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { movementTypeKey, operationStatusKey } from '../constants/labels';
import { extractErrorMessage } from '../services/apiClient';
import {
  categoryFilterOptions,
  categoryFilterParams,
  fetchDaaras,
} from '../services/daara.service';
import { fetchJournal } from '../services/reporting.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatDate } from '../utils/format';

/**
 * Unified journal of every financial movement in one exercise.
 *
 * Contributions, Barkelou and the payments to Gamou projects come in
 * positive, expenses negative, so the column reads as a ledger.
 *
 * @returns {JSX.Element} The screen.
 */
export default function FinancialJournalPage() {
  const { t } = useTranslation();
  const selected = useExerciseStore((state) => state.selected());
  const exerciseId = selected?.id;

  const [typeFilter, setTypeFilter] = useState('');
  const [daaraFilter, setDaaraFilter] = useState('');

  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });
  const journal = useQuery({
    queryKey: ['journal', exerciseId, typeFilter, daaraFilter],
    queryFn: () =>
      fetchJournal(exerciseId, {
        movement_type: typeFilter || undefined,
        ...categoryFilterParams(daaraFilter),
        limit: 200,
      }),
    enabled: Boolean(exerciseId),
  });

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('journal.title')} />
        <div className="card">
          <EmptyState message={t('journal.noExercise')} />
        </div>
      </>
    );
  }

  if (journal.isLoading) return <Loader />;
  if (journal.error) return <ErrorNote message={extractErrorMessage(journal.error)} />;

  const daaraOptions = categoryFilterOptions(daaras.data ?? [], t('common.empty.noCategory'));

  const typeOptions = [
    { value: 'CONTRIBUTION', label: t(movementTypeKey('CONTRIBUTION')) },
    { value: 'DONATION', label: t(movementTypeKey('DONATION')) },
    { value: 'PROJECT_PAYMENT', label: t(movementTypeKey('PROJECT_PAYMENT')) },
    { value: 'EXPENSE', label: t(movementTypeKey('EXPENSE')) },
  ];

  return (
    <>
      <PageHeader
        title={t('journal.title')}
        subtitle={`${selected.name} · ${t('journal.subtitle', { count: journal.data.total })}`}
      />

      <FilterBar>
        <AppSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={typeOptions}
          allowEmpty
          placeholder={t('common.filters.allTypes')}
          sx={{ minWidth: 170 }}
        />
        {daaraOptions.length > 1 && (
          <AppSelect
            value={daaraFilter}
            onChange={setDaaraFilter}
            options={daaraOptions}
            allowEmpty
            placeholder={t('common.filters.allDaaras')}
            sx={{ minWidth: 180 }}
          />
        )}
      </FilterBar>

      <DataTable
        columns={[
          { key: 'date', label: t('journal.columns.date') },
          { key: 'type', label: t('journal.columns.type') },
          { key: 'label', label: t('journal.columns.label') },
          { key: 'daara', label: t('journal.columns.scope') },
          { key: 'status', label: t('journal.columns.status') },
          { key: 'amount', label: t('journal.columns.amount'), align: 'right' },
        ]}
        rows={journal.data.items}
        emptyMessage={t('journal.empty')}
        renderRow={(row) => {
          const cancelled = row.status === 'CANCELLED';
          return (
            <tr key={`${row.movement_type}-${row.movement_id}`}>
              <td className="num" style={{ fontWeight: 600 }}>
                {formatDate(row.movement_date)}
              </td>
              <td>
                <span className="chip">{t(movementTypeKey(row.movement_type))}</span>
              </td>
              <td>{row.label}</td>
              <td>
                {row.entity_name || row.uncategorized ? (
                  <DaaraLabel name={row.entity_name} />
                ) : (
                  <span className="chip" style={{ color: 'var(--gold)' }}>
                    {t('journal.global')}
                  </span>
                )}
              </td>
              <td>
                <StatusBadge
                  label={t(operationStatusKey(row.status))}
                  tone={cancelled ? 'cancel' : 'open'}
                />
              </td>
              <td className="r">
                <Money
                  value={row.signed_amount}
                  signed
                  tone={!cancelled}
                  strike={cancelled}
                />
              </td>
            </tr>
          );
        }}
      />
    </>
  );
}
