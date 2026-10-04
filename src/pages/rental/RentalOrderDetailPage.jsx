import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  RotateCcw,
  Truck,
} from 'lucide-react';

import CheckOutDialog from '../../components/rental/CheckOutDialog';
import DocumentTotals from '../../components/rental/DocumentTotals';
import ReturnDialog from '../../components/rental/ReturnDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DataTable, ErrorNote, Loader, Money, PageHeader, StatusBadge } from '../../components/ui';
import { pricingModeKey, rentalOrderStatusKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import {
  EDITABLE_ORDER_STATUSES,
  INVOICEABLE_ORDER_STATUSES,
  ORDER_STATUS_TONES,
  ORDER_STATUSES,
  PRICING_MODES,
} from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { extractErrorMessage } from '../../services/apiClient';
import { notify } from '../../store/notificationStore';
import {
  cancelRentalOrder,
  checkOutRentalOrder,
  confirmRentalOrder,
  createRentalInvoice,
  downloadRentalPdf,
  emptyReturn,
  fetchRentalOrder,
  returnRentalOrder,
  toReturnPayload,
} from '../../services/rental.service';
import { formatDate } from '../../utils/format';

/**
 * One purchase order and the steps it goes through: confirm, hand out,
 * take back, invoice, or cancel. Each step is offered only when the order
 * stands where it can be taken.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalOrderDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [isConfirming, setConfirming] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const [isCancelling, setCancelling] = useState(false);
  const [returnRows, setReturnRows] = useState(null);
  const [returnComment, setReturnComment] = useState('');
  const [returnTeam, setReturnTeam] = useState('');
  const [isDownloading, setDownloading] = useState(false);

  const order = useQuery({
    queryKey: [KEYS.rentalOrder, orderId],
    queryFn: () => fetchRentalOrder(orderId),
  });

  const confirmMutation = useDomainMutation('rentalOrder', () => confirmRentalOrder(orderId), {
    successMessage: t('rental.orders.stepDone'),
  });
  const checkOutMutation = useDomainMutation('rentalOrder', (team) => checkOutRentalOrder(orderId, team), {
    successMessage: t('rental.orders.stepDone'),
  });
  const cancelMutation = useDomainMutation('rentalOrder', (reason) => cancelRentalOrder(orderId, reason), {
    successMessage: t('rental.orders.cancelled'),
  });
  const returnMutation = useDomainMutation('rentalOrder', (payload) => returnRentalOrder(orderId, payload), {
    successMessage: t('rental.orders.returned'),
  });
  const invoiceMutation = useDomainMutation(
    'rentalInvoice',
    () => createRentalInvoice({ order_id: orderId }),
    {
      successMessage: t('rental.invoices.created'),
      onSuccess: (invoice) =>
        navigate(buildPath(ROUTES.rentalInvoiceDetail, { invoiceId: invoice.id })),
    },
  );

  if (order.isLoading) return <Loader />;
  if (order.error) return <ErrorNote message={extractErrorMessage(order.error)} />;

  const record = order.data;
  const hasInvoice = Boolean(record.invoice_id);
  const canEdit = EDITABLE_ORDER_STATUSES.includes(record.status) && !hasInvoice;
  const canInvoice = INVOICEABLE_ORDER_STATUSES.includes(record.status) && !hasInvoice;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadRentalPdf('orders', record.id, record.number);
    } catch (error) {
      notify(extractErrorMessage(error), 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.rentalOrders)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('rental.orders.back')}
      </button>

      <PageHeader
        title={t('rental.orders.detailTitle', { number: record.number })}
        subtitle={[
          t('rental.orders.createdOn', { date: formatDate(record.created_at) }),
          record.created_by_name && t('common.recordedBy', { name: record.created_by_name }),
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            {record.status === ORDER_STATUSES.DRAFT && (
              <Button variant="contained" startIcon={<CheckCircle2 size={15} />} onClick={() => setConfirming(true)}>
                {t('rental.orders.actions.confirm')}
              </Button>
            )}
            {record.status === ORDER_STATUSES.CONFIRMED && (
              <Button variant="contained" startIcon={<Truck size={15} />} onClick={() => setCheckingOut(true)}>
                {t('rental.orders.actions.checkOut')}
              </Button>
            )}
            {record.status === ORDER_STATUSES.OUT && (
              <Button
                variant="contained"
                startIcon={<RotateCcw size={15} />}
                onClick={() => {
                  setReturnRows(emptyReturn(record.lines));
                  setReturnComment('');
                  setReturnTeam('');
                }}
              >
                {t('rental.orders.actions.return')}
              </Button>
            )}
            {canInvoice && (
              <Button
                color="inherit"
                startIcon={<FileText size={15} />}
                disabled={invoiceMutation.isPending}
                onClick={() => invoiceMutation.mutate()}
              >
                {t('rental.orders.actions.invoice')}
              </Button>
            )}
            {canEdit && (
              <Button
                color="inherit"
                startIcon={<Pencil size={15} />}
                onClick={() => navigate(buildPath(ROUTES.rentalOrderEdit, { orderId: record.id }))}
              >
                {t('common.actions.edit')}
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
            {canEdit && (
              <Button color="inherit" startIcon={<Ban size={15} />} onClick={() => setCancelling(true)}>
                {t('rental.orders.actions.cancel')}
              </Button>
            )}
          </>
        }
      />

      {invoiceMutation.error && <ErrorNote message={extractErrorMessage(invoiceMutation.error)} />}

      <div className="recap-pair" style={{ marginBottom: 22 }}>
        <div className="card recap">
          <div className="r-row">
            <span className="l">{t('common.fields.status')}</span>
            <span>
              <StatusBadge
                label={t(rentalOrderStatusKey(record.status))}
                tone={ORDER_STATUS_TONES[record.status]}
              />
              {record.is_late && (
                <span style={{ color: 'var(--neg)', marginInlineStart: 8 }}>{t('rental.orders.late')}</span>
              )}
            </span>
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
            <span className="l">{t('rental.columns.period')}</span>
            <span className="num">
              {formatDate(record.start_date)} → {formatDate(record.end_date)} ·{' '}
              {t('rental.orders.days', { count: record.rental_days })}
            </span>
          </div>
          {record.invoice_id && (
            <div className="r-row">
              <span className="l">{t('rental.columns.invoice')}</span>
              <button
                type="button"
                className="link-btn"
                onClick={() =>
                  navigate(buildPath(ROUTES.rentalInvoiceDetail, { invoiceId: record.invoice_id }))
                }
              >
                {record.invoice_number}
              </button>
            </div>
          )}
          {record.remarks && (
            <div className="r-row" style={{ alignItems: 'flex-start' }}>
              <span className="l">{t('rental.orders.remarks')}</span>
              <span style={{ whiteSpace: 'pre-line', textAlign: 'end' }}>{record.remarks}</span>
            </div>
          )}
          {record.checkout_team && (
            <div className="r-row" style={{ alignItems: 'flex-start' }}>
              <span className="l">{t('rental.orders.teamOut')}</span>
              <span style={{ whiteSpace: 'pre-line', textAlign: 'end' }}>{record.checkout_team}</span>
            </div>
          )}
          {record.return_team && (
            <div className="r-row" style={{ alignItems: 'flex-start' }}>
              <span className="l">{t('rental.orders.teamBack')}</span>
              <span style={{ whiteSpace: 'pre-line', textAlign: 'end' }}>{record.return_team}</span>
            </div>
          )}
          {record.cancel_reason && (
            <div className="r-row">
              <span className="l">
                {t('common.cancelledWithReason', { reason: record.cancel_reason })}
              </span>
            </div>
          )}
        </div>
        <DocumentTotals gross={record.gross_total} discount={record.discount_total} net={record.net_total} />
      </div>

      <div className="section-title">
        <h2>{t('rental.orders.linesTitle')}</h2>
        <div className="line" />
      </div>
      <DataTable
        columns={[
          { key: 'article', label: t('rental.columns.article') },
          { key: 'quantity', label: t('rental.columns.quantity'), align: 'right' },
          { key: 'price', label: t('rental.columns.unitPrice'), align: 'right' },
          { key: 'discount', label: t('rental.columns.discount'), align: 'right' },
          { key: 'amount', label: t('rental.columns.amount'), align: 'right' },
        ]}
        rows={record.lines}
        renderRow={(line) => (
          <tr key={line.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{line.article_name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {line.pricing_mode === PRICING_MODES.PER_DAY
                  ? t('rental.orders.billedDays', { count: line.billed_units })
                  : t(pricingModeKey(line.pricing_mode))}
              </div>
            </td>
            <td className="r num">
              {line.quantity} {line.unit_name}
            </td>
            <td className="r">
              <Money value={line.unit_price} />
            </td>
            <td className="r num">{line.discount_percent ? `${line.discount_percent} %` : t('common.empty.value')}</td>
            <td className="r">
              <Money value={line.net_amount} />
            </td>
          </tr>
        )}
      />

      <ConfirmDialog
        open={isConfirming}
        title={t('rental.orders.confirmTitle')}
        description={t('rental.orders.confirmDescription')}
        confirmLabel={t('common.actions.confirm')}
        onConfirm={() => confirmMutation.mutateAsync()}
        onClose={() => setConfirming(false)}
      />

      <CheckOutDialog
        open={isCheckingOut}
        onSubmit={(team) => checkOutMutation.mutateAsync(team)}
        onClose={() => setCheckingOut(false)}
      />

      <ConfirmDialog
        open={isCancelling}
        title={t('rental.orders.cancelTitle')}
        description={t('rental.orders.cancelDescription', { number: record.number })}
        confirmLabel={t('rental.orders.actions.cancel')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync(reason)}
        onClose={() => setCancelling(false)}
      />

      {returnRows && (
        <ReturnDialog
          open={Boolean(returnRows)}
          rows={returnRows}
          onRowsChange={setReturnRows}
          comment={returnComment}
          onCommentChange={setReturnComment}
          team={returnTeam}
          onTeamChange={setReturnTeam}
          onSubmit={() =>
            returnMutation.mutateAsync(toReturnPayload(returnRows, returnComment, returnTeam))
          }
          onClose={() => setReturnRows(null)}
        />
      )}
    </>
  );
}
