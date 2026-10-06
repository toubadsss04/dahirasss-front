import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormDialog from '../../components/ui/FormDialog';
import { DataTable, ErrorNote, Loader, PageHeader, StatusBadge } from '../../components/ui';
import { KEYS } from '../../constants/queryKeys';
import { MAX_GRACE_DAYS } from '../../constants/rental';
import { usePermissions } from '../../hooks/usePermissions';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { extractErrorMessage } from '../../services/apiClient';
import {
  createRentalCategory,
  createRentalUnit,
  deleteRentalCategory,
  deleteRentalUnit,
  fetchRentalCategories,
  fetchRentalSettings,
  fetchRentalUnits,
  updateRentalCategory,
  updateRentalSettings,
  updateRentalUnit,
} from '../../services/rental.service';
import {
  createRentalExpenseCategory,
  deleteRentalExpenseCategory,
  fetchRentalExpenseCategories,
  updateRentalExpenseCategory,
} from '../../services/rental-cash.service';
import { optionalText, requiredText } from '../../utils/formChanges';

/**
 * How each list of the settings reads and writes: article categories carry
 * a description, units a symbol, expense categories a name alone. countField
 * is what a row still holds; a row holding nothing may be deleted.
 */
const KINDS = {
  category: {
    extraField: 'description',
    countField: 'articles_count',
    countLabel: 'rental.settings.articlesCount',
    minName: 2,
    domain: 'rentalCatalog',
    fetch: fetchRentalCategories,
    key: KEYS.rentalCategories,
    create: createRentalCategory,
    update: updateRentalCategory,
    remove: deleteRentalCategory,
  },
  unit: {
    extraField: 'symbol',
    countField: 'articles_count',
    countLabel: 'rental.settings.articlesCount',
    minName: 1,
    domain: 'rentalCatalog',
    fetch: fetchRentalUnits,
    key: KEYS.rentalUnits,
    create: createRentalUnit,
    update: updateRentalUnit,
    remove: deleteRentalUnit,
  },
  expenseCategory: {
    extraField: null,
    countField: 'expenses_count',
    countLabel: 'rental.settings.expensesCount',
    minName: 2,
    domain: 'rentalCash',
    fetch: fetchRentalExpenseCategories,
    key: KEYS.rentalExpenseCategories,
    create: createRentalExpenseCategory,
    update: updateRentalExpenseCategory,
    remove: deleteRentalExpenseCategory,
  },
};

