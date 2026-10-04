import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Pencil, Plus, Power, PowerOff } from 'lucide-react';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import {
  EmptyState,
  ErrorNote,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { entityStatusKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { createDaara, fetchDaaras, updateDaara } from '../services/daara.service';
import { fetchStatement } from '../services/reporting.service';
import { useExerciseStore } from '../store/exerciseStore';
import { avatarColor, initials } from '../utils/format';

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

      {daaras.data.length === 0 ? (
        <div className="card">
          <EmptyState message={t('daaras.empty')} />
        </div>
      ) : (
        <div className="grid ent-grid">
          {daaras.data.map((daara) => {
            const stats = financials.get(daara.id);
            const isActive = daara.status === 'ACTIVE';

            return (
              <div className="card ent" key={daara.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--serif)',
                      fontSize: 19,
                      fontWeight: 600,
                      color: '#fff',
                      background: avatarColor(daara.name),
                      flex: '0 0 auto',
                    }}
                  >
                    {initials(daara.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 16.5 }}>{daara.name}</h3>
                    {daara.description && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--muted)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {daara.description}
                      </div>
                    )}
                  </div>
                  <StatusBadge
                    label={t(entityStatusKey(daara.status))}
                    tone={isActive ? 'active' : 'inactive'}
                  />
                </div>

                <div className="e-stats">
                  <div>
                    <div className="s-l">{t('daaras.stats.members')}</div>
                    <div className="s-v">{daara.members_count}</div>
                  </div>
                  <div>
                    <div className="s-l">{t('daaras.stats.projects')}</div>
                    <div className="s-v pos">
                      <Money value={stats?.total_project_payments ?? 0} />
                    </div>
                  </div>
                  <div>
                    <div className="s-l">{t('daaras.stats.collected')}</div>
                    <div className="s-v pos">
                      <Money value={stats?.total_contributions ?? 0} />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--faint)',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                      }}
                    >
                      {t('daaras.stats.balance')}
                    </div>
                    <div
                      style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600 }}
                    >
                      <Money value={stats?.balance ?? 0} />
                    </div>
                  </div>
                </div>

                {canManageDaaras && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: '1px solid var(--line-soft)',
                      paddingTop: 12,
                    }}
                  >
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
                      startIcon={
                        isActive ? <PowerOff size={14} /> : <Power size={14} />
                      }
                      onClick={() => setToToggle(daara)}
                    >
                      {isActive ? t('daaras.deactivate') : t('daaras.activate')}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
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
