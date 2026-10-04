import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Ban, ChevronLeft, Download, Plus, Undo2 } from 'lucide-react';

import DocumentTotals from '../../components/rental/DocumentTotals';
import PaymentDialog from '../../components/rental/PaymentDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DataTable, ErrorNote, Loader, Money, PageHeader, StatusBadge } from '../../components/ui';
import { paymentMethodKey, rentalInvoiceStatusKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import { INVOICE_STATUSES, PAYMENT_METHODS } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { extractErrorMessage } from '../../services/apiClient';
import {
  addRentalPayment,
  cancelRentalInvoice,
  cancelRentalPayment,
  downloadRentalPdf,
  fetchRentalInvoice,
} from '../../services/rental.service';
import { notify } from '../../store/notificationStore';
import { formatDate, todayInDakar } from '../../utils/format';

/**
 * One invoice: what it bills, the purchase order it comes from, and the
 * payments received on it. An issued invoice is never edited; it is
 * cancelled once its payments are, and issued again from its order.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalInvoiceDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [payment, setPayment] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [isCancelling, setCancelling] = useState(false);
  const [isDownloading, setDownloading] = useState(false);

  const invoice = useQuery({
    queryKey: [KEYS.rentalInvoice, invoiceId],
    queryFn: () => fetchRentalInvoice(invoiceId),
  });

  const paymentMutation = useDomainMutation(
    'rentalInvoice',
    (payload) => addRentalPayment(invoiceId, payload),
    { successMessage: t('rental.payments.recorded') },
  );
  const cancelPaymentMutation = useDomainMutation(
    'rentalInvoice',
    ({ id, reason }) => cancelRentalPayment(invoiceId, id, reason),
    { successMessage: t('rental.payments.cancelled') },
  );
  const cancelMutation = useDomainMutation(
    'rentalInvoice',
    (reason) => cancelRentalInvoice(invoiceId, reason),
    { successMessage: t('rental.invoices.cancelled') },
  );

  if (invoice.isLoading) return <Loader />;
  if (invoice.error) return <ErrorNote message={extractErrorMessage(invoice.error)} />;

  const record = invoice.data;
  const isIssued = record.status === INVOICE_STATUSES.ISSUED;
  const hasActivePayments = record.payments.some((item) => item.status === 'ACTIVE');

  const download = async () => {
    setDownloading(true);
    try {
      await downloadRentalPdf('invoices', record.id, record.number);
    } catch (error) {
      notify(extractErrorMessage(error), 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.rentalInvoices)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('rental.invoices.back')}
      </button>

      <PageHeader
        title={t('rental.invoices.detailTitle', { number: record.number })}
        subtitle={[
          t('rental.invoices.issuedOn', { date: formatDate(record.issue_date) }),
          record.created_by_name && t('common.recordedBy', { name: record.created_by_name }),
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            {isIssued && record.balance > 0 && (
              <Button
                variant="contained"
                startIcon={<Plus size={15} />}
                onClick={() =>
                  setPayment({
                    amount: String(record.balance),
                    date: todayInDakar(),
                    method: PAYMENT_METHODS[0],
                    comment: '',
                  })
                }
              >
                {t('rental.payments.add')}
              </Button>
            )}
            <Button
              color="inherit"
              startIcon={
                isDownloading ? <CircularProgress size={15} color="inherit" /> : <Download size={15} />
              }
              disabled={isDownloading}
              onClick={download}
            >
              {isDownloading ? t('rental.actions.pdfLoading') : t('rental.actions.pdf')}
            </Button>
            {isIssued && !hasActivePayments && (
              <Button color="inherit" startIcon={<Ban size={15} />} onClick={() => setCancelling(true)}>
                {t('rental.invoices.cancel')}
              </Button>
            )}
          </>
        }
      />

      <div className="recap-pair" style={{ marginBottom: 22 }}>
        <div className="card recap">
          <div className="r-row">
            <span className="l">{t('common.fields.status')}</span>
            <StatusBadge
              label={t(rentalInvoiceStatusKey(record.status))}
              tone={isIssued ? 'open' : 'cancel'}
            />
          </div>
          <div className="r-row">
            <span className="l">{t('rental.columns.order')}</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate(buildPath(ROUTES.rentalOrderDetail, { orderId: record.order_id }))}
            >
              {record.order_number}
            </button>
          </div>
          <div className="r-row">
            <span className="l">{t('rental.columns.customer')}</span>
            <span>
              {record.customer_name}
              {record.customer_phone && (
                <>
                  {' · '}
                  <bdi dir="ltr">{record.customer_phone}</bdi>
                </>
              )}
            </span>
          </div>
          <div className="r-row">
            <span className="l">{t('rental.orders.eventType')}</span>
            <span>{record.event_type}</span>
          </div>
          <div className="r-row">
            <span className="l">{t('rental.invoices.duration')}</span>
            <span>{t('rental.orders.days', { count: record.rental_days })}</span>
          </div>
          <div className="r-row">
            <span className="l">{t('rental.invoices.returnDate')}</span>
            <span className="num">{formatDate(record.return_date)}</span>
          </div>
          {record.remarks && (
            <div className="r-row">
              <span className="l">{record.remarks}</span>
            </div>
          )}
          {record.cancel_reason && (
            <div className="r-row">
              <span className="l">{t('common.cancelledWithReason', { reason: record.cancel_reason })}</span>
            </div>
          )}
        </div>
        <DocumentTotals
          gross={record.gross_total}
          discount={record.discount_total}
          net={record.net_total}
          paid={record.paid_total}
          balance={record.balance}
        />
      </div>

      <div className="section-title">
        <h2>{t('rental.orders.linesTitle')}</h2>
        <div className="line" />
      </div>
      <div style={{ marginBottom: 22 }}>
        <DataTable
          columns={[
            { key: 'article', label: t('rental.columns.article') },
            { key: 'quantity', label: t('rental.columns.quantity'), align: 'right' },
            { key: 'price', label: t('rental.columns.unitPrice'), align: 'right' },
            { key: 'amount', label: t('rental.columns.amount'), align: 'right' },
          ]}
          rows={record.lines}
          renderRow={(line) => (
            <tr key={line.id}>
              <td>{line.article_name}</td>
              <td className="r num">
                {line.quantity} {line.unit_name}
              </td>
              <td className="r">
                <Money value={line.unit_price} />
              </td>
              <td className="r">
                <Money value={line.net_amount} />
              </td>
            </tr>
          )}
        />
      </div>

      <div className="section-title">
        <h2>{t('rental.payments.title')}</h2>
        <div className="line" />
      </div>
      <DataTable
        columns={[
          { key: 'date', label: t('rental.columns.date') },
          { key: 'method', label: t('rental.payments.method') },
          { key: 'amount', label: t('rental.payments.amount'), align: 'right' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={record.payments}
        emptyMessage={t('rental.payments.empty')}
        renderRow={(item) => {
          const cancelled = item.status !== 'ACTIVE';
          return (
            <tr key={item.id}>
              <td className="num">
                {formatDate(item.payment_date)}
                {(item.comment || item.cancel_reason) && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {cancelled && item.cancel_reason
                      ? t('common.cancelledWithReason', { reason: item.cancel_reason })
                      : item.comment}
                  </div>
                )}
              </td>
              <td>{t(paymentMethodKey(item.method))}</td>
              <td className="r">
                <Money value={item.amount} strike={cancelled} />
              </td>
              <td className="r" style={{ width: '1%' }}>
                {!cancelled && isIssued && (
                  <Tooltip title={t('rental.payments.cancel')}>
                    <IconButton
                      size="small"
                      onClick={() => setToCancel(item)}
                      aria-label={t('rental.payments.cancel')}
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

      {payment && (
        <PaymentDialog
          open={Boolean(payment)}
          balance={record.balance}
          form={payment}
          onChange={setPayment}
          onSubmit={() =>
            paymentMutation.mutateAsync({
              amount: Number(payment.amount),
              payment_date: payment.date || null,
              method: payment.method,
              comment: payment.comment.trim() || null,
            })
          }
          onClose={() => setPayment(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('rental.payments.cancelTitle')}
        description={t('rental.payments.cancelDescription')}
        confirmLabel={t('rental.payments.cancel')}
        requireReason
        danger
        onConfirm={(reason) => cancelPaymentMutation.mutateAsync({ id: toCancel.id, reason })}
        onClose={() => setToCancel(null)}
      />

      <ConfirmDialog
        open={isCancelling}
        title={t('rental.invoices.cancelTitle')}
        description={t('rental.invoices.cancelDescription', { number: record.number })}
        confirmLabel={t('rental.invoices.cancel')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync(reason)}
        onClose={() => setCancelling(false)}
      />
    </>
  );
}
