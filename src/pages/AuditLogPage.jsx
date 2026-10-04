import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import {
  ArrowRight,
  ChevronDown,
  LogIn,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ErrorNote, FilterBar, Loader, PageHeader } from '../components/ui';
import { auditActionKey, auditFieldKey, auditObjectKey } from '../constants/labels';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import i18n from '../i18n';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaras } from '../services/daara.service';
import { fetchAuditTrail, purgeAuditTrail } from '../services/reporting.service';
import { notify } from '../store/notificationStore';
import { formatDateTime } from '../utils/format';

/** Rolling windows offered, in days. Nothing loads the whole trail at once. */
const PERIODS = ['7', '30', '90', '365'];

/** Every action the trail records, in the order the filter lists them. */
const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'CANCEL',
  'CLOSE',
  'REOPEN',
  'TRANSFER',
  'ROLE_CHANGE',
  'ENTITY_CHANGE',
  'PASSWORD_SET',
];

/**
 * What an entry can be about. These are the codes the API stores and filters
 * on, never the words on screen, so translating the label cannot break the
 * filter.
 */
const OBJECT_TYPES = [
  'CONTRIBUTION',
  'DONATION',
  'EXPENSE',
  'MEETING',
  'MEMBER',
  'DAARA',
  'EXERCISE',
  'USER',
];

const PAGE_SIZE = 25;

const ICON_CLASS = {
  CREATE: 'ai-create',
  UPDATE: 'ai-update',
  CANCEL: 'ai-close',
  CLOSE: 'ai-close',
  REOPEN: 'ai-update',
  TRANSFER: 'ai-create',
  LOGIN: 'ai-login',
  LOGOUT: 'ai-login',
  ROLE_CHANGE: 'ai-update',
  ENTITY_CHANGE: 'ai-update',
  PASSWORD_SET: 'ai-login',
};

/**
 * Pick the icon matching an audited action.
 *
 * @param {string} action Action recorded in the trail.
 * @returns {JSX.Element} The icon.
 */
function actionIcon(action) {
  if (action === 'CREATE' || action === 'TRANSFER') return <Plus size={16} />;
  if (action === 'CLOSE' || action === 'CANCEL') return <Lock size={16} />;
  if (action === 'LOGIN' || action === 'LOGOUT' || action === 'PASSWORD_SET') {
    return <LogIn size={16} />;
  }
  return <Pencil size={16} />;
}

/**
 * Render one audited value in a form a person can read.
 *
 * Identifiers are replaced by the daara name they point to, since a raw
 * identifier tells the reader nothing about what changed.
 *
 * @param {unknown} value Raw value from the trail.
 * @param {Map<string, string>} daaraNames Daara identifiers to names.
 * @returns {string} The readable value.
 */
function readableValue(value, daaraNames, empty) {
  if (value === null || value === undefined) return empty;
  if (Array.isArray(value)) {
    return (
      value.map((item) => readableValue(item, daaraNames, empty)).join(', ') || empty
    );
  }
  const text = String(value);
  return daaraNames.get(text) ?? text;
}

/**
 * Render the before and after values of a change.
 *
 * Showing both sides is what makes a correction auditable: the reader sees the
 * amount that was there and the amount that replaced it.
 *
 * @param {object} props Component props.
 * @param {object|null} props.before Values before the change.
 * @param {object|null} props.after Values after the change.
 * @param {Map<string, string>} props.daaraNames Daara identifiers to names.
 * @returns {JSX.Element|null} The difference, or nothing when there is none.
 */
function ValueDiff({ before, after, daaraNames }) {
  const { t } = useTranslation();
  const empty = t('common.empty.value');
  if (!before || !after) return null;
  const keys = Object.keys(after).filter((key) => key in before);
  if (keys.length === 0) return null;

  return (
    <>
      {keys.map((key) => (
        <div className="diff" key={key}>
          <span style={{ color: 'var(--faint)' }}>
            {i18n.exists(auditFieldKey(key)) ? t(auditFieldKey(key)) : key}
          </span>
          <span className="old">{readableValue(before[key], daaraNames, empty)}</span>
          <ArrowRight size={13} className="flip-rtl" />
          <span className="new">{readableValue(after[key], daaraNames, empty)}</span>
        </div>
      ))}
    </>
  );
}

/**
 * Translate a stored code, or show it as it was stored.
 *
 * The trail keeps what was true when the entry was written, and entries
 * predating the move to stable codes hold a French word instead. Those must
 * still read as that word: an audit line is a record, and refusing to render
 * one because its vocabulary is old would put a hole in the very trail whose
 * job is to have none.
 *
 * @param {string} value The code, or the legacy label, as stored.
 * @param {(value: string) => string} toKey Builds the translation key.
 * @returns {string} The translation, or the stored value itself.
 */
function translateOrKeep(value, toKey) {
  if (!value) return '';
  const key = toKey(value);
  return i18n.exists(key) ? i18n.t(key) : value;
}

