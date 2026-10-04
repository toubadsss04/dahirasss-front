import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

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
} from '../components/ui';

import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaras } from '../services/daara.service';
import { fetchStatement } from '../services/reporting.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatMonth } from '../utils/format';

/** The four breakdowns of section 37, shown one at a time. */
const VIEWS = ['daaras', 'monthly', 'members', 'categories'];

/**
 * Balance card of the whole Dahira for the exercise.
 *
 * The payments to the projects tied to this Gamou are part of its income;
 * the projects standing apart are not.
 *
 * @param {object} props Component props.
 * @param {string} props.title What the card covers.
 * @param {string} props.subtitle Which sections are counted.
 * @param {object} props.totals The figures to show.
 * @returns {JSX.Element} The card.
 */
function BalanceCard({ title, subtitle, totals }) {
  const { t } = useTranslation();
  return (
    <div className="card recap">
      <div className="section-title" style={{ padding: '14px 16px 2px', margin: 0 }}>
        <h2>{title}</h2>
        <div className="line" />
      </div>
      <div style={{ padding: '0 16px 6px', fontSize: 12.5, color: 'var(--muted)' }}>
        {subtitle}
      </div>

      <div className="r-row">
        <span className="l">{t('statement.card.carried')}</span>
        <Money value={totals.initial_balance} />
      </div>
      <div className="r-row">
        <span className="l">{t('statement.card.contributions')}</span>
        <Money value={totals.total_contributions} tone />
      </div>
      <div className="r-row">
        <span className="l">{t('statement.card.donations')}</span>
        <Money value={totals.total_donations} tone />
      </div>
      <div className="r-row">
        <span className="l">{t('statement.card.projects')}</span>
        <Money value={totals.total_project_payments ?? 0} tone />
      </div>
      <div className="r-row tot">
        <span className="l">{t('statement.card.totalIncome')}</span>
        <Money value={totals.total_income} />
      </div>
      <div className="r-row">
        <span className="l">{t('statement.card.totalExpenses')}</span>
        <Money value={-totals.total_expenses} tone />
      </div>
      <div className="r-row grand">
        <span className="l">{t('statement.card.finalBalance')}</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
          <Money value={totals.final_balance} />
        </span>
      </div>
    </div>
  );
}

/**
 * Full financial statement of one exercise.
 *
 * The balance covers the whole Dahira; the breakdowns can be narrowed to one
 * section.
 *
 * @returns {JSX.Element} The screen.
 */
