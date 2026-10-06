import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { ChevronLeft } from 'lucide-react';

import MemberPicker from '../../components/forms/MemberPicker';
import DocumentTotals from '../../components/rental/DocumentTotals';
import OrderLinesEditor from '../../components/rental/OrderLinesEditor';
import { ErrorNote, Loader, PageHeader } from '../../components/ui';
import { KEYS } from '../../constants/queryKeys';
import { CUSTOMER_KINDS, LINE_KINDS, MAX_GRACE_DAYS } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { extractErrorMessage } from '../../services/apiClient';
import {
  createRentalOrder,
  emptyOrderForm,
  fetchRentalArticleOptions,
  fetchRentalMemberOptions,
  fetchRentalOrder,
  fetchRentalSettings,
  isOrderFormValid,
  lineMode,
  orderToForm,
  priceLine,
  priceOrder,
  rentalDays,
  toOrderPayload,
  updateRentalOrder,
} from '../../services/rental.service';

/**
 * Writing of a purchase order, new or still open to changes.
 *
 * The customer is a member of the Dahira or someone from outside. Each line
 * shows what is free over the period, and the totals follow what is typed,
 * computed the way the server will store them. Per-day lines are priced on
 * the planned days here and again on the real days at return. The grace days
 * left empty take the default of the rental settings.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalOrderFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const isEditing = Boolean(orderId);
  const [form, setForm] = useState(isEditing ? null : emptyOrderForm);
  const [error, setError] = useState('');

  const members = useQuery({ queryKey: [KEYS.rentalMemberOptions], queryFn: fetchRentalMemberOptions });
  const settings = useQuery({ queryKey: [KEYS.rentalSettings], queryFn: fetchRentalSettings });
  const order = useQuery({
    queryKey: [KEYS.rentalOrder, orderId],
    queryFn: () => fetchRentalOrder(orderId),
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && !form && order.data && members.data) {
      setForm(orderToForm(order.data, members.data));
    }
  }, [isEditing, form, order.data, members.data]);

  const hasPeriod = Boolean(form?.startDate && form?.endDate && form.endDate >= form.startDate);
  const articles = useQuery({
    queryKey: [KEYS.rentalArticleOptions, form?.startDate, form?.endDate, orderId],
    queryFn: () =>
      fetchRentalArticleOptions({
        start_date: hasPeriod ? form.startDate : undefined,
        end_date: hasPeriod ? form.endDate : undefined,
        order_id: orderId,
      }),
    enabled: Boolean(form),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useDomainMutation(
    'rentalOrder',
    (payload) => (isEditing ? updateRentalOrder(orderId, payload) : createRentalOrder(payload)),
    {
      successMessage: isEditing ? t('rental.orders.updated') : t('rental.orders.created'),
      onSuccess: (saved) =>
        navigate(buildPath(ROUTES.rentalOrderDetail, { orderId: saved.id }), { replace: true }),
    },
  );

  if (isEditing && (order.isLoading || members.isLoading)) return <Loader />;
  if (order.error) return <ErrorNote message={extractErrorMessage(order.error)} />;
  if (!form) return <Loader />;

  const articleList = articles.data ?? [];
  const byId = new Map(articleList.map((article) => [article.id, article]));
  const days = rentalDays(form.startDate, form.endDate);
  const priced = form.lines
    .map((line) => {
      if (line.kind === LINE_KINDS.SERVICE) {
        return priceLine(
          { ...line, quantity: 1, discount: '', unitPrice: line.unitPrice || 0 },
          lineMode(line),
          days,
        );
      }
      const article = byId.get(line.articleId);
      if (!article) return null;
      const unitPrice = line.unitPrice !== '' ? line.unitPrice : (article.price ?? 0);
      return priceLine({ ...line, unitPrice }, lineMode(line, article), days);
    })
    .filter(Boolean);
  const totals = priceOrder(priced, form.discount);
  const canSubmit = isOrderFormValid(form, byId) && !saveMutation.isPending;
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      await saveMutation.mutateAsync(toOrderPayload(form));
    } catch (submitError) {
      setError(extractErrorMessage(submitError, 'errors.saveFailed'));
    }
  };

  const back = isEditing
    ? buildPath(ROUTES.rentalOrderDetail, { orderId })
    : ROUTES.rentalOrders;

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" className="back" onClick={() => navigate(back)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('rental.orders.back')}
      </button>

      <PageHeader
        title={isEditing ? t('rental.orders.editTitle', { number: order.data.number }) : t('rental.orders.newTitle')}
        subtitle={days ? t('rental.orders.days', { count: days }) : undefined}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div className="section-title">
        <h2>{t('rental.orders.customerTitle')}</h2>
        <div className="line" />
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 22, display: 'grid', gap: 14 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={form.customerKind}
          onChange={(_, value) => value && setForm({ ...form, customerKind: value })}
        >
          <ToggleButton value={CUSTOMER_KINDS.MEMBER}>{t('rental.orders.kindMember')}</ToggleButton>
          <ToggleButton value={CUSTOMER_KINDS.EXTERNAL}>{t('rental.orders.kindExternal')}</ToggleButton>
        </ToggleButtonGroup>
        <div className="form-grid">
          {form.customerKind === CUSTOMER_KINDS.MEMBER ? (
            <MemberPicker
              members={members.data ?? []}
              value={form.member}
              onChange={(member) =>
                setForm({ ...form, member, customerPhone: member?.phone ?? '' })
              }
              disabled={members.isLoading}
              label={t('rental.orders.member')}
              showDaara
            />
          ) : (
            <TextField
              label={t('rental.orders.customerName')}
              value={form.customerName}
              onChange={set('customerName')}
              size="small"
              required
            />
          )}
          <TextField
            label={t('common.fields.phone')}
            value={form.customerPhone}
            onChange={set('customerPhone')}
            size="small"
            helperText={
              form.customerKind === CUSTOMER_KINDS.MEMBER && form.member?.phone
                ? t('rental.orders.phoneHint')
                : undefined
            }
          />
        </div>
      </div>

      <div className="section-title">
        <h2>{t('rental.orders.eventTitle')}</h2>
        <div className="line" />
      </div>
      <div className="card form-grid" style={{ padding: 16, marginBottom: 22 }}>
        <TextField
          label={t('rental.orders.eventType')}
          value={form.eventType}
          onChange={set('eventType')}
          size="small"
          placeholder={t('rental.orders.eventTypeHint')}
          required
        />
        <TextField
          label={t('rental.orders.startDate')}
          type="date"
          value={form.startDate}
          onChange={set('startDate')}
          size="small"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label={t('rental.orders.endDate')}
          type="date"
          value={form.endDate}
          onChange={set('endDate')}
          size="small"
          InputLabelProps={{ shrink: true }}
          error={Boolean(form.startDate && form.endDate) && form.endDate < form.startDate}
          helperText={t('rental.orders.endDateHint')}
          required
        />
        <TextField
          label={t('rental.orders.globalDiscount')}
          value={form.discount}
          onChange={set('discount')}
          size="small"
          type="number"
          inputProps={{ min: 0, max: 100, step: 0.5 }}
        />
        <TextField
          label={t('rental.orders.graceDays')}
          value={form.graceDays}
          onChange={set('graceDays')}
          size="small"
          type="number"
          inputProps={{ min: 0, max: MAX_GRACE_DAYS, step: 1 }}
          placeholder={
            settings.data ? String(settings.data.default_return_grace_days) : undefined
          }
          InputLabelProps={{ shrink: true }}
          helperText={t('rental.orders.graceHint', {
            count: settings.data?.default_return_grace_days ?? 0,
          })}
        />
        <TextField
          label={t('rental.orders.remarks')}
          value={form.remarks}
          onChange={set('remarks')}
          size="small"
          multiline
          minRows={2}
          sx={{ gridColumn: '1 / -1' }}
        />
      </div>

      <div className="section-title">
        <h2>{t('rental.orders.linesTitle')}</h2>
        <div className="line" />
      </div>
      {articles.error && <ErrorNote message={extractErrorMessage(articles.error)} />}
      <div style={{ marginBottom: 22 }}>
        <OrderLinesEditor
          lines={form.lines}
          onChange={(lines) => setForm({ ...form, lines })}
          articles={articleList}
          days={days}
        />
      </div>

      <div style={{ maxWidth: 420, marginInlineStart: 'auto', marginBottom: 22 }}>
        <DocumentTotals gross={totals.gross} discount={totals.discount} net={totals.net} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button color="inherit" onClick={() => navigate(back)}>
          {t('common.actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!canSubmit}
          startIcon={saveMutation.isPending ? <CircularProgress size={15} color="inherit" /> : null}
        >
          {isEditing ? t('common.actions.save') : t('rental.orders.saveDraft')}
        </Button>
      </div>
    </form>
  );
}
