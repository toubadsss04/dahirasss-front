import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { ChevronLeft, Coins, Lock, Pencil, Plus, Search, Target, Users } from 'lucide-react';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import DaaraLabel from '../components/ui/DaaraLabel';
import ContributorPaymentsDialog from '../components/projects/ContributorPaymentsDialog';
import Pager from '../components/projects/Pager';
import ProgressBar from '../components/projects/ProgressBar';
import ProjectCloseDialog from '../components/projects/ProjectCloseDialog';
import ProjectFormDialog from '../components/projects/ProjectFormDialog';
import ProjectPaymentDialog from '../components/projects/ProjectPaymentDialog';
import {
  Callout,
  DataTable,
  ErrorNote,
  FilterBar,
  KpiCard,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { operationStatusKey, projectStatusKey } from '../constants/labels';
import {
  CONTRIBUTORS_PAGE_SIZE,
  PROJECT_STATUSES,
  SEARCH_DEBOUNCE_MS,
} from '../constants/projects';
import { ROUTES } from '../constants/routes';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaraNames } from '../services/daara.service';
import {
  cancelProjectPayment,
  closeProject,
  createProjectPayment,
  emptyPaymentForm,
  excessAmount,
  fetchContributorPayments,
  fetchProject,
  fetchProjectContributors,
  fetchProjectMemberOptions,
  fetchSimilarPayments,
  gamouExerciseOptions,
  isFullyCancelled,
  isPaymentFormValid,
  projectPotMovements,
  projectShares,
  isProjectFormValid,
  progressPercent,
  remainingAmount,
  toPaymentCreate,
  toPaymentForm,
  toPaymentUpdate,
  toProjectForm,
  toProjectUpdate,
  updateProject,
  updateProjectPayment,
} from '../services/projects.service';
import { fetchDonations, fetchExpenses } from '../services/finance.service';
import { useExerciseStore } from '../store/exerciseStore';
import { avatarColor, formatDate, formatMoney, initials } from '../utils/format';

/**
 * One project: its figures, the people who gave and what each one gave.
 *
 * Only contributors with at least one active payment are listed, since a
 * contributor exists from their first payment. When the project asks a set
 * amount of each person, every row shows how far along that person is.
 *
 * A project belongs to the whole Daara, so every account records payments
 * for any member, whatever their daara. Each person corrects the payments
 * they recorded, and every payment says who recorded it. Before a payment is
 * saved, a recent one of the same amount for the same person is reported, so
 * money handed from one manager to another is not recorded twice.
 *
 * The super administrator corrects any payment, cancels one, corrects the
 * project, sets its cost once known and closes it. A closed project is read
 * only for everyone.
 *
 * @returns {JSX.Element} The screen.
 */
