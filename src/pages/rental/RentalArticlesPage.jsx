import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { Plus, Search } from 'lucide-react';

import AppSelect from '../../components/forms/AppSelect';
import Pager from '../../components/projects/Pager';
import ArticleFormDialog from '../../components/rental/ArticleFormDialog';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../../components/ui';
import { pricingModeKey } from '../../constants/labels';
import { SEARCH_DEBOUNCE_MS } from '../../constants/projects';
import { KEYS } from '../../constants/queryKeys';
import { ARTICLE_SORTS, RENTAL_PAGE_SIZE } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import {
  createRentalArticle,
  emptyArticleForm,
  fetchRentalArticles,
  fetchRentalCategories,
  fetchRentalUnits,
  isArticleFormValid,
  toArticlePayload,
} from '../../services/rental.service';

/** Choices of the active filter, sent to the API as a boolean. */
const ACTIVE_FILTERS = { ACTIVE: 'true', INACTIVE: 'false' };

/**
 * Catalogue of the rental business, with what is in stock for each article.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalArticlesPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(ACTIVE_FILTERS.ACTIVE);
  const [sort, setSort] = useState('name');
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const categories = useQuery({ queryKey: [KEYS.rentalCategories], queryFn: fetchRentalCategories });
  const units = useQuery({ queryKey: [KEYS.rentalUnits], queryFn: fetchRentalUnits });
  const articles = useQuery({
    queryKey: [KEYS.rentalArticles, debouncedSearch, categoryFilter, activeFilter, sort, offset],
    queryFn: () =>
      fetchRentalArticles({
        search: debouncedSearch || undefined,
        category_id: categoryFilter || undefined,
        is_active: activeFilter || undefined,
        sort,
        limit: RENTAL_PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useDomainMutation('rentalCatalog', createRentalArticle, {
    successMessage: t('rental.articles.created'),
    onSuccess: (article) =>
      navigate(buildPath(ROUTES.rentalArticleDetail, { articleId: article.id })),
  });

  const categoryOptions = (categories.data ?? [])
    .filter((category) => category.is_active)
    .map((category) => ({ value: category.id, label: category.name }));
  const unitOptions = (units.data ?? [])
    .filter((unit) => unit.is_active)
    .map((unit) => ({ value: unit.id, label: unit.name }));
  const resetTo = (setter) => (value) => {
    setter(value);
    setOffset(0);
  };

  const rows = articles.data?.items ?? [];
  const total = articles.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('rental.articles.title')}
        subtitle={t('rental.articles.subtitle', { count: total })}
        actions={
          canWrite && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setForm(emptyArticleForm(unitOptions[0]?.value ?? ''))}
            >
              {t('rental.articles.new')}
            </Button>
          )
        }
      />

      <FilterBar>
        <TextField
          placeholder={t('rental.articles.search')}
          value={search}
          onChange={(event) => resetTo(setSearch)(event.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={15} />
              </InputAdornment>
            ),
          }}
        />
        <AppSelect
          label={t('rental.articles.fields.category')}
          value={categoryFilter}
          onChange={resetTo(setCategoryFilter)}
          options={(categories.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          allowEmpty
          sx={{ minWidth: 170 }}
        />
        <AppSelect
          label={t('rental.articles.status')}
          value={activeFilter}
          onChange={resetTo(setActiveFilter)}
          options={[
            { value: ACTIVE_FILTERS.ACTIVE, label: t('rental.articles.active') },
            { value: ACTIVE_FILTERS.INACTIVE, label: t('rental.articles.inactive') },
          ]}
          allowEmpty
          sx={{ minWidth: 140 }}
        />
        <AppSelect
          label={t('rental.articles.sort')}
          value={sort}
          onChange={resetTo(setSort)}
          options={ARTICLE_SORTS.map((value) => ({
            value,
            label: t(`rental.articles.sorts.${value}`),
          }))}
          sx={{ minWidth: 150 }}
        />
      </FilterBar>

      {articles.isLoading && <Loader />}
      {articles.error && <ErrorNote message={extractErrorMessage(articles.error)} />}

      {articles.data && (
        <>
          <DataTable
            columns={[
              { key: 'name', label: t('rental.columns.article') },
              { key: 'category', label: t('rental.articles.fields.category') },
              { key: 'price', label: t('rental.articles.fields.price'), align: 'right' },
              { key: 'owned', label: t('rental.stock.owned'), align: 'right' },
              { key: 'free', label: t('rental.stock.freeNow'), align: 'right' },
              { key: 'out', label: t('rental.stock.out'), align: 'right' },
              { key: 'damaged', label: t('rental.stock.unusable'), align: 'right' },
            ]}
            rows={rows}
            emptyMessage={t('rental.articles.empty')}
            renderRow={(article) => (
              <tr
                key={article.id}
                className="clickable"
                onClick={() =>
                  navigate(buildPath(ROUTES.rentalArticleDetail, { articleId: article.id }))
                }
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{article.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {[article.reference, article.unit_name].filter(Boolean).join(' · ')}
                  </div>
                  {!article.is_active && (
                    <StatusBadge label={t('rental.articles.inactive')} tone="inactive" />
                  )}
                </td>
                <td>{article.category_name ?? t('common.empty.value')}</td>
                <td className="r">
                  {article.price === null ? (
                    t('rental.articles.priceOnRequest')
                  ) : (
                    <>
                      <Money value={article.price} />
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t(pricingModeKey(article.pricing_mode))}
                      </div>
                    </>
                  )}
                </td>
                <td className="r num">{article.stock.owned}</td>
                <td className="r num">{article.stock.free_now}</td>
                <td className="r num">{article.stock.out}</td>
                <td className="r num">{article.stock.damaged + article.stock.in_repair}</td>
              </tr>
            )}
          />
          <Pager total={total} offset={offset} limit={RENTAL_PAGE_SIZE} onChange={setOffset} />
        </>
      )}

      {form && (
        <ArticleFormDialog
          open={Boolean(form)}
          form={form}
          onChange={setForm}
          categoryOptions={categoryOptions}
          unitOptions={unitOptions}
          submitDisabled={!isArticleFormValid(form)}
          onSubmit={() => createMutation.mutateAsync(toArticlePayload(form))}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}
