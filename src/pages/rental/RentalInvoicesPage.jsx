import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Search } from 'lucide-react';

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
import { rentalInvoiceStatusKey } from '../../constants/labels';
import { SEARCH_DEBOUNCE_MS } from '../../constants/projects';
import { KEYS } from '../../constants/queryKeys';
import { INVOICE_STATUSES, RENTAL_PAGE_SIZE } from '../../constants/rental';
import { buildPath, ROUTES } from '../../constants/routes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractErrorMessage } from '../../services/apiClient';
import { fetchRentalInvoices } from '../../services/rental.service';
import { formatDate } from '../../utils/format';

/**
 * Invoices, newest first, with what each still awaits. An invoice is drawn
 * from its purchase order, so there is no way to create one from here.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalInvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(INVOICE_STATUSES.ISSUED);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const invoices = useQuery({
    queryKey: [KEYS.rentalInvoices, debouncedSearch, status, unpaidOnly, offset],
    queryFn: () =>
      fetchRentalInvoices({
        search: debouncedSearch || undefined,
        status: status || undefined,
        unpaid: unpaidOnly || undefined,
        limit: RENTAL_PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = invoices.data?.items ?? [];
  const total = invoices.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('rental.invoices.title')}
        subtitle={t('rental.invoices.subtitle', { count: total })}
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
          options={Object.values(INVOICE_STATUSES).map((value) => ({
            value,
            label: t(rentalInvoiceStatusKey(value)),
          }))}
          allowEmpty
          sx={{ minWidth: 150 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={unpaidOnly}
              onChange={(event) => {
                setUnpaidOnly(event.target.checked);
                setOffset(0);
              }}
            />
          }
          label={t('rental.invoices.unpaidOnly')}
        />
      </FilterBar>

      {invoices.isLoading && <Loader />}
      {invoices.error && <ErrorNote message={extractErrorMessage(invoices.error)} />}

      {invoices.data && (
        <>
          <DataTable
            columns={[
              { key: 'number', label: t('rental.columns.invoice') },
              { key: 'customer', label: t('rental.columns.customer') },
              { key: 'date', label: t('rental.columns.date') },
              { key: 'net', label: t('rental.columns.net'), align: 'right' },
              { key: 'balance', label: t('rental.columns.balance'), align: 'right' },
            ]}
            rows={rows}
            emptyMessage={t('rental.invoices.empty')}
            renderRow={(invoice) => {
              const cancelled = invoice.status === INVOICE_STATUSES.CANCELLED;
              return (
                <tr
                  key={invoice.id}
                  className="clickable"
                  onClick={() =>
                    navigate(buildPath(ROUTES.rentalInvoiceDetail, { invoiceId: invoice.id }))
                  }
                >
                  <td className="num">
                    {invoice.number}
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.order_number}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{invoice.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.event_type}</div>
                    {cancelled && (
                      <StatusBadge label={t(rentalInvoiceStatusKey(invoice.status))} tone="cancel" />
                    )}
                  </td>
                  <td className="num">{formatDate(invoice.issue_date)}</td>
                  <td className="r">
                    <Money value={invoice.net_total} strike={cancelled} />
                  </td>
                  <td className="r">
                    <Money value={invoice.balance} />
                  </td>
                </tr>
              );
            }}
          />
          <Pager total={total} offset={offset} limit={RENTAL_PAGE_SIZE} onChange={setOffset} />
        </>
      )}
    </>
  );
}
