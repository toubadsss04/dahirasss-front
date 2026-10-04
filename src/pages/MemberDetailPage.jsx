import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { ArrowLeftRight, ChevronLeft, Info, Pencil } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import DaaraLabel from '../components/ui/DaaraLabel';
import FormDialog from '../components/ui/FormDialog';
import { ErrorNote, Loader, StatusBadge } from '../components/ui';
import { memberStatusKey } from '../constants/labels';
import { NO_CATEGORY } from '../constants/members';
import { ROUTES } from '../constants/routes';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaras } from '../services/daara.service';
import {
  fetchMember,
  fetchMemberHistory,
  fetchMemberMonthly,
  isMemberFormValid,
  toMemberForm,
  toMemberUpdate,
  transferMember,
  updateMember,
} from '../services/members.service';
import { useExerciseStore } from '../store/exerciseStore';
import { avatarColor, formatDate, formatMoney, formatMonth, personInitials } from '../utils/format';

/**
 * Member record with contributions and daara history.
 *
 * Moving a member never rewrites their past: each contribution keeps the
 * daara it was recorded in, which is what the history panel makes visible.
 *
 * The details typed at registration stay correctable by anyone in charge of
 * the member's daara. Only the fields that changed are sent, so the audit
 * trail shows exactly what was corrected.
 *
 * @returns {JSX.Element} The screen.
 */
