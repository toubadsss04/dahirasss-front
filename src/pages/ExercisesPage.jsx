import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { ArrowDown, Check, Info, Landmark, Lock, LockOpen, Plus, Share2 } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import {
  Callout,
  EmptyState,
  ErrorNote,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { exerciseStatusKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import {
  closeExercise,
  createExercise,
  fetchExerciseSummary,
  fetchIncomingTransfer,
  openExercise,
  reopenExercise,
  setOpeningBalance,
  transferBalance,
} from '../services/finance.service';
import { fetchExercises } from '../services/exercises.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatDate, formatMoney } from '../utils/format';

const TONES = { OPEN: 'open', CLOSED: 'closed', DRAFT: 'draft' };

/**
 * Pick the exercise the page opens on.
 *
 * The one in progress is what a reader wants by default, so an open exercise
 * wins over anything else, then the most recent.
 *
 * @param {Array<object>} exercises Every exercise, most recent first.
 * @returns {string | null} The identifier to display, or null when there is none.
 */
function currentExerciseId(exercises) {
  const open = exercises.find((exercise) => exercise.status === 'OPEN');
  return open?.id ?? exercises[0]?.id ?? null;
}

/**
 * Exercise lifecycle: creation, opening, closing, reopening and carry-forward.
 *
 * The screen shows one exercise at a time, the one in progress by default.
 * Another is pulled up through the picker, and nothing loads until the
 * confirming button is pressed. Picking a value in a list is not a decision,
 * so it never moves the screen on its own.
 *
 * @returns {JSX.Element} The screen.
 */
export default function ExercisesPage() {
  const { t } = useTranslation();
  const { canManageExercises, canCloseExercise } = usePermissions();
  const reloadExercises = useExerciseStore((state) => state.load);

  const [viewedId, setViewedId] = useState(null);
  const [pendingId, setPendingId] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear() });
  const [dialog, setDialog] = useState(null);
  const [transferTarget, setTransferTarget] = useState('');
  const [opening, setOpening] = useState({ amount: '', reason: '' });

  const exercises = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises });

  useEffect(() => {
    if (viewedId || !exercises.data) return;
    const initial = currentExerciseId(exercises.data);
    setViewedId(initial);
    setPendingId(initial ?? '');
  }, [exercises.data, viewedId]);

  const summary = useQuery({
    queryKey: ['exercise-summary', viewedId],
    queryFn: () => fetchExerciseSummary(viewedId),
    enabled: Boolean(viewedId),
  });
  const transfer = useQuery({
    queryKey: ['exercise-transfer', viewedId],
    queryFn: () => fetchIncomingTransfer(viewedId),
    enabled: Boolean(viewedId),
  });

  // The exercise picker in the top bar lives outside the query cache, so it
  // is reloaded alongside every write that changes the list.
  const createMutation = useDomainMutation('exercise', createExercise, {
    successMessage: t('exercises.created'),
    onSuccess: (created) => {
      reloadExercises();
      setViewedId(created.id);
      setPendingId(created.id);
    },
  });
  const openMutation = useDomainMutation('exercise', openExercise, {
    successMessage: t('exercises.opened'),
    onSuccess: reloadExercises,
  });
  const closeMutation = useDomainMutation('exercise', closeExercise, {
    successMessage: t('exercises.closed'),
    onSuccess: reloadExercises,
  });
  const reopenMutation = useDomainMutation(
    'exercise',
    ({ id, reason }) => reopenExercise(id, reason),
    { successMessage: t('exercises.reopened'),
      onSuccess: reloadExercises },
  );
  const openingMutation = useDomainMutation(
    'exercise',
    ({ id, amount, reason }) => setOpeningBalance(id, { amount, reason }),
    { successMessage: t('exercises.opening.saved') },
  );
  const transferMutation = useDomainMutation(
    'exercise',
    ({ id, toId }) => transferBalance(id, { to_exercise_id: toId }),
    { successMessage: t('exercises.transferred'),
      onSuccess: reloadExercises },
  );

  if (exercises.isLoading) return <Loader />;
  if (exercises.error) return <ErrorNote message={extractErrorMessage(exercises.error)} />;

  const all = exercises.data;
  const viewed = all.find((exercise) => exercise.id === viewedId) ?? null;
  const currentId = currentExerciseId(all);
  const isCurrent = viewed?.id === currentId;
  const recap = summary.data;
  const carried = transfer.data;
  const canSetOpening =
    canManageExercises && !carried && Boolean(recap) && recap.status !== 'CLOSED';
  const openOpening = () => {
    setOpening({
      amount: recap.initial_balance > 0 ? String(recap.initial_balance) : '',
      reason: '',
    });
    setDialog('opening');
  };
  const targets = all
    .filter((item) => item.id !== viewedId && item.status !== 'CLOSED')
    .map((item) => ({ value: item.id, label: item.name }));

  const newExerciseButton = canManageExercises && (
    <Button
      variant="contained"
      startIcon={<Plus size={16} />}
      onClick={() => {
        setForm({ name: '', year: new Date().getFullYear() });
        setFormOpen(true);
      }}
    >
      {t('exercises.add')}
    </Button>
  );

  if (all.length === 0) {
    return (
      <>
        <PageHeader
          title={t('exercises.title')}
          subtitle={t('exercises.subtitle')}
          actions={newExerciseButton}
        />
        <div className="card">
          <EmptyState message={t('exercises.empty')} />
        </div>
        <ExerciseForm
          open={isFormOpen}
          form={form}
          setForm={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={() =>
            createMutation.mutateAsync({
              name: form.name.trim(),
              year: Number(form.year),
            })
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={viewed?.name ?? t('exercises.title')}
        subtitle={
          isCurrent
            ? t('exercises.current')
            : t('exercises.viewing', {
                status: viewed?.status ? t(exerciseStatusKey(viewed.status, true)) : '',
              })
        }
        actions={newExerciseButton}
      />

      <div className="filters">
        <AppSelect
          label={t('exercises.picker')}
          value={pendingId}
          onChange={setPendingId}
          options={all.map((exercise) => ({
            value: exercise.id,
            label:
              exercise.id === currentId
                ? t('exercises.optionCurrent', { name: exercise.name })
                : t('exercises.optionOther', {
                    name: exercise.name,
                    status: t(exerciseStatusKey(exercise.status, true)),
                  }),
          }))}
          sx={{ minWidth: 260 }}
        />
        <Button
          variant="contained"
          startIcon={<Check size={16} />}
          onClick={() => setViewedId(pendingId)}
          disabled={!pendingId || pendingId === viewedId}
        >
          {t('common.actions.validate')}
        </Button>
        {!isCurrent && (
          <Button
            color="inherit"
            onClick={() => {
              setViewedId(currentId);
              setPendingId(currentId);
            }}
          >
            {t('exercises.backToCurrent')}
          </Button>
        )}
      </div>

      {summary.isLoading && <Loader />}
      {summary.error && <ErrorNote message={extractErrorMessage(summary.error)} />}

      {recap && (
        <div className="split">
          <div className="card recap">
            <div className="section-title" style={{ padding: '14px 16px 2px', margin: 0 }}>
              <h2>
                {t('exercises.recap.title')} — <bdi>{recap.exercise_name}</bdi>
              </h2>
              <div className="line" />
              <StatusBadge
                label={t(exerciseStatusKey(recap.status))}
                tone={TONES[recap.status]}
              />
            </div>
            <div className="r-row">
              <span className="l">{t('exercises.recap.carried')}</span>
              <Money value={recap.initial_balance} />
            </div>
            <div className="r-row">
              <span className="l">{t('exercises.recap.collected')}</span>
              <Money value={recap.total_contributions} tone />
            </div>
            <div className="r-row">
              <span className="l">{t('exercises.recap.donations')}</span>
              <Money value={recap.total_donations} tone />
            </div>
            <div className="r-row tot">
              <span className="l">{t('exercises.recap.totalIncome')}</span>
              <Money value={recap.total_income} />
            </div>
            <div className="r-row">
              <span className="l">{t('exercises.recap.gamouExpenses')}</span>
              <Money value={-(recap.total_expenses - recap.total_project_expenses)} tone />
            </div>
            <div className="r-row">
              <span className="l">{t('exercises.recap.projectExpenses')}</span>
              <Money value={-recap.total_project_expenses} tone />
            </div>
            <div className="r-row tot">
              <span className="l">{t('exercises.recap.totalExpenses')}</span>
              <Money value={recap.total_expenses} />
            </div>
            <div className="r-row grand">
              <span className="l">{t('exercises.recap.finalBalance')}</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
                <Money value={recap.final_balance} />
              </span>
            </div>

            <div
              style={{ padding: '14px 16px 16px', display: 'flex', gap: 9, flexWrap: 'wrap' }}
            >
              {recap.status === 'DRAFT' && canManageExercises && (
                <Button
                  variant="contained"
                  startIcon={<LockOpen size={16} />}
                  onClick={() => setDialog('open')}
                >
                  {t('exercises.actions.open')}
                </Button>
              )}
              {recap.status === 'OPEN' && canCloseExercise && (
                <Button
                  variant="contained"
                  startIcon={<Lock size={16} />}
                  onClick={() => setDialog('close')}
                >
                  {t('exercises.actions.close')}
                </Button>
              )}
              {recap.status === 'CLOSED' && canManageExercises && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<LockOpen size={16} />}
                    onClick={() => setDialog('reopen')}
                  >
                    {t('exercises.actions.reopen')}
                  </Button>
                  {recap.final_balance > 0 && targets.length > 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Share2 size={16} />}
                      onClick={() => {
                        setTransferTarget(targets[0].value);
                        setDialog('transfer');
                      }}
                    >
                      {t('exercises.actions.transfer')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="section-title" style={{ margin: '0 0 14px' }}>
              <h2>{t('exercises.carry.title')}</h2>
              <div className="line" />
            </div>
            {carried ? (
              <div className="flow" style={{ flexDirection: 'column' }}>
                <div className="node">
                  <div className="nm">
                    {t('exercises.carry.closedNode', { name: carried.from_exercise_name })}
                  </div>
                  <div className="nv">
                    <Money value={carried.amount} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {t('exercises.carry.finalBalance')}
                  </div>
                </div>
                <div className="arr">
                  <ArrowDown size={26} />
                </div>
                <div
                  className="node"
                  style={{ borderColor: 'var(--gold)', background: 'var(--gold-soft)' }}
                >
                  <div className="nm" style={{ color: 'var(--warn)' }}>
                    {t('exercises.carry.initialNode', { name: carried.to_exercise_name })}
                  </div>
                  <div className="nv">
                    <Money value={carried.amount} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    <Trans i18nKey="exercises.carry.caption" components={{ b: <b /> }} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="empty-note" style={{ padding: 24 }}>
                  {recap?.initial_balance > 0 ? (
                    <>
                      {t('exercises.opening.current')} <Money value={recap.initial_balance} />
                    </>
                  ) : (
                    t('exercises.carry.empty')
                  )}
                </div>
                {canSetOpening && (
                  <Button
                    variant="outlined"
                    startIcon={<Landmark size={16} />}
                    onClick={openOpening}
                  >
                    {recap.initial_balance > 0
                      ? t('exercises.opening.edit')
                      : t('exercises.opening.set')}
                  </Button>
                )}
              </>
            )}

            {viewed?.closed_at && (
              <div className="stat-row" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 13 }}>
                  {t(viewed.closed_by_name ? 'exercises.closedBy' : 'exercises.closedOn', {
                    date: formatDate(viewed.closed_at),
                    name: viewed.closed_by_name,
                  })}
                </span>
              </div>
            )}
            {viewed?.reopen_reason && (
              <div className="stat-row">
                <span className="lab">{t('exercises.reopenReason')}</span>
                <span style={{ fontSize: 13 }}>{viewed.reopen_reason}</span>
              </div>
            )}

            <Callout warn>
              <Trans i18nKey="exercises.reopenNotice" components={{ b: <b /> }} />
            </Callout>
          </div>
        </div>
      )}

      <ExerciseForm
        open={isFormOpen}
        form={form}
        setForm={setForm}
        onClose={() => setFormOpen(false)}
        onSubmit={() =>
          createMutation.mutateAsync({
            name: form.name.trim(),
            year: Number(form.year),
          })
        }
      />

      <ConfirmDialog
        open={dialog === 'open'}
        title={t('exercises.confirmOpen.title')}
        description={t('exercises.confirmOpen.body', { name: viewed?.name })}
        confirmLabel={t('exercises.confirmOpen.confirm')}
        onConfirm={() => openMutation.mutateAsync(viewedId)}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'close'}
        title={t('exercises.confirmClose.title')}
        description={
          recap
            ? t('exercises.confirmClose.body', {
                amount: formatMoney(recap.final_balance),
              })
            : ''
        }
        confirmLabel={t('exercises.confirmClose.confirm')}
        onConfirm={() => closeMutation.mutateAsync(viewedId)}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'reopen'}
        title={t('exercises.confirmReopen.title')}
        description={t('exercises.confirmReopen.body')}
        confirmLabel={t('exercises.confirmReopen.confirm')}
        requireReason
        reasonLabel={t('exercises.confirmReopen.reasonLabel')}
        onConfirm={(reason) => reopenMutation.mutateAsync({ id: viewedId, reason })}
        onClose={() => setDialog(null)}
      />

      <FormDialog
        open={dialog === 'opening'}
        title={t('exercises.opening.title')}
        submitLabel={t('common.actions.save')}
        submitDisabled={opening.amount === '' || opening.reason.trim().length < 3}
        onClose={() => setDialog(null)}
        onSubmit={() =>
          openingMutation.mutateAsync({
            id: viewedId,
            amount: Number(opening.amount),
            reason: opening.reason.trim(),
          })
        }
      >
        <div className="callout">
          <span className="ic">
            <Info size={20} />
          </span>
          <span className="tx">
            <Trans i18nKey="exercises.opening.notice" components={{ b: <b /> }} />
          </span>
        </div>
        <TextField
          label={t('common.fields.amount')}
          value={opening.amount}
          onChange={(event) =>
            setOpening({ ...opening, amount: event.target.value.replace(/[^0-9]/g, '') })
          }
          size="small"
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          autoFocus
          required
        />
        <TextField
          label={t('common.fields.reason')}
          value={opening.reason}
          onChange={(event) => setOpening({ ...opening, reason: event.target.value })}
          helperText={t('exercises.opening.reasonHint')}
          size="small"
          multiline
          minRows={2}
          required
        />
      </FormDialog>

      <FormDialog
        open={dialog === 'transfer'}
        title={t('exercises.confirmTransfer.title')}
        submitLabel={t('exercises.confirmTransfer.confirm')}
        onClose={() => setDialog(null)}
        onSubmit={() =>
          transferMutation.mutateAsync({ id: viewedId, toId: transferTarget })
        }
      >
        <div className="callout">
          <span className="ic">
            <Info size={20} />
          </span>
          <span className="tx">
            <Trans i18nKey="exercises.confirmTransfer.notice" components={{ b: <b /> }} />
          </span>
        </div>
        <AppSelect
          label={t('exercises.confirmTransfer.target')}
          value={transferTarget}
          onChange={setTransferTarget}
          options={targets}
          fullWidth
        />
      </FormDialog>
    </>
  );
}

/**
 * Creation form for an exercise.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {object} props.form Current field values.
 * @param {(form: object) => void} props.setForm Updates the field values.
 * @param {() => Promise<void>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when the dialog is dismissed.
 * @returns {JSX.Element} The dialog.
 */
function ExerciseForm({ open, form, setForm, onSubmit, onClose }) {
  const { t } = useTranslation();
  return (
    <FormDialog
      open={open}
      title={t('exercises.form.title')}
      submitLabel={t('common.actions.create')}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <TextField
        label={t('exercises.form.name')}
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
        placeholder={t('exercises.form.namePlaceholder')}
        size="small"
        autoFocus
        required
      />
      <TextField
        label={t('exercises.form.year')}
        value={form.year}
        onChange={(event) =>
          setForm({ ...form, year: event.target.value.replace(/[^0-9]/g, '') })
        }
        size="small"
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        required
      />
    </FormDialog>
  );
}
