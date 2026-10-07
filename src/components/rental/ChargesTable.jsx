import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Undo2 } from 'lucide-react';

import { DataTable, Money } from '../ui';
import { chargeKindKey } from '../../constants/labels';
import { formatDate } from '../../utils/format';

/**
 * The fees billed on top of an order, with what was paid on each and what
 * remains. A cancelled fee stays listed, struck through, with its reason.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.charges The fees, as the API reads them.
 * @param {(charge: object) => void} [props.onCancel] Called to cancel a fee; the
 *   action is offered only on active fees with nothing paid when given.
 * @returns {JSX.Element} The table.
 */
export default function ChargesTable({ charges, onCancel }) {
  const { t } = useTranslation();

  return (
    <DataTable
      columns={[
        { key: 'date', label: t('rental.columns.date') },
        { key: 'label', label: t('rental.charges.label') },
        { key: 'amount', label: t('rental.columns.amount'), align: 'right' },
        { key: 'balance', label: t('rental.charges.balance'), align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ]}
      rows={charges}
      emptyMessage={t('rental.charges.empty')}
      renderRow={(charge) => {
        const cancelled = charge.status !== 'ACTIVE';
        return (
          <tr key={charge.id}>
            <td className="num">{formatDate(charge.charge_date)}</td>
            <td>
              <span className="chip" style={{ marginInlineEnd: 8 }}>
                {t(chargeKindKey(charge.kind))}
              </span>
              {charge.label}
              <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {cancelled && charge.cancel_reason
                  ? t('common.cancelledWithReason', { reason: charge.cancel_reason })
                  : `${charge.quantity} × `}
                {!cancelled && <Money value={charge.unit_amount} />}
              </div>
            </td>
            <td className="r">
              <Money value={charge.amount} strike={cancelled} />
            </td>
            <td className="r">
              {cancelled ? t('common.empty.value') : <Money value={charge.balance} />}
            </td>
            <td className="r" style={{ width: '1%' }}>
              {onCancel && !cancelled && charge.paid_total === 0 && (
                <Tooltip title={t('rental.charges.cancel')}>
                  <IconButton
                    size="small"
                    onClick={() => onCancel(charge)}
                    aria-label={t('rental.charges.cancel')}
                  >
                    <Undo2 size={15} />
                  </IconButton>
                </Tooltip>
              )}
            </td>
          </tr>
        );
      }}
    />
  );
}
