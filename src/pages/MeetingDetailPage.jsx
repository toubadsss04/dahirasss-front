import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Ban, ChevronLeft, Lock, Pencil, Plus, Trash2 } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import MemberPicker from '../components/forms/MemberPicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  DataTable,
  ErrorNote,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { operationStatusKey } from '../constants/labels';
import { KEYS } from '../constants/queryKeys';
import { ROUTES } from '../constants/routes';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import {
  cancelContribution,
  fetchGiftTargets,
  fetchMeeting,
  fetchMeetingGifts,
  giftTargetKey,
  recordMeetingGifts,
  toGiftBatch,
  totalsByTarget,
  updateContribution,
} from '../services/finance.service';
import { fetchAllMembers, sortBySection } from '../services/members.service';
import { cancelProjectPayment, updateProjectPayment } from '../services/projects.service';
import { avatarColor, formatDate, initials } from '../utils/format';
import { isValidAmount } from '../utils/formChanges';

let nextLineId = 0;

/**
 * Build an empty line for a pot.
 *
 * @param {string} targetKey The pot the line starts on.
 * @returns {{id: number, targetKey: string, amount: string}} The line.
 */
function newLine(targetKey = '') {
  nextLineId += 1;
  return { id: nextLineId, targetKey, amount: '' };
}

/**
 * Gifts recorded during one meeting of the whole Dahira.
 *
 * A member may give to several pots in one go: the Gamou contribution and any
 * open project. The member is picked first, then one line per pot with its
 * amount; the whole batch is recorded at once, or not at all. A pot the member
 * already gave to in this meeting is no longer offered: a wrong amount is
 * corrected with the pencil on its row, which keeps both values in the audit
 * trail. Each gift is frozen against the member's section at that moment.
 *
 * @returns {JSX.Element} The screen.
 */