export default function FinancialStatementPage() {
  const { t } = useTranslation();
  const selected = useExerciseStore((state) => state.selected());
  const exerciseId = selected?.id;

  const [daaraFilter, setDaaraFilter] = useState('');
  const [view, setView] = useState('daaras');

  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });
  const statement = useQuery({
    queryKey: ['statement', exerciseId, daaraFilter],
    queryFn: () => fetchStatement(exerciseId, daaraFilter || undefined),
    enabled: Boolean(exerciseId),
  });

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('statement.title')} />
        <div className="card">
          <EmptyState message={t('statement.noExercise')} />
        </div>
      </>
    );
  }

  if (statement.isLoading) return <Loader />;
  if (statement.error) return <ErrorNote message={extractErrorMessage(statement.error)} />;

  const { summary, entities, monthly, members, categories } = statement.data;
  const daaraOptions = (daaras.data ?? []).map((daara) => ({
    value: daara.id,
    label: daara.name,
  }));
  const scopeLabel = daaraFilter
    ? (daaraOptions.find((option) => option.value === daaraFilter)?.label ?? '')
    : t('common.filters.allDaaras');

  return (
    <>
      <PageHeader
        title={t('statement.title')}
        subtitle={`${summary.exercise_name} · ${scopeLabel}`}
      />

      {daaraOptions.length > 1 && (
        <FilterBar>
          <AppSelect
            label={t('common.fields.daara')}
            value={daaraFilter}
            onChange={setDaaraFilter}
            options={daaraOptions}
            allowEmpty
            placeholder={t('common.filters.allDaaras')}
            sx={{ minWidth: 200 }}
          />
        </FilterBar>
      )}

      <div style={{ marginBottom: 20 }}>
        <BalanceCard
          title={t('statement.total.title')}
          subtitle={t('statement.total.subtitle')}
          totals={summary}
        />
      </div>

      <Tabs
        value={view}
        onChange={(_, next) => setView(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 40,
          mb: 2,
          borderBottom: '1px solid var(--line)',
          '& .MuiTab-root': { minHeight: 40, fontSize: 13.5, textTransform: 'none' },
        }}
      >
        {VIEWS.map((name) => (
          <Tab key={name} value={name} label={t(`statement.views.${name}`)} />
        ))}
      </Tabs>

      {view === 'daaras' && (
        <DataTable
          columns={[
            { key: 'daara', label: t('statement.daaraTable.columns.daara') },
            { key: 'members', label: t('statement.daaraTable.columns.members'), align: 'right' },
            { key: 'collected', label: t('statement.daaraTable.columns.collected'), align: 'right' },
            { key: 'projects', label: t('statement.daaraTable.columns.projects'), align: 'right' },
            { key: 'balance', label: t('statement.daaraTable.columns.balance'), align: 'right' },
          ]}
          rows={entities}
          emptyMessage={t('statement.daaraTable.empty')}
          renderRow={(row) => (
            <tr key={row.entity_id}>
              <td>
                <DaaraLabel name={row.entity_name} withMark />
              </td>
              <td className="r num">{row.members_count}</td>
              <td className="r">
                <Money value={row.total_contributions} tone />
              </td>
              <td className="r">
                <Money value={row.total_project_payments} tone />
              </td>
              <td className="r">
                <Money value={row.balance} />
              </td>
            </tr>
          )}
        />
      )}

      {view === 'monthly' && (
        <DataTable
          columns={[
            { key: 'month', label: t('statement.monthlyTable.columns.month') },
            { key: 'meetings', label: t('statement.monthlyTable.columns.meetings'), align: 'right' },
            { key: 'contributors', label: t('statement.monthlyTable.columns.contributors'), align: 'right' },
            { key: 'collected', label: t('statement.monthlyTable.columns.contributions'), align: 'right' },
            { key: 'projects', label: t('statement.monthlyTable.columns.projects'), align: 'right' },
            { key: 'spent', label: t('statement.monthlyTable.columns.expenses'), align: 'right' },
          ]}
          rows={monthly}
          emptyMessage={t('statement.monthlyTable.empty')}
          renderRow={(row) => (
            <tr key={row.period}>
              <td style={{ fontWeight: 600 }}>{formatMonth(row.period)}</td>
              <td className="r num">{row.meetings_count}</td>
              <td className="r num">{row.contributors_count}</td>
              <td className="r">
                <Money value={row.total_contributions} tone />
              </td>
              <td className="r">
                <Money value={row.total_project_payments} tone />
              </td>
              <td className="r">
                <Money value={row.total_expenses} />
              </td>
            </tr>
          )}
        />
      )}

      {view === 'members' && (
        <DataTable
          columns={[
            { key: 'member', label: t('statement.memberTable.columns.member') },
            { key: 'count', label: t('statement.memberTable.columns.count'), align: 'right' },
            { key: 'total', label: t('statement.memberTable.columns.total'), align: 'right' },
          ]}
          rows={members}
          emptyMessage={t('statement.memberTable.empty')}
          renderRow={(row) => (
            <tr key={row.member_id}>
              <td style={{ fontWeight: 600 }}>{row.full_name}</td>
              <td className="r num">{row.contributions_count}</td>
              <td className="r">
                <Money value={row.total_amount} tone />
              </td>
            </tr>
          )}
        />
      )}

      {view === 'categories' && (
        <DataTable
          columns={[
            { key: 'category', label: t('statement.categoryTable.columns.category') },
            { key: 'count', label: t('statement.categoryTable.columns.count'), align: 'right' },
            { key: 'total', label: t('statement.categoryTable.columns.total'), align: 'right' },
          ]}
          rows={categories}
          emptyMessage={t('statement.categoryTable.empty')}
          renderRow={(row) => (
            <tr key={row.category_id}>
              <td>{row.category_name}</td>
              <td className="r num">{row.expenses_count}</td>
              <td className="r">
                <Money value={row.total_amount} />
              </td>
            </tr>
          )}
        />
      )}
    </>
  );
}