export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const exercises = useExerciseStore((state) => state.exercises);
  const categories = useQuery({ queryKey: ['daara-names'], queryFn: fetchDaaraNames });
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    canManageProjects,
    canRecordProjectPayments,
    canCancelProjectPayments,
    canCorrectProjectPayment,
  } = usePermissions();

  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [projectForm, setProjectForm] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);
  const [editedPayment, setEditedPayment] = useState(null);
  const [similar, setSimilar] = useState(null);
  const [isClosing, setClosing] = useState(false);
  const [shownContributor, setShownContributor] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });
  const contributors = useQuery({
    queryKey: ['project-contributors', projectId, debouncedSearch, offset],
    queryFn: () =>
      fetchProjectContributors(projectId, {
        search: debouncedSearch || undefined,
        limit: CONTRIBUTORS_PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });
  const potDonations = useQuery({
    queryKey: ['donations', 'project', projectId],
    queryFn: () => fetchDonations({ project_id: projectId, limit: 200 }),
  });
  const potExpenses = useQuery({
    queryKey: ['expenses', 'project', projectId],
    queryFn: () => fetchExpenses({ project_id: projectId, limit: 200 }),
  });
  const payments = useQuery({
    queryKey: ['project-payments', projectId, shownContributor?.id],
    queryFn: () => fetchContributorPayments(projectId, shownContributor.id),
    enabled: Boolean(shownContributor),
  });
  const members = useQuery({
    queryKey: ['project-member-options'],
    queryFn: fetchProjectMemberOptions,
    enabled: Boolean(paymentForm) && !paymentForm.contributor,
  });

  const updateMutation = useDomainMutation(
    'project',
    (payload) => updateProject(projectId, payload),
    { successMessage: t('projects.updated') },
  );
  const closeMutation = useDomainMutation(
    'project',
    (payload) => closeProject(projectId, payload),
    { successMessage: t('projects.closed') },
  );
  const paymentUpdateMutation = useDomainMutation(
    'projectPayment',
    ({ id, payload }) => updateProjectPayment(projectId, id, payload),
    { successMessage: t('projects.payment.updated') },
  );
  const paymentMutation = useDomainMutation(
    'projectPayment',
    (payload) => createProjectPayment(projectId, payload),
    { successMessage: t('projects.payment.saved') },
  );
  const cancelMutation = useDomainMutation(
    'projectPayment',
    ({ id, reason }) => cancelProjectPayment(projectId, id, reason),
    { successMessage: t('projects.payment.cancelled') },
  );

  if (project.isLoading) return <Loader />;
  if (project.error) return <ErrorNote message={extractErrorMessage(project.error)} />;

  const record = project.data;
  const exerciseOptions = gamouExerciseOptions(exercises);
  if (record.exercise_id && !exerciseOptions.some((o) => o.value === record.exercise_id)) {
    exerciseOptions.unshift({ value: record.exercise_id, label: record.exercise_name });
  }
  const isOpen = record.status === PROJECT_STATUSES.OPEN;
  const canEditProject = canManageProjects && isOpen;
  const canRecord = canRecordProjectPayments && isOpen;
  const canCancel = canCancelProjectPayments && isOpen;
  const shares = projectShares(record);
  const hasShare = shares.length > 0;
  const rows = contributors.data?.items ?? [];
  const total = contributors.data?.total ?? 0;

  const initialProjectForm = toProjectForm(record);
  const projectUpdate = projectForm ? toProjectUpdate(initialProjectForm, projectForm) : {};

  const openPayment = (contributor = null) => {
    setShownContributor(null);
    setEditedPayment(null);
    setPaymentForm(emptyPaymentForm(contributor));
  };

  const openPaymentEdit = (payment) => {
    const initial = toPaymentForm(payment, shownContributor);
    setShownContributor(null);
    setEditedPayment({ id: payment.id, initial });
    setPaymentForm(initial);
  };

  const paymentUpdate =
    editedPayment && paymentForm ? toPaymentUpdate(editedPayment.initial, paymentForm) : {};
  const canSubmitPayment =
    Boolean(paymentForm) &&
    isPaymentFormValid(paymentForm) &&
    (!editedPayment || Object.keys(paymentUpdate).length > 0);

  const submitPayment = async () => {
    if (editedPayment) {
      return paymentUpdateMutation.mutateAsync({ id: editedPayment.id, payload: paymentUpdate });
    }
    const payload = toPaymentCreate(paymentForm);
    const found = await fetchSimilarPayments(projectId, payload);
    if (found.length > 0) {
      setSimilar({ payload, payment: found[0] });
      return false;
    }
    return paymentMutation.mutateAsync(payload);
  };

  const recordDespiteSimilar = async () => {
    await paymentMutation.mutateAsync(similar.payload);
    setPaymentForm(null);
  };

  const closePaymentForm = () => {
    setPaymentForm(null);
    setEditedPayment(null);
  };

  return (
    <>
      <button type="button" className="back" onClick={() => navigate(ROUTES.projects)}>
        <ChevronLeft size={15} className="flip-rtl" /> {t('projects.detail.back')}
      </button>

      <PageHeader
        title={record.name}
        subtitle={[
          record.is_gamou
            ? t('projects.detail.gamou', { name: record.exercise_name })
            : t('projects.outsideGamou'),
          t('projects.detail.createdOn', { date: formatDate(record.created_at) }),
          record.created_by_name && t('common.recordedBy', { name: record.created_by_name }),
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          (canEditProject || canRecord) && (
            <>
              {canEditProject && (
                <>
                  <Button
                color="inherit"
                startIcon={<Pencil size={15} />}
                    onClick={() => setProjectForm(initialProjectForm)}
                  >
                    {t('common.actions.edit')}
                  </Button>
                  <Button
                    color="error"
                    startIcon={<Lock size={15} />}
                    onClick={() => setClosing(true)}
                  >
                    {t('projects.close.action')}
                  </Button>
                </>
              )}
              {canRecord && (
                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  onClick={() => openPayment()}
                >
                  {t('projects.payment.add')}
                </Button>
              )}
            </>
          )
        }
      />

      <div className="filters" style={{ alignItems: 'center' }}>
        <StatusBadge
          label={t(projectStatusKey(record.status))}
          tone={isOpen ? 'open' : 'closed'}
        />
        {shares.map((item) => (
          <span className="chip" key={item.label ?? 'all'}>
            {item.label
              ? t('projects.detail.sharePerCategory', { name: item.label })
              : t('projects.detail.sharePerMember')}{' '}
            <Money value={item.amount} />
          </span>
        ))}
      </div>

      {record.description && <Callout>{record.description}</Callout>}

      {!isOpen && (
        <Callout warn>
          {t('projects.detail.closedNotice', {
            date: formatDate(record.closed_at),
            name: record.closed_by_name ?? t('common.empty.value'),
          })}{' '}
          <b>
            <Money value={record.closed_amount ?? 0} />
          </b>
          {record.close_reason && (
            <div>{t('common.reasonPrefix', { reason: record.close_reason })}</div>
          )}
        </Callout>
      )}

      <div className="grid kpis" style={{ marginBottom: 18 }}>
        <KpiCard
          label={t('projects.kpi.collected')}
          value={record.collected}
          icon={<Coins size={16} />}
          accent
        />
        <KpiCard
          label={t('projects.kpi.cost')}
          value={record.cost ?? 0}
          icon={<Target size={16} />}
          meta={record.cost ? undefined : t('projects.costUnknown')}
        />
        <KpiCard
          label={t('projects.kpi.remaining')}
          value={remainingAmount(record.collected, record.cost) ?? 0}
          icon={<Target size={16} />}
          meta={
            record.cost
              ? t('projects.kpi.progress', {
                  percent: progressPercent(record.collected, record.cost),
                })
              : t('projects.costUnknown')
          }
        />
        <div className="card kpi">
          <div className="k-top">
            <span className="k-ic">
              <Users size={16} />
            </span>{' '}
            {t('projects.kpi.contributors')}
          </div>
          <div className="k-val num">{record.contributors_count}</div>
        </div>
      </div>

      <div className="card recap" style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ padding: '14px 16px 2px', margin: 0 }}>
          <h2>{t('projects.pot.title')}</h2>
          <div className="line" />
        </div>
        <div className="r-row">
          <span className="l">{t('projects.pot.collected')}</span>
          <Money value={record.collected} tone />
        </div>
        <div className="r-row">
          <span className="l">{t('projects.pot.donations')}</span>
          <Money value={record.total_donations} tone />
        </div>
        <div className="r-row">
          <span className="l">{t('projects.pot.expenses')}</span>
          <Money value={-record.total_expenses} tone />
        </div>
        <div className="r-row grand">
          <span className="l">{t('projects.pot.balance')}</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>
            <Money value={record.balance} />
          </span>
        </div>
        <DataTable
          columns={[
            { key: 'date', label: t('projects.pot.columns.date') },
            { key: 'kind', label: t('projects.pot.columns.kind') },
            { key: 'label', label: t('projects.pot.columns.label') },
            { key: 'amount', label: t('projects.pot.columns.amount'), align: 'right' },
          ]}
          rows={projectPotMovements(potDonations.data?.items, potExpenses.data?.items)}
          emptyMessage={t('projects.pot.empty')}
          renderRow={(movement) => {
            const cancelled = movement.status === 'CANCELLED';
            return (
              <tr key={`${movement.kind}-${movement.id}`}>
                <td className="num">{formatDate(movement.date)}</td>
                <td>
                  <span className="chip">{t(`projects.pot.kinds.${movement.kind}`)}</span>
                </td>
                <td>{movement.label}</td>
                <td className="r">
                  <Money value={movement.signed} tone={!cancelled} strike={cancelled} />
                </td>
              </tr>
            );
          }}
        />
      </div>

      <div className="section-title">
        <h2>{t('projects.detail.contributorsTitle')}</h2>
        <div className="line" />
      </div>

      <FilterBar>
        <TextField
          placeholder={t('projects.detail.searchContributor')}
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
      </FilterBar>

      {contributors.isLoading && <Loader />}
      {contributors.error && (
        <ErrorNote message={extractErrorMessage(contributors.error)} />
      )}

      {contributors.data && (
        <>
          <DataTable
            columns={[
              { key: 'name', label: t('projects.contributors.name') },
              { key: 'origin', label: t('projects.contributors.origin') },
              { key: 'payments', label: t('projects.contributors.payments'), align: 'right' },
              { key: 'last', label: t('projects.contributors.lastPayment') },
              { key: 'paid', label: t('projects.contributors.paid'), align: 'right' },
              ...(hasShare
                ? [{ key: 'share', label: t('projects.contributors.share') }]
                : []),
            ]}
            rows={rows}
            emptyMessage={t('projects.contributors.empty')}
            renderRow={(row) => {
              const left = remainingAmount(row.total_paid, row.share);
              const excess = excessAmount(row.total_paid, row.share);
              const cancelled = isFullyCancelled(row);
              return (
                <tr key={row.id} className="clickable" onClick={() => setShownContributor(row)}>
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
                          background: avatarColor(row.full_name),
                          flex: '0 0 auto',
                        }}
                      >
                        {initials(row.full_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{row.full_name}</div>
                        {cancelled && (
                          <StatusBadge
                            label={t(operationStatusKey('CANCELLED'))}
                            tone="cancel"
                          />
                        )}
                        {row.phone && (
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            <bdi dir="ltr">{row.phone}</bdi>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {row.is_external ? (
                      <span className="chip">{t('projects.contributors.external')}</span>
                    ) : (
                      <DaaraLabel name={row.entity_name} />
                    )}
                  </td>
                  <td className="r num">
                    {row.payments_count}
                    {row.cancelled_payments_count > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t('projects.contributors.cancelledCount', {
                          count: row.cancelled_payments_count,
                        })}
                      </div>
                    )}
                  </td>
                  <td className="num">
                    {row.last_payment_date
                      ? formatDate(row.last_payment_date)
                      : t('common.empty.value')}
                  </td>
                  <td className="r">
                    {cancelled ? (
                      <Money value={row.cancelled_total} strike />
                    ) : (
                      <Money value={row.total_paid} />
                    )}
                  </td>
                  {hasShare && !row.share && (
                    <td style={{ color: 'var(--faint)' }}>{t('common.empty.value')}</td>
                  )}
                  {hasShare && row.share && (
                    <td>
                      <ProgressBar percent={progressPercent(row.total_paid, row.share)} />
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {left > 0 && (
                          <>
                            {t('projects.contributors.left')} <Money value={left} />
                          </>
                        )}
                        {left === 0 && excess === 0 && t('projects.contributors.settled')}
                        {excess > 0 && (
                          <>
                            {t('projects.contributors.beyond')}{' '}
                            <Money value={excess} signed tone />
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            }}
          />
          <Pager
            total={total}
            offset={offset}
            limit={CONTRIBUTORS_PAGE_SIZE}
            onChange={setOffset}
          />
        </>
      )}

      <ContributorPaymentsDialog
        contributor={shownContributor}
        payments={payments.data}
        isLoading={payments.isLoading}
        error={payments.error ? extractErrorMessage(payments.error) : undefined}
        canRecord={canRecord}
        canCorrect={canCorrectProjectPayment}
        canCancel={canCancel}
        onAddPayment={() => openPayment(shownContributor)}
        onEditPayment={openPaymentEdit}
        onCancelPayment={setToCancel}
        onClose={() => setShownContributor(null)}
      />

      {projectForm && (
        <ProjectFormDialog
          open={Boolean(projectForm)}
          editing
          form={projectForm}
          onChange={setProjectForm}
          submitDisabled={
            !isProjectFormValid(projectForm) || Object.keys(projectUpdate).length === 0
          }
          onSubmit={() => updateMutation.mutateAsync(projectUpdate)}
          onClose={() => setProjectForm(null)}
          exerciseOptions={exerciseOptions}
          defaultExerciseId={exerciseOptions[0]?.value ?? ''}
          gamouLocked={record.contributors_count > 0}
          categories={categories.data ?? []}
        />
      )}

      {paymentForm && (
        <ProjectPaymentDialog
          open={Boolean(paymentForm)}
          editing={Boolean(editedPayment)}
          form={paymentForm}
          onChange={setPaymentForm}
          members={members.data ?? []}
          membersLoading={members.isLoading}
          submitDisabled={!canSubmitPayment}
          onSubmit={submitPayment}
          onClose={closePaymentForm}
        />
      )}

      <ProjectCloseDialog
        open={isClosing}
        projectName={record.name}
        collected={record.collected}
        onSubmit={(payload) => closeMutation.mutateAsync(payload)}
        onClose={() => setClosing(false)}
      />

      <ConfirmDialog
        open={Boolean(similar)}
        title={t('projects.payment.similar.title')}
        description={
          similar &&
          t('projects.payment.similar.body', {
            amount: formatMoney(similar.payment.amount),
            name: similar.payment.created_by_name ?? t('common.empty.value'),
            date: formatDate(similar.payment.payment_date),
          })
        }
        confirmLabel={t('projects.payment.similar.confirm')}
        onConfirm={recordDespiteSimilar}
        onClose={() => setSimilar(null)}
      />

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={t('projects.payment.confirmCancel.title')}
        description={t('projects.payment.confirmCancel.body', {
          name: shownContributor?.full_name,
        })}
        confirmLabel={t('projects.payment.confirmCancel.confirm')}
        requireReason
        danger
        onConfirm={(reason) => cancelMutation.mutateAsync({ id: toCancel.id, reason })}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
