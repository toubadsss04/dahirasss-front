import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Plus, Search } from 'lucide-react';

import AppSelect from '../../components/forms/AppSelect';
import Pager from '../../components/projects/Pager';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../../components/ui';
import { rentalOrderStatusKey } from '../../constants/labels';
import { SEARCH_DEBOUNCE_MS } from '../../constants/projects';
import { KEYS } from '../../constants/queryKeys';
import { ORDER_STATUS_TONES, ORDER_STATUSES, RENTAL_PAGE_SIZE } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePermissions } from '../../hooks/usePermissions';
import { extractErrorMessage } from '../../services/apiClient';
import { fetchRentalOrders } from '../../services/rental.service';
import { formatDate } from '../../utils/format';

/**
 * Purchase orders, newest first, searchable by customer and filterable by
 * status, period, or orders out past their return date.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalOrdersPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [lateOnly, setLateOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const orders = useQuery({
    queryKey: [KEYS.rentalOrders, debouncedSearch, status, lateOnly, offset],
    queryFn: () =>
      fetchRentalOrders({
        search: debouncedSearch || undefined,
        status: status || undefined,
        late: lateOnly || undefined,
        limit: RENTAL_PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = orders.data?.items ?? [];
  const total = orders.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('rental.orders.title')}
        subtitle={t('rental.orders.subtitle', { count: total })}
        actions={
          canWrite && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => navigate(ROUTES.rentalOrderNew)}
            >
              {t('rental.orders.new')}
            </Button>
          )
        }
      />

      <FilterBar>
        <TextField
          placeholder={t('rental.orders.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
          }}
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
          label={t('common.fields.status')}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={Object.values(ORDER_STATUSES).map((value) => ({
            value,
            label: t(rentalOrderStatusKey(value)),
          }))}
          allowEmpty
          sx={{ minWidth: 160 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={lateOnly}
              onChange={(event) => {
                setLateOnly(event.target.checked);
                setOffset(0);
              }}
            />
          }
          label={t('rental.orders.lateOnly')}
        />
      </FilterBar>

      {orders.isLoading && <Loader />}
      {orders.error && <ErrorNote message={extractErrorMessage(orders.error)} />}

      {orders.data && (
        <>
          <DataTable
            columns={[
              { key: 'number', label: t('rental.columns.order') },
              { key: 'customer', label: t('rental.columns.customer') },
              { key: 'period', label: t('rental.columns.period') },
              { key: 'status', label: t('common.fields.status') },
              { key: 'net', label: t('rental.columns.net'), align: 'right' },
            ]}
            rows={rows}
            emptyMessage={t('rental.orders.empty')}
            renderRow={(order) => (
              <tr
                key={order.id}
                className="clickable"
                onClick={() => navigate(buildPath(ROUTES.rentalOrderDetail, { orderId: order.id }))}
              >
                <td className="num">
                  {order.number}
                  {order.invoice_number && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.invoice_number}</div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.event_type}</div>
                </td>
                <td className="num">
                  {formatDate(order.start_date)} → {formatDate(order.end_date)}
                </td>
                <td>
                  <StatusBadge
                    label={t(rentalOrderStatusKey(order.status))}
                    tone={ORDER_STATUS_TONES[order.status]}
                  />
                  {order.is_late && (
                    <div style={{ marginTop: 4 }}>
                      <span className="badge b-cancel">
                        {t('rental.orders.lateDays', { count: order.late_days })}
                      </span>
                    </div>
                  )}
                  {order.awaiting_checkout && (
                    <div style={{ marginTop: 4 }}>
                      <span className="badge b-draft">{t('rental.orders.awaitingCheckout')}</span>
                    </div>
                  )}
                </td>
                <td className="r">
                  <Money value={order.net_total} />
                </td>
              </tr>
            )}
          />
          <Pager total={total} offset={offset} limit={RENTAL_PAGE_SIZE} onChange={setOffset} />
        </>
      )}
    </>
  );
}
