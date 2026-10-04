import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import { AlarmClock, ClipboardList, Coins, FileText, Plus, Truck, Wallet } from 'lucide-react';

import PeriodFilter from '../../components/rental/PeriodFilter';
import { DataTable, ErrorNote, KpiCard, Loader, Money, PageHeader } from '../../components/ui';
import { KEYS } from '../../constants/queryKeys';
import { ROUTES } from '../../constants/routes';
import { extractErrorMessage } from '../../services/apiClient';
import { currentMonthPeriod, fetchRentalDashboard, isValidPeriod } from '../../services/rental.service';
import { formatDate } from '../../utils/format';

/**
 * Dashboard of the rental business: money over the chosen period, the
 * current month by default, and where the orders stand today.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(currentMonthPeriod);

  const dashboard = useQuery({
    queryKey: [KEYS.rentalDashboard, period.dateFrom, period.dateTo],
    queryFn: () => fetchRentalDashboard({ date_from: period.dateFrom, date_to: period.dateTo }),
    enabled: isValidPeriod(period),
    placeholderData: keepPreviousData,
  });
  const data = dashboard.data;

  return (
    <>
      <PageHeader
        title={t('rental.dashboard.title')}
        subtitle={
          data
            ? t('rental.period.label', {
                from: formatDate(data.date_from),
                to: formatDate(data.date_to),
              })
            : undefined
        }
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => navigate(ROUTES.rentalOrderNew)}
          >
            {t('rental.orders.new')}
          </Button>
        }
      />

      <PeriodFilter dateFrom={period.dateFrom} dateTo={period.dateTo} onChange={setPeriod} />

      {dashboard.isLoading && <Loader />}
      {dashboard.error && <ErrorNote message={extractErrorMessage(dashboard.error)} />}

      {data && (
        <>
          <div className="grid kpis" style={{ marginBottom: 22 }}>
            <KpiCard
              label={t('rental.dashboard.invoiced')}
              value={data.invoiced}
              accent
              icon={<FileText size={15} />}
              meta={t('rental.dashboard.invoicesCount', { count: data.invoices_count })}
            />
            <KpiCard
              label={t('rental.dashboard.collected')}
              value={data.collected}
              icon={<Coins size={15} />}
              meta={t('rental.dashboard.collectedMeta')}
            />
            <KpiCard
              label={t('rental.dashboard.outstanding')}
              value={data.outstanding}
              icon={<Wallet size={15} />}
              meta={t('rental.dashboard.outstandingMeta')}
            />
          </div>

          <div className="section-title">
            <h2>{t('rental.dashboard.ordersTitle')}</h2>
            <div className="line" />
          </div>
          <div className="card" style={{ marginBottom: 22 }}>
            {[
              { key: 'draft', icon: ClipboardList, value: data.orders_draft },
              { key: 'confirmed', icon: ClipboardList, value: data.orders_confirmed },
              { key: 'out', icon: Truck, value: data.orders_out },
              { key: 'late', icon: AlarmClock, value: data.orders_late },
            ].map(({ key, icon: Icon, value }) => (
              <div className="stat-row" key={key}>
                <span className="lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={15} />
                  {t(`rental.dashboard.orders.${key}`)}
                </span>
                <b className="num">{value}</b>
              </div>
            ))}
          </div>

          <div className="section-title">
            <h2>{t('rental.dashboard.topTitle')}</h2>
            <div className="line" />
          </div>
          <DataTable
            columns={[
              { key: 'article', label: t('rental.columns.article') },
              { key: 'quantity', label: t('rental.columns.quantity'), align: 'right' },
              { key: 'amount', label: t('rental.columns.amount'), align: 'right' },
            ]}
            rows={data.top_articles}
            emptyMessage={t('rental.dashboard.topEmpty')}
            renderRow={(row) => (
              <tr key={row.article_id}>
                <td>{row.article_name}</td>
                <td className="r num">
                  {row.quantity} {row.unit_name}
                </td>
                <td className="r">
                  <Money value={row.net_amount} />
                </td>
              </tr>
            )}
          />
        </>
      )}
    </>
  );
}
