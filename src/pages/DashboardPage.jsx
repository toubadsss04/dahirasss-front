import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Coins, HandCoins, Receipt, Scale } from 'lucide-react';

import DaaraLabel from '../components/ui/DaaraLabel';
import {
  DataTable,
  EmptyState,
  ErrorNote,
  KpiCard,
  Loader,
  Money,
  PageHeader,
} from '../components/ui';
import { NO_CATEGORY } from '../constants/members';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDashboard } from '../services/reporting.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatMoney, formatMonthShort } from '../utils/format';
import { playOpeningSoundIfNeeded } from '../utils/soundService';

/**
 * Monthly bar chart of collections against expenses.
 *
 * Drawn with plain elements rather than a charting library, which keeps the
 * bundle small and the rendering identical in both themes.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.monthly Monthly rows from the API.
 * @returns {JSX.Element} The chart.
 */
function MonthlyChart({ monthly }) {
  const { t } = useTranslation();
  if (monthly.length === 0) {
    return <EmptyState message={t('dashboard.chart.empty')} />;
  }

  const peak = Math.max(
    ...monthly.map((row) => row.total_contributions + row.total_expenses),
    1,
  );

  return (
    <>
      <div className="bars">
        {monthly.map((row) => (
          <div className="bar-col" key={row.period}>
            <div className="bar-stack">
              <div
                className="bar d"
                style={{ height: `${(row.total_expenses / peak) * 150}px` }}
                title={t('dashboard.chart.expensesTooltip', {
                  amount: formatMoney(row.total_expenses),
                })}
              />
              <div
                className="bar c"
                style={{ height: `${(row.total_contributions / peak) * 150}px` }}
                title={t('dashboard.chart.collectedTooltip', {
                  amount: formatMoney(row.total_contributions),
                })}
              />
            </div>
            <div className="bar-x">{formatMonthShort(row.period)}</div>
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--pine-2)' }} />
          {t('dashboard.chart.collected')}
        </span>
        <span>
          <i style={{ background: 'var(--gold)' }} />
          {t('dashboard.chart.expenses')}
        </span>
      </div>
    </>
  );
}

/**
 * Landing screen.
 *
 * Every figure is recomputed by the API from the recorded operations, never
 * read from a stored total.
 *
 * @returns {JSX.Element} The dashboard.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const selected = useExerciseStore((state) => state.selected());

  // The chime belongs to arriving here after signing in, not to every visit.
  // The sign-in screen leaves word, this reads it once and forgets it, so
  // coming back to the dashboard later stays silent.
  useEffect(() => {
    playOpeningSoundIfNeeded();
  }, []);
  const exerciseId = selected?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', exerciseId],
    queryFn: () => fetchDashboard(exerciseId),
    enabled: Boolean(exerciseId),
  });

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('dashboard.title')} />
        <div className="card">
          <EmptyState message={t('dashboard.noExercise')} />
        </div>
      </>
    );
  }

  if (isLoading) return <Loader />;
  if (error) return <ErrorNote message={extractErrorMessage(error)} />;

  const { summary, entities, monthly, carried_from: carriedFrom } = data;

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={`${t('dashboard.subtitle')} · ${summary.exercise_name}`}
      />

      <div className="grid kpis" style={{ marginBottom: 22 }}>
        <KpiCard
          label={t('dashboard.kpi.balance')}
          value={summary.final_balance}
          accent
          icon={<Scale size={15} />}
          meta={
            summary.initial_balance > 0
              ? t(carriedFrom ? 'dashboard.kpi.carriedFrom' : 'dashboard.kpi.carried', {
                  amount: formatMoney(summary.initial_balance),
                  exercise: carriedFrom,
                })
              : t('dashboard.kpi.noCarry')
          }
        />
        <KpiCard
          label={t('dashboard.kpi.collected')}
          value={summary.total_contributions}
          icon={<Coins size={15} />}
          meta={t('dashboard.kpi.collectedMeta')}
        />
        <KpiCard
          label={t('dashboard.kpi.donations')}
          value={summary.total_donations}
          icon={<HandCoins size={15} />}
          meta={t('dashboard.kpi.donationsMeta')}
        />
        <KpiCard
          label={t('dashboard.kpi.expenses')}
          value={summary.total_expenses}
          icon={<Receipt size={15} />}
          meta={t('dashboard.kpi.expensesMeta', {
            amount: formatMoney(summary.total_project_expenses ?? 0),
          })}
        />
      </div>

      <div className="split">
        <div className="card chart-card">
          <div className="section-title" style={{ margin: '2px 0 0' }}>
            <h2>{t('dashboard.chart.title')}</h2>
            <div className="line" />
          </div>
          <MonthlyChart monthly={monthly} />
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="section-title" style={{ margin: '2px 0 10px' }}>
            <h2>{t('dashboard.breakdown.title')}</h2>
            <div className="line" />
          </div>
          <div className="stat-list" style={{ padding: 0 }}>
            <div className="stat-row">
              <span className="lab">{t('dashboard.breakdown.carried')}</span>
              <Money value={summary.initial_balance} />
            </div>
            <div className="stat-row">
              <span className="lab">{t('dashboard.breakdown.collected')}</span>
              <Money value={summary.total_contributions} tone />
            </div>
            <div className="stat-row">
              <span className="lab">{t('dashboard.breakdown.donations')}</span>
              <Money value={summary.total_donations} tone />
            </div>
            <div className="stat-row">
              <span className="lab">{t('dashboard.breakdown.projects')}</span>
              <Money value={summary.total_project_payments ?? 0} tone />
            </div>
            <div className="stat-row">
              <span className="lab">{t('dashboard.breakdown.expenses')}</span>
              <Money value={-summary.total_expenses} tone />
            </div>
            <div
              className="stat-row"
              style={{ borderTop: '1px solid var(--line)', marginTop: 4 }}
            >
              <span className="lab" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                {t('dashboard.breakdown.final')}
              </span>
              <Money value={summary.final_balance} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="section-title">
        <h2>{t('dashboard.daaras.title')}</h2>
        <div className="line" />
      </div>
      <DataTable
        columns={[
          { key: 'daara', label: t('dashboard.daaras.columns.daara') },
          { key: 'members', label: t('dashboard.daaras.columns.members'), align: 'right' },
          { key: 'collected', label: t('dashboard.daaras.columns.collected'), align: 'right' },
          { key: 'projects', label: t('dashboard.daaras.columns.projects'), align: 'right' },
          { key: 'balance', label: t('dashboard.daaras.columns.balance'), align: 'right' },
        ]}
        rows={entities}
        emptyMessage={t('dashboard.daaras.empty')}
        renderRow={(row) => (
          <tr key={row.entity_id ?? NO_CATEGORY}>
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
    </>
  );
}
