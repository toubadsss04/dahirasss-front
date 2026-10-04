import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Ban, Pencil, Plus } from 'lucide-react';

import { operationStatusKey } from '../../constants/labels';
import { formatDate } from '../../utils/format';
import { EmptyState, ErrorNote, Loader, Money, StatusBadge } from '../ui';

/**
 * Every payment of one contributor, cancelled ones included.
 *
 * @param {object} props Component props.
 * @param {object|null} props.contributor The contributor shown, null when closed.
 * @param {Array<object>} [props.payments] The payments, newest first.
 * @param {boolean} props.isLoading Whether the payments are loading.
 * @param {string} [props.error] Loading failure, if any.
 * @param {boolean} props.canRecord Whether payments may be added.
 * @param {(payment: object) => boolean} props.canCorrect Whether one payment may be corrected.
 * @param {boolean} props.canCancel Whether payments may be cancelled.
 * @param {() => void} props.onAddPayment Called to record a new instalment.
 * @param {(payment: object) => void} props.onEditPayment Called to correct one.
 * @param {(payment: object) => void} props.onCancelPayment Called to cancel one.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ContributorPaymentsDialog({
  contributor,
  payments = [],
  isLoading,
  error,
  canRecord,
  canCorrect,
  canCancel,
  onAddPayment,
  onEditPayment,
  onCancelPayment,
  onClose,
}) {
  const { t } = useTranslation();
  const hasActions = canRecord || canCancel;

  const renderBody = () => {
    if (isLoading) return <Loader />;
    if (error) return <ErrorNote message={error} />;
    if (payments.length === 0) return <EmptyState message={t('projects.payments.empty')} />;
    return (
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('projects.payments.columns.date')}</th>
              <th>{t('projects.payments.columns.status')}</th>
              <th className="r">{t('projects.payments.columns.amount')}</th>
              {hasActions && <th />}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const cancelled = payment.status === 'CANCELLED';
              return (
                <tr key={payment.id}>
                  <td>
                    <div className="num">{formatDate(payment.payment_date)}</div>
                    {payment.meeting_date && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t('projects.payments.viaMeeting', {
                          date: formatDate(payment.meeting_date),
                        })}
                      </div>
                    )}
                    {payment.created_by_name && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t('common.recordedBy', { name: payment.created_by_name })}
                      </div>
                    )}
                    {(payment.comment || payment.cancel_reason) && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {cancelled && payment.cancel_reason
                          ? t('common.cancelledWithReason', { reason: payment.cancel_reason })
                          : payment.comment}
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge
                      label={t(operationStatusKey(payment.status))}
                      tone={cancelled ? 'cancel' : 'open'}
                    />
                  </td>
                  <td className="r">
                    <Money value={payment.amount} tone={!cancelled} strike={cancelled} />
                  </td>
                  {hasActions && (
                    <td className="r" style={{ width: '1%' }}>
                      {!cancelled && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 4,
                          }}
                        >
                          {canRecord && canCorrect(payment) && (
                            <Tooltip title={t('common.actions.edit')}>
                              <IconButton
                                size="small"
                                aria-label={t('common.actions.edit')}
                                onClick={() => onEditPayment(payment)}
                              >
                                <Pencil size={15} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canCancel && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Ban size={14} />}
                              onClick={() => onCancelPayment(payment)}
                            >
                              {t('common.actions.cancel')}
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog open={Boolean(contributor)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('projects.payments.title', { name: contributor?.full_name ?? '' })}
      </DialogTitle>
      <DialogContent>{renderBody()}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.actions.close')}
        </Button>
        {canRecord && (
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={onAddPayment}>
            {t('projects.payments.add')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
