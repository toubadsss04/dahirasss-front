import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Truck,
} from 'lucide-react';

import ChargesDialog from '../../components/rental/ChargesDialog';
import ChargesTable from '../../components/rental/ChargesTable';
import CheckOutDialog from '../../components/rental/CheckOutDialog';
import DocumentTotals from '../../components/rental/DocumentTotals';
import ReturnDialog from '../../components/rental/ReturnDialog';
import ReturnsTable from '../../components/rental/ReturnsTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormDialog from '../../components/ui/FormDialog';
import { DataTable, ErrorNote, Loader, Money, PageHeader, StatusBadge } from '../../components/ui';
import { pricingModeKey, rentalOrderStatusKey, serviceTypeKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import {
  CHARGEABLE_ORDER_STATUSES,
  EDITABLE_ORDER_STATUSES,
  INVOICEABLE_ORDER_STATUSES,
  ORDER_STATUS_TONES,
  LINE_KINDS,
  ORDER_STATUSES,
  OUT_ORDER_STATUSES,
  PRICED_ORDER_STATUSES,
  PRICING_MODES,
} from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import { notify } from '../../store/notificationStore';
import {
  cancelRentalCharge,
  cancelRentalOrder,
  checkOutRentalOrder,
  confirmRentalOrder,
  createRentalCharges,
  createRentalInvoice,
  downloadRentalPdf,
  emptyChargeRow,
  emptyReturn,
  fetchRentalOrder,
  proposalsToRows,
  returnRentalOrder,
  toChargesPayload,
  toDakarDateTimeInput,
  toReturnPayload,
} from '../../services/rental.service';
import { formatDate, formatDateTime, todayInDakar } from '../../utils/format';

/**
 * Blank values of the return dialog, the return moment set to now.
 *
 * @returns {object} The values.
 */
function emptyReturnValues() {
  return {
    comment: '',
    team: '',
    returnedAt: toDakarDateTimeInput(),
    billedDays: '',
    billedDaysReason: '',
  };
}

/**
 * One purchase order and the steps it goes through: confirm, hand out,
 * take back, invoice, or cancel. Each step is offered only when the order
 * stands where it can be taken. The real moments of each step, the return
 * deadline with its grace and any lateness are shown beside the planned
 * period.
 *
 * The material may come back in several goes, each listed under Returns
 * with what is still out. After each go the fees it suggests are offered for
 * billing; fees can also be added by hand and are listed under Fees.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalOrderDetailPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [isConfirming, setConfirming] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const [isCancelling, setCancelling] = useState(false);
  const [returnRows, setReturnRows] = useState(null);
  const [returnValues, setReturnValues] = useState(emptyReturnValues);
  const [isDownloading, setDownloading] = useState(false);
  const [issueDate, setIssueDate] = useState(null);
  const [charges, setCharges] = useState(null);
  const [chargeToCancel, setChargeToCancel] = useState(null);

  const order = useQuery({
    queryKey: [KEYS.rentalOrder, orderId],
    queryFn: () => fetchRentalOrder(orderId),
  });

  const confirmMutation = useDomainMutation('rentalOrder', () => confirmRentalOrder(orderId), {
    successMessage: t('rental.orders.stepDone'),
  });
  const checkOutMutation = useDomainMutation(
    'rentalOrder',
    (values) => checkOutRentalOrder(orderId, values),
    { successMessage: t('rental.orders.stepDone') },
  );
  const cancelMutation = useDomainMutation('rentalOrder', (reason) => cancelRentalOrder(orderId, reason), {
    successMessage: t('rental.orders.cancelled'),
  });
  const returnMutation = useDomainMutation('rentalCharge', (payload) => returnRentalOrder(orderId, payload), {
    successMessage: t('rental.orders.returned'),
    onSuccess: (outcome) => {
      if (outcome.proposed_charges?.length) {
        setCharges({
          mode: 'proposals',
          rows: proposalsToRows(outcome.proposed_charges),
          date: todayInDakar(),
        });
      }
    },
  });
  const chargesMutation = useDomainMutation(
    'rentalCharge',
    ({ rows, date }) => createRentalCharges(orderId, toChargesPayload(rows, date)),
    { successMessage: t('rental.charges.recorded') },
  );
  const cancelChargeMutation = useDomainMutation(
    'rentalCharge',
    ({ id, reason }) => cancelRentalCharge(id, reason),
    { successMessage: t('rental.charges.cancelled') },
  );
  const invoiceMutation = useDomainMutation(
    'rentalInvoice',
    (date) => createRentalInvoice({ order_id: orderId, issue_date: date || null }),
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
  const canEdit = canWrite && EDITABLE_ORDER_STATUSES.includes(record.status) && !hasInvoice;
  const waitsForReturn = record.has_daily_lines && !PRICED_ORDER_STATUSES.includes(record.status);
  const canInvoice =
    canWrite &&
    INVOICEABLE_ORDER_STATUSES.includes(record.status) &&
    !hasInvoice &&
    !waitsForReturn;
  const isReturned = record.status === ORDER_STATUSES.RETURNED;
  const isOut = OUT_ORDER_STATUSES.includes(record.status);
  const canCharge = canWrite && CHARGEABLE_ORDER_STATUSES.includes(record.status);
  const hasReturns = record.returns.length > 0;

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
            {canWrite && record.status === ORDER_STATUSES.DRAFT && (
              <Button variant="contained" startIcon={<CheckCircle2 size={15} />} onClick={() => setConfirming(true)}>
                {t('rental.orders.actions.confirm')}
              </Button>
            )}
            {canWrite && record.status === ORDER_STATUSES.CONFIRMED && (
              <Button variant="contained" startIcon={<Truck size={15} />} onClick={() => setCheckingOut(true)}>
                {t('rental.orders.actions.checkOut')}
              </Button>
            )}
            {canWrite && isOut && (
              <Button
                variant="contained"
                startIcon={<RotateCcw size={15} />}
                onClick={() => {
                  setReturnRows(emptyReturn(record.lines));
                  setReturnValues(emptyReturnValues());
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
                onClick={() => setIssueDate(todayInDakar())}
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
                <span className="badge b-cancel" style={{ marginInlineStart: 8 }}>
                  {t('rental.orders.lateDays', { count: record.late_days })}
                </span>
              )}
              {record.awaiting_checkout && (
                <span className="badge b-draft" style={{ marginInlineStart: 8 }}>
                  {t('rental.orders.awaitingCheckout')}
                </span>
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
          {record.return_deadline && (
            <div className="r-row">
              <span className="l">{t('rental.orders.returnDeadline')}</span>
              <span className="num">
                {formatDate(record.return_deadline)}
                <span style={{ color: 'var(--muted)' }}>
                  {' · '}
                  {record.return_grace_days === null
                    ? t('rental.orders.graceDefault')
                    : t('rental.orders.graceOrder', { count: record.return_grace_days })}
                </span>
              </span>
            </div>
          )}
          {record.confirmed_at && (
            <div className="r-row">
              <span className="l">{t('rental.orders.confirmedAt')}</span>
              <span className="num">{formatDateTime(record.confirmed_at)}</span>
            </div>
          )}
          {record.checked_out_at && (
            <div className="r-row">
              <span className="l">{t('rental.orders.checkedOutAt')}</span>
              <span className="num">{formatDateTime(record.checked_out_at)}</span>
            </div>
          )}
          {record.returned_at && (
            <div className="r-row">
              <span className="l">{t('rental.orders.returnedAt')}</span>
              <span className="num">
                {formatDateTime(record.returned_at)}
                {isReturned && (
                  <span style={{ color: record.late_days > 0 ? 'var(--neg)' : 'var(--pos)' }}>
                    {' · '}
                    {record.late_days > 0
                      ? t('rental.orders.returnedLate', { count: record.late_days })
                      : t('rental.orders.returnedOnTime')}
                  </span>
                )}
              </span>
            </div>
          )}
          {record.billed_days && (
            <div className="r-row" style={{ alignItems: 'flex-start' }}>
              <span className="l">{t('rental.orders.billedDaysField')}</span>
              <span style={{ textAlign: 'end' }}>
                {t('rental.orders.days', { count: record.billed_days })}
                {record.effective_days && record.effective_days !== record.billed_days && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {t('rental.orders.realDays', { count: record.effective_days })}
                    {record.billed_days_reason && ` · ${record.billed_days_reason}`}
                  </div>
                )}
              </span>
            </div>
          )}
          {record.outstanding_total > 0 && (
            <div className="r-row">
              <span className="l">{t('rental.returns.stillOut')}</span>
              <span className="badge b-closed">
                {t('rental.returns.stillOutCount', { count: record.outstanding_total })}
              </span>
            </div>
          )}
          {record.charges_total > 0 && (
            <div className="r-row">
              <span className="l">{t('rental.charges.title')}</span>
              <Money value={record.charges_total} />
            </div>
          )}
          {waitsForReturn && !hasInvoice && record.status !== ORDER_STATUSES.CANCELLED && (
            <div className="r-row">
              <span className="l" style={{ fontSize: 12 }}>
                {t('rental.orders.invoiceAfterReturn')}
              </span>
            </div>
          )}
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
                {line.line_kind === LINE_KINDS.SERVICE
                  ? t(serviceTypeKey(line.service_type))
                  : line.pricing_mode === PRICING_MODES.PER_DAY
                    ? t('rental.orders.billedDays', { count: line.billed_units })
                    : t(pricingModeKey(line.pricing_mode))}
              </div>
            </td>
            <td className="r num">
              {line.line_kind === LINE_KINDS.SERVICE
                ? t('common.empty.value')
                : `${line.quantity} ${line.unit_name}`}
              {hasReturns && line.line_kind !== LINE_KINDS.SERVICE && line.outstanding > 0 && (
                <div style={{ fontSize: 12, color: 'var(--warn)' }}>
                  {t('rental.returns.stillOutCount', { count: line.outstanding })}
                </div>
              )}
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

      {hasReturns && (
        <>
          <div className="section-title" style={{ marginTop: 22 }}>
            <h2>{t('rental.returns.title')}</h2>
            <div className="line" />
          </div>
          <ReturnsTable returns={record.returns} />
        </>
      )}

      {(record.charges.length > 0 || canCharge) && (
        <>
          <div className="section-title" style={{ marginTop: 22 }}>
            <h2>{t('rental.charges.title')}</h2>
            <div className="line" />
            {canCharge && (
              <Button
                color="inherit"
                size="small"
                startIcon={<Plus size={15} />}
                onClick={() => setCharges({ mode: 'manual', rows: [emptyChargeRow()], date: todayInDakar() })}
              >
                {t('rental.charges.add')}
              </Button>
            )}
          </div>
          <ChargesTable charges={record.charges} onCancel={canWrite ? setChargeToCancel : undefined} />
        </>
      )}

      {charges && (
        <ChargesDialog
          open={Boolean(charges)}
          mode={charges.mode}
          rows={charges.rows}
          onRowsChange={(rows) => setCharges({ ...charges, rows })}
          chargeDate={charges.date}
          onChargeDateChange={(date) => setCharges({ ...charges, date })}
          onSubmit={() => chargesMutation.mutateAsync(charges)}
          onClose={() => setCharges(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(chargeToCancel)}
        title={t('rental.charges.cancelTitle')}
        description={t('rental.charges.cancelDescription')}
        confirmLabel={t('rental.charges.cancel')}
        requireReason
        danger
        onConfirm={(reason) => cancelChargeMutation.mutateAsync({ id: chargeToCancel.id, reason })}
        onClose={() => setChargeToCancel(null)}
      />

      {issueDate !== null && (
        <FormDialog
          open={issueDate !== null}
          title={t('rental.orders.invoiceTitle')}
          submitLabel={t('rental.orders.actions.invoice')}
          submitDisabled={!issueDate}
          onSubmit={() => invoiceMutation.mutateAsync(issueDate)}
          onClose={() => setIssueDate(null)}
          maxWidth="xs"
        >
          <TextField
            label={t('rental.orders.issueDate')}
            type="date"
            value={issueDate}
            onChange={(event) => setIssueDate(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText={t('rental.orders.issueDateHint')}
            required
          />
        </FormDialog>
      )}

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
        onSubmit={(values) => checkOutMutation.mutateAsync(values)}
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
          values={returnValues}
          onValuesChange={setReturnValues}
          checkedOutAt={record.checked_out_at}
          hasDailyLines={record.has_daily_lines && !hasReturns && !hasInvoice}
          plannedDays={record.rental_days}
          onSubmit={() => returnMutation.mutateAsync(toReturnPayload(returnRows, returnValues))}
          onClose={() => setReturnRows(null)}
        />
      )}
    </>
  );
}
