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
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { extractErrorMessage } from '../../services/apiClient';
import {
  createRentalCategory,
  createRentalUnit,
  deleteRentalCategory,
  deleteRentalUnit,
  fetchRentalCategories,
  fetchRentalUnits,
  updateRentalCategory,
  updateRentalUnit,
} from '../../services/rental.service';
import { optionalText, requiredText } from '../../utils/formChanges';

/**
 * How each list of the settings reads and writes: categories carry a
 * description, units a symbol.
 */
const KINDS = {
  category: {
    extraField: 'description',
    fetch: fetchRentalCategories,
    key: KEYS.rentalCategories,
    create: createRentalCategory,
    update: updateRentalCategory,
    remove: deleteRentalCategory,
  },
  unit: {
    extraField: 'symbol',
    fetch: fetchRentalUnits,
    key: KEYS.rentalUnits,
    create: createRentalUnit,
    update: updateRentalUnit,
    remove: deleteRentalUnit,
  },
};

/**
 * Settings of the catalogue: the categories articles are filed under and the
 * units they are counted in. Both are created here, never fixed in code. One
 * still used can be switched off but not deleted.
 *
 * @returns {JSX.Element} The screen.
 */
export default function RentalSettingsPage() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const categories = useQuery({ queryKey: [KINDS.category.key], queryFn: KINDS.category.fetch });
  const units = useQuery({ queryKey: [KINDS.unit.key], queryFn: KINDS.unit.fetch });

  const saveMutation = useDomainMutation(
    'rentalCatalog',
    ({ kind, id, payload }) => (id ? KINDS[kind].update(id, payload) : KINDS[kind].create(payload)),
    { successMessage: t('rental.settings.saved') },
  );
  const deleteMutation = useDomainMutation(
    'rentalCatalog',
    ({ kind, id }) => KINDS[kind].remove(id),
    { successMessage: t('rental.settings.deleted') },
  );

  const open = (kind, item = null) =>
    setEditing({
      kind,
      id: item?.id ?? null,
      name: item?.name ?? '',
      extra: item?.[KINDS[kind].extraField] ?? '',
      isActive: item?.is_active ?? true,
    });

  const submit = () => {
    const { kind, id } = editing;
    const payload = {
      name: requiredText(editing.name),
      [KINDS[kind].extraField]: optionalText(editing.extra),
      ...(id ? { is_active: editing.isActive } : {}),
    };
    return saveMutation.mutateAsync({ kind, id, payload });
  };

  const section = (kind, query) => (
    <div style={{ marginBottom: 26 }}>
      <div className="section-title">
        <h2>{t(`rental.settings.${kind}.title`)}</h2>
        <div className="line" />
        <Button size="small" startIcon={<Plus size={15} />} onClick={() => open(kind)}>
          {t(`rental.settings.${kind}.new`)}
        </Button>
      </div>
      {query.isLoading && <Loader />}
      {query.error && <ErrorNote message={extractErrorMessage(query.error)} />}
      {query.data && (
        <DataTable
          columns={[
            { key: 'name', label: t('common.fields.name') },
            { key: 'count', label: t('rental.settings.articlesCount'), align: 'right' },
            { key: 'status', label: t('common.fields.status') },
            { key: 'actions', label: '', align: 'right' },
          ]}
          rows={query.data}
          emptyMessage={t(`rental.settings.${kind}.empty`)}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item[KINDS[kind].extraField] && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {item[KINDS[kind].extraField]}
                  </div>
                )}
              </td>
              <td className="r num">{item.articles_count}</td>
              <td>
                <StatusBadge
                  label={item.is_active ? t('rental.articles.active') : t('rental.articles.inactive')}
                  tone={item.is_active ? 'active' : 'inactive'}
                />
              </td>
              <td className="r" style={{ whiteSpace: 'nowrap' }}>
                <Tooltip title={t('common.actions.edit')}>
                  <IconButton size="small" onClick={() => open(kind, item)} aria-label={t('common.actions.edit')}>
                    <Pencil size={15} />
                  </IconButton>
                </Tooltip>
                {item.articles_count === 0 && (
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

      {section('category', categories)}
      {section('unit', units)}

      {editing && (
        <FormDialog
          open={Boolean(editing)}
          title={t(`rental.settings.${editing.kind}.${editing.id ? 'editTitle' : 'newTitle'}`)}
          submitDisabled={requiredText(editing.name).length < (editing.kind === 'unit' ? 1 : 2)}
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
          <TextField
            label={t(`rental.settings.${editing.kind}.extra`)}
            value={editing.extra}
            onChange={(event) => setEditing({ ...editing, extra: event.target.value })}
            size="small"
            multiline={editing.kind === 'category'}
            minRows={editing.kind === 'category' ? 2 : undefined}
          />
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('rental.settings.deleteTitle')}
        description={t('rental.settings.deleteDescription', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.actions.delete')}
        danger
        onConfirm={() => deleteMutation.mutateAsync(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