/**
 * Audit trail: who did what, when and on which record.
 *
 * The trail never stops growing, so the screen never asks for all of it. Reads
 * are bounded by a rolling window, connections are set aside unless asked for,
 * and older entries arrive by cursor as the reader asks for them.
 *
 * @returns {JSX.Element} The screen.
 */
export default function AuditLogPage() {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();
  const [actionFilter, setActionFilter] = useState('');
  const [objectFilter, setObjectFilter] = useState('');
  const [period, setPeriod] = useState('30');
  const [showSessions, setShowSessions] = useState(false);
  const [isPurgeOpen, setPurgeOpen] = useState(false);

  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });

  const purgeMutation = useDomainMutation('audit', purgeAuditTrail, {
    onSuccess: (result) => notify(t('audit.purge.done', { total: result.deleted })),
  });

  const audit = useInfiniteQuery({
    queryKey: ['audit', actionFilter, objectFilter, period, showSessions],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      fetchAuditTrail({
        action: actionFilter || undefined,
        object_type: objectFilter || undefined,
        days: Number(period),
        include_sessions: showSessions,
        cursor: pageParam || undefined,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  if (audit.isLoading) return <Loader />;
  if (audit.error) return <ErrorNote message={extractErrorMessage(audit.error)} />;

  const entries = audit.data.pages.flatMap((page) => page.items);
  const daaraNames = new Map(
    (daaras.data ?? []).map((daara) => [daara.id, daara.name]),
  );
  const periodLabel = t(`audit.periodsLower.${period}`);

  return (
    <>
      <PageHeader
        title={t('audit.title')}
        subtitle={t('audit.subtitle', { period: periodLabel })}
        actions={
          isSuperAdmin && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Trash2 size={16} />}
              onClick={() => setPurgeOpen(true)}
            >
              {t('audit.purge.action')}
            </Button>
          )
        }
      />

      <FilterBar>
        <AppSelect
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((value) => ({
            value,
            label: t(`audit.periods.${value}`),
          }))}
          sx={{ minWidth: 190 }}
        />
        <AppSelect
          value={actionFilter}
          onChange={setActionFilter}
          options={ACTIONS.map((value) => ({ value, label: t(auditActionKey(value)) }))}
          allowEmpty
          placeholder={t('common.filters.allActions')}
          sx={{ minWidth: 200 }}
        />
        <AppSelect
          value={objectFilter}
          onChange={setObjectFilter}
          options={OBJECT_TYPES.map((value) => ({
            value,
            label: t(auditObjectKey(value)),
          }))}
          allowEmpty
          placeholder={t('common.filters.allObjects')}
          sx={{ minWidth: 180 }}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showSessions}
              onChange={(event) => setShowSessions(event.target.checked)}
            />
          }
          label={t('audit.showLogins')}
          sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: 13.5 } }}
        />
      </FilterBar>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-note">{t('audit.empty')}</div>
        ) : (
          entries.map((entry) => (
            <div className="audit-item" key={entry.id}>
              <div className={`ai-ic ${ICON_CLASS[entry.action] ?? 'ai-login'}`}>
                {actionIcon(entry.action)}
              </div>
              <div className="ai-body">
                <div className="ai-top">
                  <span className="ai-act">{entry.user_label}</span>
                  <span className="ai-tag">{translateOrKeep(entry.action, auditActionKey)}</span>
                  <span className="chip" style={{ padding: '2px 8px' }}>
                    {translateOrKeep(entry.object_type, auditObjectKey)}
                  </span>
                </div>
                {entry.object_label && <div className="ai-det">{entry.object_label}</div>}
                <ValueDiff
                  before={entry.before_state}
                  after={entry.after_state}
                  daaraNames={daaraNames}
                />
                {entry.reason && (
                  <div className="ai-det" style={{ fontStyle: 'italic' }}>
                    {t('common.reasonPrefix', { reason: entry.reason })}
                  </div>
                )}
              </div>
              <div className="ai-time">{formatDateTime(entry.occurred_at)}</div>
            </div>
          ))
        )}
      </div>

      {audit.hasNextPage && (
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 16 }}>
          <Button
            variant="outlined"
            onClick={() => audit.fetchNextPage()}
            disabled={audit.isFetchingNextPage}
            startIcon={
              audit.isFetchingNextPage ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <ChevronDown size={16} />
              )
            }
          >
            {t('common.actions.loadMore')}
          </Button>
        </div>
      )}

      <div className="callout">
        <span className="ic">
          <ShieldCheck size={20} />
        </span>
        <span className="tx">
          <Trans i18nKey="audit.notice" components={{ b: <b /> }} />
        </span>
      </div>

      <ConfirmDialog
        open={isPurgeOpen}
        title={t('audit.purge.title')}
        description={t('audit.purge.body')}
        confirmLabel={t('audit.purge.confirm')}
        danger
        onConfirm={() => purgeMutation.mutateAsync()}
        onClose={() => setPurgeOpen(false)}
      />
    </>
  );
}
