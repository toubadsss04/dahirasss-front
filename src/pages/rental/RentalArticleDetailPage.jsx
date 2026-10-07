import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import { ArrowLeftRight, ChevronLeft, Pencil, Trash2 } from 'lucide-react';

import Pager from '../../components/projects/Pager';
import ArticleFormDialog from '../../components/rental/ArticleFormDialog';
import StockMovementDialog from '../../components/rental/StockMovementDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DataTable, ErrorNote, Loader, Money, PageHeader, StatusBadge } from '../../components/ui';
import { pricingModeKey, stockMovementKey } from '../../constants/labels';
import { KEYS } from '../../constants/queryKeys';
import { MANUAL_MOVEMENTS, RENTAL_PAGE_SIZE } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import {
  articleToForm,
  createRentalMovement,
  deleteRentalArticle,
  fetchRentalArticle,
  fetchRentalCategories,
  fetchRentalMovements,
  fetchRentalUnits,
  isArticleFormValid,
  toArticlePayload,
  updateRentalArticle,
} from '../../services/rental.service';
import { formatDate, todayInDakar } from '../../utils/format';

/** Stock buckets shown on the article, in reading order. */
const STOCK_BUCKETS = ['owned', 'available', 'reserved', 'free_now', 'out', 'damaged', 'in_repair', 'retired', 'lost'];

