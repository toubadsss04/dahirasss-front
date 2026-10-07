import { useTranslation } from 'react-i18next';

import { DataTable } from '../ui';
import { formatDateTime } from '../../utils/format';

/**
 * The goes in which the material of an order came back, oldest first: when,
 * by whom, and for each article how many units came back usable, damaged or
 * lost, with how late the go was.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.returns The returns of the order, as the API reads them.
 * @returns {JSX.Element} The table.
 */
export default function ReturnsTable({ returns }) {
  const { t } = useTranslation();

  return (
    <DataTable
      columns={[
        { key: 'sequence', label: t('rental.returns.sequence') },
        { key: 'date', label: t('rental.columns.date') },
        { key: 'articles', label: t('rental.returns.articles') },
        { key: 'team', label: t('rental.orders.teamBack') },
      ]}
      rows={returns}
      emptyMessage={t('rental.returns.empty')}
      renderRow={(go) => (
        <tr key={go.id}>
          <td className="num" style={{ width: '1%' }}>
            {go.sequence}
          </td>
          <td className="num">
            {formatDateTime(go.returned_at)}
            {go.late_days > 0 && (
              <div style={{ fontSize: 12, color: 'var(--neg)' }}>
                {t('rental.orders.returnedLate', { count: go.late_days })}
              </div>
            )}
          </td>
          <td>
            {go.lines.map((line) => (
              <div key={line.order_line_id}>
                <span style={{ fontWeight: 600 }}>{line.article_name}</span>
                <span className="num" style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {' · '}
                  {[
                    line.returned > 0 && t('rental.returns.returned', { count: line.returned }),
                    line.damaged > 0 && t('rental.returns.damaged', { count: line.damaged }),
                    line.lost > 0 && t('rental.returns.lost', { count: line.lost }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            ))}
            {go.comment && (
              <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'pre-line' }}>
                {go.comment}
              </div>
            )}
          </td>
          <td style={{ whiteSpace: 'pre-line' }}>{go.team || t('common.empty.value')}</td>
        </tr>
      )}
    />
  );
}