/**
 * Settings of the rental business: the categories articles are filed under,
 * the units they are counted in and the categories of expenses. All are
 * created here, never fixed in code. One still used can be switched off but
 * not deleted.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalSettingsPage() {
  const { t } = useTranslation();
  const { isSuperAdmin, canWrite } = usePermissions();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [grace, setGrace] = useState(null);

  const settings = useQuery({ queryKey: [KEYS.rentalSettings], queryFn: fetchRentalSettings });
  const settingsMutation = useDomainMutation(
    'rentalSettings',
    (days) => updateRentalSettings({ default_return_grace_days: days }),
    { successMessage: t('rental.settings.saved') },
  );
  const graceNumber = Number(grace);
  const graceValid =
    grace !== null && grace !== '' && Number.isInteger(graceNumber) && graceNumber >= 0 &&
    graceNumber <= MAX_GRACE_DAYS;

  const categories = useQuery({ queryKey: [KINDS.category.key], queryFn: KINDS.category.fetch });
  const units = useQuery({ queryKey: [KINDS.unit.key], queryFn: KINDS.unit.fetch });
  const expenseCategories = useQuery({
    queryKey: [KINDS.expenseCategory.key],
    queryFn: KINDS.expenseCategory.fetch,
  });

  const save = ({ kind, id, payload }) =>
    id ? KINDS[kind].update(id, payload) : KINDS[kind].create(payload);
  const saveCatalogMutation = useDomainMutation('rentalCatalog', save, {
    successMessage: t('rental.settings.saved'),
  });
  const saveCashMutation = useDomainMutation('rentalCash', save, {
    successMessage: t('rental.settings.saved'),
  });
  const remove = ({ kind, id }) => KINDS[kind].remove(id);
  const deleteCatalogMutation = useDomainMutation('rentalCatalog', remove, {
    successMessage: t('rental.settings.deleted'),
  });
  const deleteCashMutation = useDomainMutation('rentalCash', remove, {
    successMessage: t('rental.settings.deleted'),
  });
  const mutationsOf = (kind) =>
    KINDS[kind].domain === 'rentalCash'
      ? { save: saveCashMutation, remove: deleteCashMutation }
      : { save: saveCatalogMutation, remove: deleteCatalogMutation };

  const open = (kind, item = null) =>
    setEditing({
      kind,
      id: item?.id ?? null,
      name: item?.name ?? '',
      extra: KINDS[kind].extraField ? (item?.[KINDS[kind].extraField] ?? '') : '',
      isActive: item?.is_active ?? true,
    });

  const submit = () => {
    const { kind, id } = editing;
    const { extraField } = KINDS[kind];
    const payload = {
      name: requiredText(editing.name),
      ...(extraField ? { [extraField]: optionalText(editing.extra) } : {}),
      ...(id ? { is_active: editing.isActive } : {}),
    };
    return mutationsOf(kind).save.mutateAsync({ kind, id, payload });
  };

  const section = (kind, query) => (
    <div style={{ marginBottom: 26 }}>
      <div className="section-title">
        <h2>{t(`rental.settings.${kind}.title`)}</h2>
        <div className="line" />
        {canWrite && (
          <Button size="small" startIcon={<Plus size={15} />} onClick={() => open(kind)}>
            {t(`rental.settings.${kind}.new`)}
          </Button>
        )}
      </div>
      {query.isLoading && <Loader />}
      {query.error && <ErrorNote message={extractErrorMessage(query.error)} />}
      {query.data && (
        <DataTable
          columns={[
            { key: 'name', label: t('common.fields.name') },
            { key: 'count', label: t(KINDS[kind].countLabel), align: 'right' },
            { key: 'status', label: t('common.fields.status') },
            { key: 'actions', label: '', align: 'right' },
          ]}
          rows={query.data}
          emptyMessage={t(`rental.settings.${kind}.empty`)}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {KINDS[kind].extraField && item[KINDS[kind].extraField] && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {item[KINDS[kind].extraField]}
                  </div>
                )}
              </td>
              <td className="r num">{item[KINDS[kind].countField]}</td>
              <td>
                <StatusBadge
                  label={item.is_active ? t('rental.articles.active') : t('rental.articles.inactive')}
                  tone={item.is_active ? 'active' : 'inactive'}
                />
              </td>
              <td className="r" style={{ whiteSpace: 'nowrap' }}>
                {canWrite && (
                  <Tooltip title={t('common.actions.edit')}>
                    <IconButton size="small" onClick={() => open(kind, item)} aria-label={t('common.actions.edit')}>
                      <Pencil size={15} />
                    </IconButton>
                  </Tooltip>
                )}
                {canWrite && item[KINDS[kind].countField] === 0 && (
                  <Tooltip title={t('common.actions.delete')}>
                    <IconButton
                      size="small"
                      onClick={() => setToDelete({ kind, id: item.id, name: item.name })}
                      aria-label={t('common.actions.delete')}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </Tooltip>
                )}
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );

  return (
    <>
      <PageHeader title={t('rental.settings.title')} subtitle={t('rental.settings.subtitle')} />

      <div style={{ marginBottom: 26 }}>
        <div className="section-title">
          <h2>{t('rental.settings.lateness.title')}</h2>
          <div className="line" />
          {isSuperAdmin && settings.data && (
            <Button
              size="small"
              startIcon={<Pencil size={15} />}
              onClick={() => setGrace(String(settings.data.default_return_grace_days))}
            >
              {t('common.actions.edit')}
            </Button>
          )}
        </div>
        {settings.error && <ErrorNote message={extractErrorMessage(settings.error)} />}
        {settings.data && (
          <div className="card recap">
            <div className="r-row">
              <span className="l">{t('rental.settings.lateness.grace')}</span>
              <span className="num">
                {t('rental.orders.days', { count: settings.data.default_return_grace_days })}
              </span>
            </div>
            <div className="r-row">
              <span className="l" style={{ fontSize: 12 }}>
                {t('rental.settings.lateness.hint')}
              </span>
            </div>
          </div>
        )}
      </div>

      {section('category', categories)}
      {section('unit', units)}
      {section('expenseCategory', expenseCategories)}

      {editing && (
        <FormDialog
          open={Boolean(editing)}
          title={t(`rental.settings.${editing.kind}.${editing.id ? 'editTitle' : 'newTitle'}`)}
          submitDisabled={requiredText(editing.name).length < KINDS[editing.kind].minName}
          onSubmit={submit}
          onClose={() => setEditing(null)}
        >
          <TextField
            label={t('common.fields.name')}
            value={editing.name}
            onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            size="small"
            required
            autoFocus
          />
          {KINDS[editing.kind].extraField && (
            <TextField
              label={t(`rental.settings.${editing.kind}.extra`)}
              value={editing.extra}
              onChange={(event) => setEditing({ ...editing, extra: event.target.value })}
              size="small"
              multiline={editing.kind === 'category'}
              minRows={editing.kind === 'category' ? 2 : undefined}
            />
          )}
          {editing.id && (
            <FormControlLabel
              control={
                <Switch
                  checked={editing.isActive}
                  onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })}
                />
              }
              label={t('rental.articles.fields.active')}
            />
          )}
        </FormDialog>
      )}

      {grace !== null && (
        <FormDialog
          open={grace !== null}
          title={t('rental.settings.lateness.title')}
          submitDisabled={!graceValid}
          onSubmit={() => settingsMutation.mutateAsync(graceNumber)}
          onClose={() => setGrace(null)}
        >
          <TextField
            label={t('rental.settings.lateness.grace')}
            value={grace}
            onChange={(event) => setGrace(event.target.value)}
            size="small"
            type="number"
            inputProps={{ min: 0, max: MAX_GRACE_DAYS, step: 1 }}
            helperText={t('rental.settings.lateness.hint')}
            autoFocus
          />
        </FormDialog>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('rental.settings.deleteTitle')}
        description={t('rental.settings.deleteDescription', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.actions.delete')}
        danger
        onConfirm={() => mutationsOf(toDelete.kind).remove.mutateAsync(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
