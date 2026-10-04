import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Ban, Pencil, Plus } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import PotLabel from '../components/ui/PotLabel';
import {
  Callout,
  DataTable,
  EmptyState,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { GAMOU_POT, POT_FILTERS } from '../constants/finance';
import { operationStatusKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePotOptions } from '../hooks/usePotOptions';
import { extractErrorMessage } from '../services/apiClient';
import {
  cancelDonation,
  createDonation,
  fetchDonations,
  filterByPot,
  isDonationFormValid,
  potFields,
  potFilterParams,
  toDonationForm,
  toDonationUpdate,
  updateDonation,
} from '../services/finance.service';
import { useExerciseStore } from '../store/exerciseStore';
import { avatarColor, formatDate, initials, todayInDakar } from '../utils/format';
import { amountValue, optionalText } from '../utils/formChanges';

/**
 * Barkelou, the financial gifts.
 *
 * A gift is an income independent from meetings and member contributions. The
 * donor may be external to the Dahira, so the name is a free text field with no
 * link to a member required.
 *
 * A gift goes to a pot: the Gamou of the exercise, or a project. A project
 * tied to this Gamou counts in the exercise too; a gift to a project standing
 * apart only raises that project's balance and is found under the "outside
 * the Gamou" filter. The pot is chosen once.
 *
 * A gift typed wrongly is corrected in the same form, opened from the pencil
 * on its row. The button stays unavailable until something actually changed,
 * and only the changed fields are sent.
 *
 * @returns {JSX.Element} The screen.
 */
export default function DonationsPage() {
  const { t } = useTranslation();
  const selected = useExerciseStore((state) => state.selected());
  const exerciseId = selected?.id;

  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [potFilter, setPotFilter] = useState('');
  const [toCancel, setToCancel] = useState(null);

  const potOptions = usePotOptions(exerciseId, isFormOpen);
  const donations = useQuery({
    queryKey: ['donations', exerciseId, potFilter === POT_FILTERS.APART],
    queryFn: () => fetchDonations({ ...potFilterParams(potFilter, exerciseId), limit: 200 }),
    enabled: Boolean(exerciseId),
  });

  const createMutation = useDomainMutation('donation', createDonation, {
    successMessage: t('donations.created'),
  });
  const cancelMutation = useDomainMutation(
    'donation',
    ({ id, reason }) => cancelDonation(id, reason),
    { successMessage: t('donations.cancelled') },
  );
  const updateMutation = useDomainMutation(
    'donation',
    ({ id, payload }) => updateDonation(id, payload),
    { successMessage: t('donations.updated') },
  );

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('donations.title')} />
        <div className="card">
          <EmptyState message={t('donations.noExercise')} />
        </div>
      </>
    );
  }

  if (donations.isLoading) return <Loader />;
  if (donations.error) return <ErrorNote message={extractErrorMessage(donations.error)} />;

  const rows = filterByPot(donations.data.items, potFilter);
  const total = rows
    .filter((row) => row.status === 'ACTIVE')
    .reduce((sum, row) => sum + row.amount, 0);

  const openForm = () => {
    setEditing(null);
    setInitialForm(null);
    setForm({
      pot: GAMOU_POT,
      donor_name: '',
      amount: '',
      donation_date: todayInDakar(),
      comment: '',
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    const initial = toDonationForm(row);
    setEditing(row);
    setInitialForm(initial);
    setForm(initial);
    setFormOpen(true);
  };

  const isFormValid =
    Boolean(form) && isDonationFormValid(form);
  const donationUpdate = editing && form ? toDonationUpdate(initialForm, form) : {};
  const canSubmit = editing
    ? isFormValid && Object.keys(donationUpdate).length > 0
    : isFormValid;

  const submitForm = () =>
    editing
      ? updateMutation.mutateAsync({ id: editing.id, payload: donationUpdate })
      : createMutation.mutateAsync({
          ...potFields(form.pot, exerciseId),
          donor_name: form.donor_name.trim(),
          amount: amountValue(form.amount),
          donation_date: form.donation_date,
          comment: optionalText(form.comment),
        });

  return (
    <>
      <PageHeader
        title={t('donations.title')}
        subtitle={`${selected.name} · ${t('donations.subtitle', { count: rows.length })}`}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openForm}>
            {t('donations.add')}
          </Button>
        }
      />

      <Callout>
        <Trans i18nKey="donations.notice" components={{ b: <b /> }} />{' '}
        {t('donations.activeTotal')} <b>{<Money value={total} />}</b>
      </Callout>

      <FilterBar>
        <AppSelect
          value={potFilter}
          onChange={setPotFilter}
          options={[
            { value: POT_FILTERS.GAMOU, label: t('pots.filters.gamou') },
            { value: POT_FILTERS.PROJECTS, label: t('pots.filters.projects') },
            { value: POT_FILTERS.APART, label: t('pots.filters.apart') },
          ]}
          allowEmpty
          placeholder={t('pots.filters.all')}
          sx={{ minWidth: 200 }}
        />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'donor', label: t('donations.columns.donor') },
          { key: 'date', label: t('donations.columns.date') },
          { key: 'daara', label: t('donations.columns.scope') },
          { key: 'comment', label: t('donations.columns.comment') },
          { key: 'status', label: t('donations.columns.status') },
          { key: 'amount', label: t('donations.columns.amount'), align: 'right' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={rows}
        emptyMessage={t('donations.empty')}
        renderRow={(row) => {
          const cancelled = row.status === 'CANCELLED';
          return (
            <tr key={row.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      background: avatarColor(row.donor_name),
                      flex: '0 0 auto',
                    }}
                  >
                    {initials(row.donor_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.donor_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {row.is_external
                        ? t('donations.externalDonor')
                        : t('donations.memberDonor')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="num">{formatDate(row.donation_date)}</td>
              <td>
                <PotLabel operation={row} />
              </td>
              <td>{row.comment || t('common.empty.value')}</td>
              <td>
                <StatusBadge
                  label={t(operationStatusKey(row.status))}
                  tone={cancelled ? 'cancel' : 'open'}
                />
              </td>
              <td className="r">
                <Money value={row.amount} tone={!cancelled} strike={cancelled} />
              </td>
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
                    <Tooltip title={t('common.actions.edit')}>
                      <IconButton
                        size="small"
                        aria-label={t('common.actions.edit')}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Ban size={14} />}
                      onClick={() => setToCancel(row)}
                    >
                      {t('common.actions.cancel')}
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          );
        }}
      />

      {form && (
        <FormDialog
          open={isFormOpen}
          title={editing ? t('donations.form.editTitle') : t('donations.form.title')}
          submitLabel={editing ? t('common.actions.edit') : t('common.actions.save')}
          submitDisabled={!canSubmit}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        >
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <PotLabel operation={editing} />
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {t('pots.locked')}
              </span>
            </div>
          ) : (
            <AppSelect
              label={t('pots.field')}
              value={form.pot}
              onChange={(value) => setForm({ ...form, pot: value })}
              options={potOptions}
              fullWidth
            />
          )}
          <TextField
            label={t('donations.form.donor')}
            value={form.donor_name}
            onChange={(event) => setForm({ ...form, donor_name: event.target.value })}
            helperText={t('donations.form.donorHint')}
            size="small"
            autoFocus
            required
          />
          <TextField
            label={t('common.fields.amount')}
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value.replace(/[^0-9]/g, '') })
            }
            size="small"
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            required
          />
          <TextField
            label={t('common.fields.date')}
            type="date"
            value={form.donation_date}
            onChange={(event) => setForm({ ...form, donation_date: event.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('common.fields.comment')}
            value={form.comment}
            onChange={(event) => setForm({ ...form, comment: event.target.value })}
            size="small"
            multiline
            minRows={2}
          />
        </FormDialog>
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('donations.confirmCancel.title')}
        description={t('donations.confirmCancel.body', { name: toCancel?.donor_name })}
        confirmLabel={t('donations.confirmCancel.confirm')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync({ id: toCancel.id, reason })}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