export default function MemberDetailPage() {
  const { t } = useTranslation();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const selected = useExerciseStore((state) => state.selected());

  const [isTransferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ entity_id: '', reason: '' });
  const [isEditOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const member = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => fetchMember(memberId),
  });
  const history = useQuery({
    queryKey: ['member-history', memberId],
    queryFn: () => fetchMemberHistory(memberId),
  });
  const monthly = useQuery({
    queryKey: ['member-monthly', memberId, selected?.id],
    queryFn: () => fetchMemberMonthly(memberId, selected?.id),
    enabled: Boolean(memberId),
  });
  const daaras = useQuery({
    queryKey: ['daaras'],
    queryFn: () => fetchDaaras(),
    enabled: isSuperAdmin,
  });

  const transferMutation = useDomainMutation(
    'member',
    (payload) => transferMember(memberId, payload),
    {
      successMessage: t('memberDetail.transferred'),
    },
  );
  const updateMutation = useDomainMutation(
    'member',
    (payload) => updateMember(memberId, payload),
    { successMessage: t('memberDetail.updated') },
  );

  if (member.isLoading) return <Loader />;
  if (member.error) return <ErrorNote message={extractErrorMessage(member.error)} />;

  const record = member.data;
  const months = monthly.data ?? [];
  const total = months.reduce((sum, row) => sum + row.total_amount, 0);

  const memberUpdate = editForm ? toMemberUpdate(editInitial, editForm) : {};
  const canSaveEdit =
    Boolean(editForm) &&
    isMemberFormValid(editForm) &&
    Object.keys(memberUpdate).length > 0;

  const openEdit = () => {
    const initial = toMemberForm(record);
    setEditInitial(initial);
    setEditForm(initial);
    setEditOpen(true);
  };
  const setEditField = (field) => (event) =>
    setEditForm({ ...editForm, [field]: event.target.value });

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.members)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('memberDetail.back')}
      </button>

      <div className="md-head">
        <div className="md-av" style={{ background: avatarColor(record.full_name) }}>
          {personInitials(record)}
        </div>
        <div>
          <h1 style={{ fontSize: 23 }}>{record.full_name}</h1>
          <div className="md-meta">
            <DaaraLabel name={record.entity_name} />
            {record.phone && <span className="chip">{record.phone}</span>}
            <StatusBadge
              label={t(memberStatusKey(record.status))}
              tone={record.status === 'ACTIVE' ? 'active' : 'inactive'}
            />
            <span className="chip">
              {t('memberDetail.joined', { date: formatDate(record.joined_on) })}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              fontWeight: 600,
            }}
          >
            {t('memberDetail.total', {
              scope: selected?.name ?? t('memberDetail.allPeriods'),
            })}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600 }}>
            {formatMoney(total)}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: 4,
              marginTop: 8,
            }}
          >
            <Button size="small" startIcon={<Pencil size={15} />} onClick={openEdit}>
              {t('common.actions.edit')}
            </Button>
            {isSuperAdmin && (
              <Button
                size="small"
                startIcon={<ArrowLeftRight size={15} />}
                onClick={() => {
                  setTransferForm({ entity_id: '', reason: '' });
                  setTransferOpen(true);
                }}
              >
                {t('memberDetail.changeDaara')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="callout">
        <span className="ic">
          <Info size={20} />
        </span>
        <span className="tx">
          <Trans i18nKey="memberDetail.historyNotice" components={{ b: <b /> }} />
        </span>
      </div>

      <div className="split">
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ margin: '0 0 14px' }}>
            <h2>{`${t('memberDetail.contributions')} ${selected?.name ?? ''}`.trim()}</h2>
            <div className="line" />
            <span className="chip">
              {t('memberDetail.monthCount', { count: months.length })}
            </span>
          </div>
          {months.length === 0 ? (
            <div className="empty-note">{t('memberDetail.noContribution')}</div>
          ) : (
            <div className="contrib-months">
              {months.map((row) => (
                <div className="cm" key={row.period}>
                  <div className="m">{formatMonth(row.period)}</div>
                  <div className="v">{formatMoney(row.total_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ margin: '0 0 12px' }}>
            <h2>{t('memberDetail.history')}</h2>
            <div className="line" />
          </div>
          {(history.data ?? []).map((period) => (
            <div className="stat-row" key={`${period.entity_id}-${period.started_on}`}>
              <span className="lab">
                <DaaraLabel name={period.entity_name} />
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {formatDate(period.started_on)}
                {' → '}
                {period.ended_on ? formatDate(period.ended_on) : t('memberDetail.ongoing')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <FormDialog
        open={isTransferOpen}
        title={t('memberDetail.changeDaara')}
        submitLabel={t('memberDetail.form.submit')}
        onClose={() => setTransferOpen(false)}
        onSubmit={() =>
          transferMutation.mutateAsync({
            entity_id: transferForm.entity_id === NO_CATEGORY ? null : transferForm.entity_id,
            reason: transferForm.reason.trim() || null,
          })
        }
        submitDisabled={!transferForm.entity_id}
      >
        <AppSelect
          label={t('memberDetail.form.newDaara')}
          value={transferForm.entity_id}
          onChange={(value) => setTransferForm({ ...transferForm, entity_id: value })}
          options={[
            ...(record.entity_id
              ? [{ value: NO_CATEGORY, label: t('common.empty.noCategory') }]
              : []),
            ...(daaras.data ?? [])
              .filter((daara) => daara.id !== record.entity_id)
              .map((daara) => ({ value: daara.id, label: daara.name })),
          ]}
          fullWidth
        />
        <TextField
          label={t('common.fields.reason')}
          value={transferForm.reason}
          onChange={(event) =>
            setTransferForm({ ...transferForm, reason: event.target.value })
          }
          size="small"
          multiline
          minRows={2}
        />
      </FormDialog>

      <FormDialog
        open={isEditOpen}
        title={t('memberDetail.editForm.title')}
        submitLabel={t('common.actions.edit')}
        submitDisabled={!canSaveEdit}
        onClose={() => setEditOpen(false)}
        onSubmit={() => updateMutation.mutateAsync(memberUpdate)}
      >
        {editForm && (
          <>
            <TextField
              label={t('members.form.firstName')}
              value={editForm.first_name}
              onChange={setEditField('first_name')}
              size="small"
              autoFocus
              required
            />
            <TextField
              label={t('members.form.lastName')}
              value={editForm.last_name}
              onChange={setEditField('last_name')}
              size="small"
              required
            />
            <TextField
              label={t('common.fields.phone')}
              value={editForm.phone}
              onChange={setEditField('phone')}
              size="small"
              slotProps={{ htmlInput: { inputMode: 'tel' } }}
            />
            <TextField
              label={t('memberDetail.editForm.joinedOn')}
              type="date"
              value={editForm.joined_on}
              onChange={setEditField('joined_on')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}
      </FormDialog>
    </>
  );
}
