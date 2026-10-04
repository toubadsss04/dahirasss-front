import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import PeriodFilter from '../../components/rental/PeriodFilter';
import { DataTable, ErrorNote, Loader, Money, PageHeader } from '../../components/ui';
import { paymentMethodKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import { buildPath, ROUTES } from '../../constants/routes';
import { extractErrorMessage } from '../../services/apiClient';
import { currentMonthPeriod, fetchRentalStatement, isValidPeriod } from '../../services/rental.service';
import { formatDate } from '../../utils/format';

/**
 * Financial statement of the rental business over a period, the current
 * month by default.
 *
 * Invoices count by their issue date and payments by the day they were
 * received, so a payment for last month's invoice shows in this month's
 * collections. Every figure comes from the documents and payments recorded.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalStatementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(currentMonthPeriod);

  const statement = useQuery({
    queryKey: [KEYS.rentalStatement, period.dateFrom, period.dateTo],
    queryFn: () => fetchRentalStatement({ date_from: period.dateFrom, date_to: period.dateTo }),
    enabled: isValidPeriod(period),
    placeholderData: keepPreviousData,
  });
  const data = statement.data;

  return (
    <>
      <PageHeader
        title={t('rental.statement.title')}
        subtitle={
          data
            ? t('rental.period.label', {
                from: formatDate(data.date_from),
                to: formatDate(data.date_to),
              })
            : undefined
        }
      />

      <PeriodFilter dateFrom={period.dateFrom} dateTo={period.dateTo} onChange={setPeriod} />

      {statement.isLoading && <Loader />}
      {statement.error && <ErrorNote message={extractErrorMessage(statement.error)} />}

      {data && (
        <>
          <div className="recap-pair" style={{ marginBottom: 22 }}>
            <div className="card recap">
              <div className="section-title" style={{ padding: '14px 16px 2px', margin: 0 }}>
                <h2>{t('rental.statement.invoicing')}</h2>
                <div className="line" />
              </div>
              <div className="r-row">
                <span className="l">
                  {t('rental.statement.invoicesCount', { count: data.invoices_count })}
                </span>
                <span />
              </div>
              <div className="r-row">
                <span className="l">{t('rental.totals.gross')}</span>
                <Money value={data.gross_total} />
              </div>
              <div className="r-row">
                <span className="l">{t('rental.totals.discount')}</span>
                <Money value={-data.discount_total} />
              </div>
              <div className="r-row grand">
                <span className="l">{t('rental.statement.invoicedNet')}</span>
                <Money value={data.net_total} />
              </div>
              {data.cancelled_invoices_count > 0 && (
                <div className="r-row">
                  <span className="l">
                    {t('rental.statement.cancelledCount', { count: data.cancelled_invoices_count })}
                  </span>
                  <span />
                </div>
              )}
            </div>

            <div className="card recap">
              <div className="section-title" style={{ padding: '14px 16px 2px', margin: 0 }}>
                <h2>{t('rental.statement.collections')}</h2>
                <div className="line" />
              </div>
              {data.collected_by_method.map((row) => (
                <div className="r-row" key={row.method}>
                  <span className="l">
                    {t(paymentMethodKey(row.method))} · {t('rental.statement.paymentsCount', { count: row.count })}
                  </span>
                  <Money value={row.amount} />
                </div>
              ))}
              <div className="r-row grand">
                <span className="l">{t('rental.statement.collected')}</span>
                <Money value={data.collected_total} />
              </div>
              <div className="r-row">
                <span className="l">{t('rental.statement.periodOutstanding')}</span>
                <Money value={data.period_outstanding} />
              </div>
              <div className="r-row tot">
                <span className="l">{t('rental.statement.outstanding')}</span>
                <Money value={data.outstanding} />
              </div>
            </div>
          </div>

          <div className="section-title">
            <h2>{t('rental.statement.articlesTitle')}</h2>
            <div className="line" />
          </div>
          <div style={{ marginBottom: 22 }}>
            <DataTable
              columns={[
                { key: 'article', label: t('rental.columns.article') },
                { key: 'quantity', label: t('rental.columns.quantity'), align: 'right' },
                { key: 'amount', label: t('rental.columns.amount'), align: 'right' },
              ]}
              rows={data.articles}
              emptyMessage={t('rental.statement.empty')}
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
          </div>

          <div className="section-title">
            <h2>{t('rental.statement.invoicesTitle')}</h2>
            <div className="line" />
          </div>
          <DataTable
            columns={[
              { key: 'number', label: t('rental.columns.invoice') },
              { key: 'date', label: t('rental.columns.date') },
              { key: 'customer', label: t('rental.columns.customer') },
              { key: 'net', label: t('rental.columns.net'), align: 'right' },
              { key: 'balance', label: t('rental.columns.balance'), align: 'right' },
            ]}
            rows={data.invoices}
            emptyMessage={t('rental.statement.empty')}
            renderRow={(invoice) => (
              <tr
                key={invoice.id}
                className="clickable"
                onClick={() =>
                  navigate(buildPath(ROUTES.rentalInvoiceDetail, { invoiceId: invoice.id }))
                }
              >
                <td className="num">{invoice.number}</td>
                <td className="num">{formatDate(invoice.issue_date)}</td>
                <td>{invoice.customer_name}</td>
                <td className="r">
                  <Money value={invoice.net_total} />
                </td>
                <td className="r">
                  <Money value={invoice.balance} />
                </td>
              </tr>
            )}
          />
        </>
      )}
    </>
  );
}