export default function MeetingDetailPage() {
  const { t } = useTranslation();
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const amountRef = useRef(null);
  const { canCorrectProjectPayment, canCancelProjectPayments, canWrite } = usePermissions();

  const [member, setMember] = useState(null);
  const [lines, setLines] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [isBusy, setBusy] = useState(false);
  const [toCancel, setToCancel] = useState(null);

  const meeting = useQuery({
    queryKey: [KEYS.meeting, meetingId],
    queryFn: () => fetchMeeting(meetingId),
  });
  const gifts = useQuery({
    queryKey: [KEYS.meetingGifts, meetingId],
    queryFn: () => fetchMeetingGifts(meetingId),
  });
  const targets = useQuery({
    queryKey: [KEYS.meetingGiftTargets, meetingId],
    queryFn: () => fetchGiftTargets(meetingId),
  });
  const members = useQuery({
    queryKey: [KEYS.members, 'active'],
    queryFn: () => fetchAllMembers({ status: 'ACTIVE' }),
  });

  const recordMutation = useDomainMutation(
    'meetingGift',
    (payload) => recordMeetingGifts(meetingId, payload),
    { successMessage: t('meetingDetail.saved') },
  );
  const correctContribution = useDomainMutation(
    'contribution',
    ({ id, amount }) => updateContribution(id, { amount }),
    { successMessage: t('meetingDetail.updated') },
  );
  const correctPayment = useDomainMutation(
    'projectPayment',
    ({ projectId, id, amount }) => updateProjectPayment(projectId, id, { amount }),
    { successMessage: t('meetingDetail.updated') },
  );
  const cancelContributionMutation = useDomainMutation(
    'contribution',
    ({ id, reason }) => cancelContribution(id, reason),
    { successMessage: t('meetingDetail.cancelled') },
  );
  const cancelPaymentMutation = useDomainMutation(
    'projectPayment',
    ({ projectId, id, reason }) => cancelProjectPayment(projectId, id, reason),
    { successMessage: t('meetingDetail.cancelled') },
  );

  const rows = gifts.data ?? [];
  const sortedMembers = useMemo(() => sortBySection(members.data ?? []), [members.data]);

  if (meeting.isLoading) return <Loader />;
  if (meeting.error) return <ErrorNote message={extractErrorMessage(meeting.error)} />;

  const record = meeting.data;
  const isMeetingActive = record.status === 'ACTIVE';
  const active = rows.filter((row) => row.status === 'ACTIVE');
  const total = active.reduce((sum, row) => sum + row.amount, 0);
  const subtotals = totalsByTarget(rows);
  const pots = targets.data ?? [];

  const givenByMember = new Set(
    active.filter((row) => row.member_id === member?.id).map(giftTargetKey),
  );
  const potOptions = pots
    .filter((pot) => !givenByMember.has(giftTargetKey(pot)))
    .map((pot) => ({
      value: giftTargetKey(pot),
      label: pot.exercise_name
        ? t('meetingDetail.potGamou', { label: pot.label, exercise: pot.exercise_name })
        : pot.label,
    }));
  const usedKeys = new Set(lines.map((line) => line.targetKey));
  const nextFreeKey = potOptions.find((option) => !usedKeys.has(option.value))?.value;
  const canAddLine = Boolean(member) && Boolean(nextFreeKey);
  const batch = member ? toGiftBatch(member.id, lines) : null;

  const resetForm = () => {
    setEditing(null);
    setEditAmount('');
    setMember(null);
    setLines([]);
    setFormError('');
  };

  const chooseMember = (selected) => {
    setMember(selected);
    setFormError('');
    if (!selected) {
      setLines([]);
      return;
    }
    const given = new Set(
      active.filter((row) => row.member_id === selected.id).map(giftTargetKey),
    );
    const first = pots.map(giftTargetKey).find((key) => !given.has(key));
    setLines(first ? [newLine(first)] : []);
  };

  const updateLine = (id, changes) =>
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...changes } : line)),
    );

  const startEdit = (row) => {
    setMember(null);
    setLines([]);
    setEditing(row);
    setEditAmount(String(row.amount));
    setFormError('');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    formRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    amountRef.current?.focus({ preventScroll: true });
  };

  const canEditRow = (row) =>
    canWrite && (row.target === 'GAMOU' || canCorrectProjectPayment(row));
  const canCancelRow = (row) =>
    canWrite && (row.target === 'GAMOU' || canCancelProjectPayments);
  const canUpdate =
    Boolean(editing) && isValidAmount(editAmount) && Number(editAmount) !== editing.amount;

  const submitBatch = async () => {
    if (!member) {
      setFormError(t('validation.memberRequired'));
      return;
    }
    const invalid = lines.some(
      (line) => line.targetKey && line.amount !== '' && !isValidAmount(line.amount),
    );
    if (invalid || batch.lines.length === 0) {
      setFormError(t('validation.amountPositive'));
      return;
    }
    await recordMutation.mutateAsync(batch);
  };

  const submitCorrection = async () => {
    const amount = Math.round(Number(editAmount));
    if (editing.target === 'GAMOU') {
      await correctContribution.mutateAsync({ id: editing.id, amount });
    } else {
      await correctPayment.mutateAsync({
        projectId: editing.project_id,
        id: editing.id,
        amount,
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editing && !canUpdate) return;
    setBusy(true);
    setFormError('');
    try {
      if (editing) {
        await submitCorrection();
      } else {
        await submitBatch();
      }
      resetForm();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async (reason) => {
    if (toCancel.target === 'GAMOU') {
      await cancelContributionMutation.mutateAsync({ id: toCancel.id, reason });
    } else {
      await cancelPaymentMutation.mutateAsync({
        projectId: toCancel.project_id,
        id: toCancel.id,
        reason,
      });
    }
    if (editing?.id === toCancel.id) resetForm();
  };

  const donors = new Set(active.map((row) => row.member_id)).size;
  const footerCell = { borderTop: '1px solid var(--line)' };

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.meetings)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('meetingDetail.back')}
      </button>

      <PageHeader
        title={t('meetingDetail.title')}
        subtitle={[formatDate(record.meeting_date), record.subject].filter(Boolean).join(' · ')}
      />

      {record.description && (
        <div
          className="card"
          style={{ padding: '12px 16px', marginBottom: 14, whiteSpace: 'pre-line' }}
        >
          {record.description}
        </div>
      )}

      <div className="filters" style={{ alignItems: 'center' }}>
        <span className="chip">
          {t('meetingDetail.contributors', { count: donors })}
          {record.attendees_count
            ? ` / ${t('meetingDetail.attendees', { count: record.attendees_count })}`
            : ''}
        </span>
        {record.created_by_name && (
          <span className="chip">
            {t('common.recordedBy', { name: record.created_by_name })}
          </span>
        )}
        <StatusBadge
          label={t(operationStatusKey(record.status))}
          tone={record.status === 'ACTIVE' ? 'open' : 'cancel'}
        />
      </div>

      <div className={canWrite ? 'split' : undefined}>
        <div>
          <DataTable
            columns={[
              { key: 'index', label: '' },
              { key: 'member', label: t('meetingDetail.columns.member') },
              { key: 'pot', label: t('meetingDetail.columns.pot') },
              { key: 'amount', label: t('meetingDetail.columns.amount'), align: 'right' },
              { key: 'actions', label: '', align: 'right' },
            ]}
            rows={rows}
            emptyMessage={t('meetingDetail.empty')}
            footer={
              <tfoot>
                {subtotals.length > 1 &&
                  subtotals.map((pot) => (
                    <tr key={pot.key}>
                      <td />
                      <td colSpan={2} style={{ color: 'var(--muted)', padding: '8px 14px' }}>
                        {pot.label}
                      </td>
                      <td className="r">
                        <Money value={pot.total} />
                      </td>
                      <td />
                    </tr>
                  ))}
                <tr>
                  <td style={footerCell} />
                  <td colSpan={2} style={{ ...footerCell, fontWeight: 600, padding: '13px 14px' }}>
                    {t('meetingDetail.total')}
                  </td>
                  <td className="r" style={{ ...footerCell, fontSize: 16 }}>
                    <Money value={total} />
                  </td>
                  <td style={footerCell} />
                </tr>
              </tfoot>
            }
            renderRow={(row, index) => {
              const cancelled = row.status === 'CANCELLED';
              const isEdited = editing?.id === row.id;
              return (
                <tr
                  key={row.id}
                  style={isEdited ? { background: 'var(--gold-soft)' } : undefined}
                >
                  <td className="num" style={{ color: 'var(--faint)', width: '1%' }}>
                    {String(index + 1).padStart(2, '0')}
                  </td>
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
                          background: avatarColor(row.member_name),
                          flex: '0 0 auto',
                        }}
                      >
                        {initials(row.member_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{row.member_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {cancelled && row.cancel_reason
                            ? t('common.cancelledWithReason', { reason: row.cancel_reason })
                            : row.entity_name || t('common.empty.noCategory')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={row.is_gamou ? 'badge b-open' : 'badge b-draft'}>
                      {row.target_label}
                    </span>
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
                        {isMeetingActive && canEditRow(row) && (
                          <Tooltip title={t('common.actions.edit')}>
                            <IconButton
                              size="small"
                              aria-label={t('common.actions.edit')}
                              onClick={() => startEdit(row)}
                              color={isEdited ? 'primary' : 'default'}
                            >
                              <Pencil size={15} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canCancelRow(row) && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Ban size={14} />}
                            onClick={() => setToCancel(row)}
                          >
                            {t('common.actions.cancel')}
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        </div>

        {canWrite && (
          <div ref={formRef} className="card" style={{ padding: 18, alignSelf: 'start' }}>
            <div className="section-title" style={{ margin: '0 0 12px' }}>
              <h2>{editing ? t('meetingDetail.editTitle') : t('meetingDetail.add')}</h2>
              <div className="line" />
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {formError && <Alert severity="error">{formError}</Alert>}

              {editing ? (
                <>
                  <TextField
                    label={t('common.member')}
                    value={`${editing.member_name} · ${editing.target_label}`}
                    size="small"
                    helperText={t('meetingDetail.memberLocked')}
                    disabled
                  />
                  <TextField
                    label={t('common.fields.amount')}
                    value={editAmount}
                    onChange={(event) =>
                      setEditAmount(event.target.value.replace(/[^0-9]/g, ''))
                    }
                    inputRef={amountRef}
                    size="small"
                    slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  />
                </>
              ) : (
                <>
                  <MemberPicker
                    members={sortedMembers}
                    value={member}
                    onChange={chooseMember}
                    label={t('common.member')}
                    helperText={
                      member && potOptions.length === 0
                        ? t('meetingDetail.allPotsGiven')
                        : t('meetingDetail.pickMember')
                    }
                    disabled={!isMeetingActive}
                    showDaara
                    groupBySection
                  />

                  {lines.map((line) => (
                    <div
                      key={line.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8 }}
                    >
                      <AppSelect
                        label={t('meetingDetail.pot')}
                        value={line.targetKey}
                        onChange={(value) => updateLine(line.id, { targetKey: value })}
                        options={potOptions.filter(
                          (option) =>
                            option.value === line.targetKey || !usedKeys.has(option.value),
                        )}
                        fullWidth
                      />
                      <TextField
                        label={t('common.fields.amount')}
                        value={line.amount}
                        onChange={(event) =>
                          updateLine(line.id, {
                            amount: event.target.value.replace(/[^0-9]/g, ''),
                          })
                        }
                        size="small"
                        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                        placeholder={t('meetingDetail.amountPlaceholder')}
                      />
                      <Tooltip title={t('meetingDetail.removePot')}>
                        <span>
                          <IconButton
                            aria-label={t('meetingDetail.removePot')}
                            onClick={() =>
                              setLines((current) => current.filter((item) => item.id !== line.id))
                            }
                            disabled={lines.length === 1}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  ))}

                  {member && (
                    <Button
                      color="inherit"
                      startIcon={<Plus size={16} />}
                      onClick={() => setLines((current) => [...current, newLine(nextFreeKey)])}
                      disabled={!canAddLine || !isMeetingActive}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {t('meetingDetail.addPot')}
                    </Button>
                  )}
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={editing ? <Pencil size={16} /> : <Plus size={16} />}
                disabled={
                  isBusy ||
                  !isMeetingActive ||
                  (editing ? !canUpdate : !batch || batch.lines.length === 0)
                }
              >
                {editing ? t('meetingDetail.update') : t('meetingDetail.submit')}
              </Button>

              {(editing || member) && (
                <Button color="inherit" onClick={resetForm} disabled={isBusy}>
                  {editing ? t('meetingDetail.stopEditing') : t('common.actions.cancel')}
                </Button>
              )}
            </form>

            <div className="callout">
              <span className="ic">
                <Lock size={20} />
              </span>
              <span className="tx">
                <Trans i18nKey="meetingDetail.notice" components={{ b: <b /> }} />
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('meetingDetail.confirmCancel.title')}
        description={t('meetingDetail.confirmCancel.body', {
          name: toCancel?.member_name,
          pot: toCancel?.target_label,
        })}
        confirmLabel={t('meetingDetail.confirmCancel.confirm')}
        requireReason
        danger
        onConfirm={confirmCancel}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
