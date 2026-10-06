import { useTranslation } from 'react-i18next';

import { DataTable, Money } from '../ui';
import { formatPercent } from '../../utils/format';

const footerCell = { borderTop: '1px solid var(--line)', padding: '10px 14px' };

/**
 * What each article brought in over a period, read from the issued invoices.
 *
 * The dashboard shows the compact form, limited to the top articles; the
 * statement shows every column, every article and a footer that reconciles
 * the articles' amounts with the net invoiced.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.rows Rows from the API (RentalArticlePerformance).
 * @param {boolean} [props.compact] Keep only article, rentals, amount and share.
 * @param {{linesTotal: number, globalDiscount: number, net: number}} [props.totals]
 *   Footer figures; omitted in the compact form.
 * @param {string} [props.emptyMessage] Shown when no article was invoiced.
 * @param {number} [props.maxHeight] Height in pixels past which the body scrolls.
 * @returns {JSX.Element} The table.
 */
export default function ArticlePerformanceTable({
  rows,
  compact = false,
  totals,
  emptyMessage,
  maxHeight,
}) {
  const { t } = useTranslation();

  const columns = [
    { key: 'article', label: t('rental.columns.article') },
    {
      key: 'rentals',
      label: t('rental.performance.rentals'),
      hint: t('rental.performance.rentalsHint'),
      align: 'right',
    },
    ...(compact
      ? []
      : [
          {
            key: 'quantity',
            label: t('rental.performance.quantity'),
            hint: t('rental.performance.quantityHint'),
            align: 'right',
          },
          {
            key: 'unitDays',
            label: t('rental.performance.unitDays'),
            hint: t('rental.performance.unitDaysHint'),
            align: 'right',
          },
          {
            key: 'averagePrice',
            label: t('rental.performance.averagePrice'),
            hint: t('rental.performance.averagePriceHint'),
            align: 'right',
          },
        ]),
    {
      key: 'amount',
      label: t('rental.performance.amount'),
      hint: t('rental.performance.amountHint'),
      align: 'right',
    },
    {
      key: 'share',
      label: t('rental.performance.share'),
      hint: t('rental.performance.shareHint'),
      align: 'right',
    },
  ];

  const labelSpan = compact ? 2 : 5;
  const footer = totals && !compact && (
    <tfoot>
      {totals.globalDiscount !== 0 && (
        <>
          <tr>
            <td colSpan={labelSpan} style={{ ...footerCell, color: 'var(--muted)' }}>
              {t('rental.performance.linesTotal')}
            </td>
            <td className="r" style={footerCell}>
              <Money value={totals.linesTotal} />
            </td>
            <td style={footerCell} />
          </tr>
          <tr>
            <td colSpan={labelSpan} style={{ padding: '8px 14px', color: 'var(--muted)' }}>
              {t('rental.performance.globalDiscount')}
            </td>
            <td className="r" style={{ padding: '8px 14px' }}>
              <Money value={-totals.globalDiscount} />
            </td>
            <td />
          </tr>
        </>
      )}
      <tr>
        <td colSpan={labelSpan} style={{ ...footerCell, fontWeight: 600 }}>
          {t('rental.performance.net')}
        </td>
        <td className="r" style={footerCell}>
          <Money value={totals.net} />
        </td>
        <td style={footerCell} />
      </tr>
    </tfoot>
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      emptyMessage={emptyMessage}
      maxHeight={maxHeight}
      footer={footer}
      renderRow={(row) => (
        <tr key={row.article_id}>
          <td>
            {row.article_name}
            {compact && (
              <div style={{ color: 'var(--faint)', fontSize: 12 }}>
                {row.quantity} {row.unit_name}
              </div>
            )}
          </td>
          <td className="r num">{row.invoices_count}</td>
          {!compact && (
            <>
              <td className="r num">
                {row.quantity} {row.unit_name}
              </td>
              <td className="r num">{row.unit_days}</td>
              <td className="r">
                <Money value={row.average_price} />
              </td>
            </>
          )}
          <td className="r">
            <Money value={row.net_amount} />
          </td>
          <td className="r num">{formatPercent(row.share)}</td>
        </tr>
      )}
    />
  );
}