/**
 * One article: its terms, where its units stand, and every stock movement.
 *
 * Quantities only change through movements, so the stock always has a
 * history explaining it. An article already used can be switched off but
 * not deleted.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalArticleDetailPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [form, setForm] = useState(null);
  const [movement, setMovement] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [offset, setOffset] = useState(0);

  const article = useQuery({
    queryKey: [KEYS.rentalArticle, articleId],
    queryFn: () => fetchRentalArticle(articleId),
  });
  const movements = useQuery({
    queryKey: [KEYS.rentalMovements, articleId, offset],
    queryFn: () => fetchRentalMovements(articleId, { limit: RENTAL_PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({
    queryKey: [KEYS.rentalCategories],
    queryFn: fetchRentalCategories,
    enabled: Boolean(form),
  });
  const units = useQuery({
    queryKey: [KEYS.rentalUnits],
    queryFn: fetchRentalUnits,
    enabled: Boolean(form),
  });

  const updateMutation = useDomainMutation(
    'rentalCatalog',
    (payload) => updateRentalArticle(articleId, payload),
    { successMessage: t('rental.articles.updated') },
  );
  const movementMutation = useDomainMutation(
    'rentalStock',
    (payload) => createRentalMovement(articleId, payload),
    { successMessage: t('rental.stock.recorded') },
  );
  const deleteMutation = useDomainMutation('rentalCatalog', () => deleteRentalArticle(articleId), {
    successMessage: t('rental.articles.deleted'),
    onSuccess: () => navigate(ROUTES.rentalArticles, { replace: true }),
  });

  if (article.isLoading) return <Loader />;
  if (article.error) return <ErrorNote message={extractErrorMessage(article.error)} />;

  const record = article.data;
  const keepCurrent = (items, currentId) =>
    (items ?? [])
      .filter((item) => item.is_active || item.id === currentId)
      .map((item) => ({ value: item.id, label: item.name }));

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.rentalArticles)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('rental.articles.back')}
      </button>

      <PageHeader
        title={record.name}
        subtitle={[record.reference, record.category_name, record.unit_name]
          .filter(Boolean)
          .join(' · ')}
        actions={
          canWrite && (
            <>
              <Button
                variant="contained"
                startIcon={<ArrowLeftRight size={15} />}
                onClick={() =>
                  setMovement({ type: MANUAL_MOVEMENTS[0], quantity: '', date: todayInDakar(), reason: '' })
                }
              >
                {t('rental.stock.record')}
              </Button>
              <Button color="inherit" startIcon={<Pencil size={15} />} onClick={() => setForm(articleToForm(record))}>
                {t('common.actions.edit')}
              </Button>
              {!record.is_used && (
                <Button color="inherit" startIcon={<Trash2 size={15} />} onClick={() => setDeleting(true)}>
                  {t('common.actions.delete')}
                </Button>
              )}
            </>
          )
        }
      />

      <div className="recap-pair" style={{ marginBottom: 22 }}>
        <div className="card recap">
          <div className="r-row">
            <span className="l">{t('rental.articles.fields.price')}</span>
            {record.price === null ? (
              <span>{t('rental.articles.priceOnRequest')}</span>
            ) : (
              <Money value={record.price} />
            )}
          </div>
          {record.replacement_price !== null && record.replacement_price !== undefined && (
            <div className="r-row">
              <span className="l">{t('rental.articles.fields.replacementPrice')}</span>
              <Money value={record.replacement_price} />
            </div>
          )}
          <div className="r-row">
            <span className="l">{t('rental.articles.fields.pricingMode')}</span>
            <span>{t(pricingModeKey(record.pricing_mode))}</span>
          </div>
          <div className="r-row">
            <span className="l">{t('rental.articles.status')}</span>
            <StatusBadge
              label={record.is_active ? t('rental.articles.active') : t('rental.articles.inactive')}
              tone={record.is_active ? 'active' : 'inactive'}
            />
          </div>
          {record.description && (
            <div className="r-row">
              <span className="l">{record.description}</span>
            </div>
          )}
        </div>
        <div className="card recap">
          {STOCK_BUCKETS.map((bucket) => (
            <div className={bucket === 'free_now' ? 'r-row grand' : 'r-row'} key={bucket}>
              <span className="l">{t(`rental.stock.buckets.${bucket}`)}</span>
              <b className="num">
                {record.stock[bucket]} {record.unit_name}
              </b>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">
        <h2>{t('rental.stock.historyTitle')}</h2>
        <div className="line" />
      </div>
      {movements.error && <ErrorNote message={extractErrorMessage(movements.error)} />}
      {movements.data && (
        <>
          <DataTable
            columns={[
              { key: 'date', label: t('rental.columns.date') },
              { key: 'type', label: t('rental.stock.type') },
              { key: 'quantity', label: t('rental.columns.quantity'), align: 'right' },
              { key: 'reason', label: t('common.fields.reason') },
            ]}
            rows={movements.data.items}
            emptyMessage={t('rental.stock.historyEmpty')}
            renderRow={(row) => (
              <tr key={row.id}>
                <td className="num">{formatDate(row.movement_date)}</td>
                <td>
                  {t(stockMovementKey(row.movement_type))}
                  {row.order_number && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() =>
                          navigate(buildPath(ROUTES.rentalOrderDetail, { orderId: row.order_id }))
                        }
                      >
                        {row.order_number}
                      </button>
                    </div>
                  )}
                </td>
                <td className="r num">{row.quantity}</td>
                <td>
                  {row.reason ?? t('common.empty.value')}
                  {row.created_by_name && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {t('common.recordedBy', { name: row.created_by_name })}
                    </div>
                  )}
                </td>
              </tr>
            )}
          />
          <Pager
            total={movements.data.total}
            offset={offset}
            limit={RENTAL_PAGE_SIZE}
            onChange={setOffset}
          />
        </>
      )}

      {form && (
        <ArticleFormDialog
          open={Boolean(form)}
          editing
          form={form}
          onChange={setForm}
          categoryOptions={keepCurrent(categories.data, record.category_id)}
          unitOptions={keepCurrent(units.data, record.unit_id)}
          submitDisabled={!isArticleFormValid(form)}
          onSubmit={() => updateMutation.mutateAsync(toArticlePayload(form, true))}
          onClose={() => setForm(null)}
        />
      )}

      {movement && (
        <StockMovementDialog
          open={Boolean(movement)}
          articleName={record.name}
          form={movement}
          onChange={setMovement}
          onSubmit={() =>
            movementMutation.mutateAsync({
              movement_type: movement.type,
              quantity: Number(movement.quantity),
              movement_date: movement.date || null,
              reason: movement.reason.trim() || null,
            })
          }
          onClose={() => setMovement(null)}
        />
      )}

      <ConfirmDialog
        open={isDeleting}
        title={t('rental.articles.deleteTitle')}
        description={t('rental.articles.deleteDescription', { name: record.name })}
        confirmLabel={t('common.actions.delete')}
        danger
        onConfirm={() => deleteMutation.mutateAsync()}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
