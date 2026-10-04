import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Pencil, Plus, Power, PowerOff } from 'lucide-react';

import CategoryCard from '../components/ui/CategoryCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import { EmptyState, ErrorNote, Loader, PageHeader, StatusBadge } from '../components/ui';
import { entityStatusKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { createDaara, fetchDaaras, updateDaara } from '../services/daara.service';
import { fetchStatement } from '../services/reporting.service';
import { useExerciseStore } from '../store/exerciseStore';

const EMPTY_FORM = { name: '', description: '' };

/**
 * List of sections with their financial position.
 *
 * Each section is shown under the name given at its creation, with no prefix
 * added by the interface. A section stays editable afterwards, since a name
 * or a description entered in haste has to be correctable.
 *
 * @returns {JSX.Element} The screen.
 */
export default function DaarasPage() {
  const { t } = useTranslation();
  const { canManageDaaras } = usePermissions();
  const exerciseId = useExerciseStore((state) => state.selectedId);

  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toToggle, setToToggle] = useState(null);

  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });
  const statement = useQuery({
    queryKey: ['statement', exerciseId],
    queryFn: () => fetchStatement(exerciseId),
    enabled: Boolean(exerciseId),
  });
  const createMutation = useDomainMutation('daara', createDaara, {
    successMessage: t('daaras.created'),
  });
  const updateMutation = useDomainMutation(
    'daara',
    ({ id, payload }) => updateDaara(id, payload),
    { successMessage: t('daaras.updated') },
  );

  if (daaras.isLoading) return <Loader />;
  if (daaras.error) return <ErrorNote message={extractErrorMessage(daaras.error)} />;

  const financials = new Map(
    (statement.data?.entities ?? []).map((row) => [row.entity_id, row]),
  );
  const uncategorized = financials.get(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (daara) => {
    setEditing(daara);
    setForm({
      name: daara.name,
      description: daara.description ?? '',
    });
    setFormOpen(true);
  };

  const submit = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };
    if (editing) {
      return updateMutation.mutateAsync({ id: editing.id, payload });
    }
    return createMutation.mutateAsync(payload);
  };

  return (
    <>
      <PageHeader
        title={t('daaras.title')}
        subtitle={t('daaras.subtitle')}
        actions={
          canManageDaaras && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}>
              {t('daaras.add')}
            </Button>
          )
        }
      />

      {daaras.data.length === 0 && !uncategorized ? (
        <div className="card">
          <EmptyState message={t('daaras.empty')} />
        </div>
      ) : (
        <div className="grid ent-grid">
          {daaras.data.map((daara) => {
            const isActive = daara.status === 'ACTIVE';
            return (
              <CategoryCard
                key={daara.id}
                name={daara.name}
                description={daara.description}
                badge={
                  <StatusBadge
                    label={t(entityStatusKey(daara.status))}
                    tone={isActive ? 'active' : 'inactive'}
                  />
                }
                membersCount={daara.members_count}
                stats={financials.get(daara.id)}
                actions={
                  canManageDaaras && (
                    <>
                      <Button
                        size="small"
                        startIcon={<Pencil size={14} />}
                        onClick={() => openEdit(daara)}
                      >
                        {t('common.actions.edit')}
                      </Button>
                      <Button
                        size="small"
                        color={isActive ? 'error' : 'primary'}
                        startIcon={isActive ? <PowerOff size={14} /> : <Power size={14} />}
                        onClick={() => setToToggle(daara)}
                      >
                        {isActive ? t('daaras.deactivate') : t('daaras.activate')}
                      </Button>
                    </>
                  )
                }
              />
            );
          })}
          {uncategorized && (
            <CategoryCard
              name={t('common.empty.noCategory')}
              description={t('daaras.uncategorizedHint')}
              membersCount={uncategorized.members_count}
              stats={uncategorized}
            />
          )}
        </div>
      )}

      <FormDialog
        open={isFormOpen}
        title={
          editing
            ? t('daaras.form.edit', { name: editing.name })
            : t('daaras.form.create')
        }
        submitLabel={editing ? t('common.actions.save') : t('common.actions.create')}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      >
        <TextField
          label={t('daaras.form.name')}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          helperText={t('daaras.form.nameHint')}
          size="small"
          autoFocus
          required
        />
        <TextField
          label={t('common.fields.description')}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          size="small"
          multiline
          minRows={2}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(toToggle)}
        title={
          toToggle?.status === 'ACTIVE'
            ? t('daaras.confirmDeactivate.title')
            : t('daaras.confirmActivate.title')
        }
        description={
          toToggle?.status === 'ACTIVE'
            ? t('daaras.confirmDeactivate.body', { name: toToggle?.name })
            : t('daaras.confirmActivate.body', { name: toToggle?.name })
        }
        confirmLabel={
          toToggle?.status === 'ACTIVE'
            ? t('daaras.confirmDeactivate.confirm')
            : t('daaras.confirmActivate.confirm')
        }
        danger={toToggle?.status === 'ACTIVE'}
        onConfirm={() =>
          updateMutation.mutateAsync({
            id: toToggle.id,
            payload: {
              status: toToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            },
          })
        }
        onClose={() => setToToggle(null)}
      />
    </>
  );
}
