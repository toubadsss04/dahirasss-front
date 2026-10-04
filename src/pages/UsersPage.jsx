import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { KeyRound, Plus, UserPen } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import MemberPicker from '../components/forms/MemberPicker';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormDialog from '../components/ui/FormDialog';
import DuplicateMemberDialog from '../components/users/DuplicateMemberDialog';
import {
  Callout,
  DataTable,
  ErrorNote,
  Loader,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { ALLOWED_EMAIL_DOMAIN } from '../constants/accounts';
import { accountStatusKey, roleKey } from '../constants/labels';

import { ROLES } from '../constants/navigation';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaras } from '../services/daara.service';
import { fetchAllMembers } from '../services/members.service';
import {
  createUser,
  fetchMemberMatches,
  fetchUsers,
  membersWithoutAccount,
  resetUserPassword,
  updateUser,
  withMember,
} from '../services/users.service';
import { useAuthStore } from '../store/authStore';
import { avatarColor, formatDateTime, personInitials } from '../utils/format';
import { validateAccountEmail } from '../utils/validation';

/** Authorisation states an account can be put in, in the order offered. */
const ACCOUNT_STATUSES = ['PENDING_APPROVAL', 'ACTIVE', 'DISABLED'];

/** Where a new account comes from: a new person, or a member already recorded. */
const ACCOUNT_SOURCES = {
  NEW: 'NEW',
  MEMBER: 'MEMBER',
};

const EMPTY_FORM = {
  source: ACCOUNT_SOURCES.NEW,
  member: null,
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: ROLES.ENTITY_MANAGER,
  member_entity_id: '',
  can_close_exercise: false,
  account_status: 'ACTIVE',
};

const STATUS_TONES = {
  ACTIVE: 'active',
  PENDING_APPROVAL: 'draft',
  DISABLED: 'inactive',
};

/**
 * Account management, reserved to the super administrator.
 *
 * Accounts are created without a password: the person chooses their own on
 * first sign-in, so no secret ever passes through an administrator. Every
 * account acts on all sections; no section is put in anyone's charge.
 *
 * An account is made either for a new person, who may be recorded as a member
 * of a section at the same time, or from a member already recorded, which is
 * how someone added as a member is later given access. When the name typed
 * for a new person is already a member's, a warning offers to use that member
 * instead, so the same person is never recorded twice.
 *
 * @returns {JSX.Element} The screen.
 */
export default function UsersPage() {
  const { t } = useTranslation();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toReset, setToReset] = useState(null);
  const [matches, setMatches] = useState(null);
  const syncEditedAccount = useAuthStore((state) => state.syncEditedAccount);

  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });
  const members = useQuery({
    queryKey: ['members', 'all-active'],
    queryFn: () => fetchAllMembers({ status: 'ACTIVE' }),
    enabled: isFormOpen && !editing,
  });

  const createMutation = useDomainMutation('user', createUser, {
    successMessage: t('users.created'),
  });
  const updateMutation = useDomainMutation(
    'user',
    ({ id, payload }) => updateUser(id, payload),
    { successMessage: t('users.updated'), onSuccess: syncEditedAccount },
  );
  const resetMutation = useDomainMutation('user', resetUserPassword, {
    successMessage: t('users.passwordCleared'),
  });

  if (users.isLoading) return <Loader />;
  if (users.error) return <ErrorNote message={extractErrorMessage(users.error)} />;

  const daaraList = daaras.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (account) => {
    setEditing(account);
    setForm({
      ...EMPTY_FORM,
      email: account.email,
      first_name: account.first_name,
      last_name: account.last_name,
      phone: account.phone ?? '',
      role: account.role,
      member_entity_id: account.member_entity_id ?? '',
      can_close_exercise: account.can_close_exercise,
      account_status: account.account_status,
    });
    setFormOpen(true);
  };

  const fromMember = !editing && form.source === ACCOUNT_SOURCES.MEMBER;
  const linkableMembers = membersWithoutAccount(members.data ?? [], users.data ?? []);
  const memberDaaraName = fromMember
    ? daaraList.find((daara) => daara.id === form.member?.entity_id)?.name
    : null;
  const emailError = editing ? null : validateAccountEmail(form.email, ALLOWED_EMAIL_DOMAIN);
  const showEmailError = Boolean(emailError) && form.email.trim() !== '';

  const buildCreatePayload = (payload) => ({
    ...payload,
    email: form.email.trim(),
    member_entity_id: fromMember ? null : form.member_entity_id || null,
    member_id: fromMember ? (form.member?.id ?? null) : null,
  });

  const submit = async () => {
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      role: form.role,
      can_close_exercise: form.can_close_exercise,
      account_status: form.account_status,
    };
    if (editing) {
      const membership =
        !editing.member_id && form.member_entity_id
          ? { member_entity_id: form.member_entity_id }
          : {};
      return updateMutation.mutateAsync({ id: editing.id, payload: { ...payload, ...membership } });
    }
    if (!fromMember) {
      const found = await fetchMemberMatches(payload.first_name, payload.last_name);
      if (found.length > 0) {
        setMatches(found);
        return false;
      }
    }
    return createMutation.mutateAsync(buildCreatePayload(payload));
  };

  const useMatchedMember = (member) => {
    setForm(withMember({ ...form, source: ACCOUNT_SOURCES.MEMBER }, member));
    setMatches(null);
  };

  const createAnyway = async () => {
    await createMutation.mutateAsync(
      buildCreatePayload({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        can_close_exercise: form.can_close_exercise,
        account_status: form.account_status,
      }),
    );
    setMatches(null);
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}>
            {t('users.add')}
          </Button>
        }
      />

      <Callout>
        <Trans i18nKey="users.notice" components={{ b: <b /> }} />
      </Callout>

      <DataTable
        columns={[
          { key: 'user', label: t('users.columns.user') },
          { key: 'role', label: t('users.columns.role') },
          { key: 'daaras', label: t('users.columns.daaras') },
          { key: 'status', label: t('users.columns.status') },
          { key: 'password', label: t('users.columns.password') },
          { key: 'last', label: t('users.columns.lastLogin') },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={users.data}
        emptyMessage={t('users.empty')}
        renderRow={(account) => (
          <tr key={account.id}>
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
                    background: avatarColor(account.full_name),
                    flex: '0 0 auto',
                  }}
                >
                  {personInitials(account)}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{account.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {account.email}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span className="chip">{t(roleKey(account.role))}</span>
            </td>
            <td>
              {account.member_entity_name ? (
                <span className="chip">{account.member_entity_name}</span>
              ) : (
                t('common.empty.value')
              )}
            </td>
            <td>
              <StatusBadge
                label={t(accountStatusKey(account.account_status))}
                tone={STATUS_TONES[account.account_status]}
              />
            </td>
            <td>
              <span className="chip">
                {account.has_password ? t('users.passwordSet') : t('users.passwordPending')}
              </span>
            </td>
            <td className="num">
              {account.last_login_at
                ? formatDateTime(account.last_login_at)
                : t('common.empty.value')}
            </td>
            <td className="r" style={{ width: '1%', whiteSpace: 'nowrap' }}>
              <Button
                size="small"
                startIcon={<UserPen size={14} />}
                onClick={() => openEdit(account)}
              >
                {t('common.actions.edit')}
              </Button>
              {account.has_password && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<KeyRound size={14} />}
                  onClick={() => setToReset(account)}
                >
                  {t('users.reset')}
                </Button>
              )}
            </td>
          </tr>
        )}
      />

      <FormDialog
        open={isFormOpen}
        title={editing ? t('users.form.edit') : t('users.form.create')}
        submitLabel={editing ? t('common.actions.save') : t('common.actions.create')}
        maxWidth="sm"
        onClose={() => setFormOpen(false)}
        submitDisabled={Boolean(emailError) || (fromMember && !form.member)}
        onSubmit={submit}
      >
        {!editing && (
          <RadioGroup
            row
            value={form.source}
            onChange={(event) =>
              setForm({ ...EMPTY_FORM, email: form.email, source: event.target.value })
            }
          >
            <FormControlLabel
              value={ACCOUNT_SOURCES.NEW}
              control={<Radio size="small" />}
              label={t('users.form.sourceNew')}
            />
            <FormControlLabel
              value={ACCOUNT_SOURCES.MEMBER}
              control={<Radio size="small" />}
              label={t('users.form.sourceMember')}
            />
          </RadioGroup>
        )}
        {fromMember && (
          <MemberPicker
            members={
              form.member && !linkableMembers.some((m) => m.id === form.member.id)
                ? [form.member, ...linkableMembers]
                : linkableMembers
            }
            value={form.member}
            onChange={(member) => setForm(withMember(form, member))}
            disabled={members.isLoading}
            helperText={
              memberDaaraName
                ? t('users.form.memberDaaraInfo', { name: memberDaaraName })
                : t('users.form.memberHint')
            }
          />
        )}
        {!editing && (
          <TextField
            label={t('users.form.email')}
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder={`prenom.nom@${ALLOWED_EMAIL_DOMAIN}`}
            error={showEmailError}
            helperText={showEmailError ? emailError : `@${ALLOWED_EMAIL_DOMAIN}`}
            size="small"
            autoFocus
            required
          />
        )}
        <TextField
          label={t('users.form.firstName')}
          value={form.first_name}
          onChange={(event) => setForm({ ...form, first_name: event.target.value })}
          size="small"
          disabled={fromMember}
          required
        />
        <TextField
          label={t('users.form.lastName')}
          value={form.last_name}
          onChange={(event) => setForm({ ...form, last_name: event.target.value })}
          size="small"
          disabled={fromMember}
          required
        />
        <TextField
          label={t('common.fields.phone')}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          size="small"
        />
        <AppSelect
          label={t('users.form.role')}
          value={form.role}
          onChange={(value) => setForm({ ...form, role: value })}
          options={[
            { value: ROLES.ENTITY_MANAGER, label: t(roleKey(ROLES.ENTITY_MANAGER)) },
            { value: ROLES.RENTAL_MANAGER, label: t(roleKey(ROLES.RENTAL_MANAGER)) },
            { value: ROLES.SUPER_ADMIN, label: t(roleKey(ROLES.SUPER_ADMIN)) },
          ]}
          fullWidth
        />

        {((!editing && !fromMember) || (editing && !editing.member_id)) && (
          <AppSelect
            label={t('users.form.memberDaara')}
            value={form.member_entity_id}
            onChange={(value) => setForm({ ...form, member_entity_id: value })}
            options={daaraList.map((daara) => ({ value: daara.id, label: daara.name }))}
            allowEmpty
            placeholder={t('users.form.noMembership')}
            fullWidth
          />
        )}

        <AppSelect
          label={t('users.form.accountStatus')}
          value={form.account_status}
          onChange={(value) => setForm({ ...form, account_status: value })}
          options={ACCOUNT_STATUSES.map((value) => ({
            value,
            label: t(accountStatusKey(value)),
          }))}
          fullWidth
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.can_close_exercise}
              onChange={(event) =>
                setForm({ ...form, can_close_exercise: event.target.checked })
              }
            />
          }
          label={t('users.form.canClose')}
        />
      </FormDialog>

      <DuplicateMemberDialog
        matches={matches}
        onUseMember={useMatchedMember}
        onCreateAnyway={createAnyway}
        onClose={() => setMatches(null)}
      />

      <ConfirmDialog
        open={Boolean(toReset)}
        title={t('users.confirmReset.title')}
        description={t('users.confirmReset.body', { name: toReset?.full_name })}
        confirmLabel={t('users.confirmReset.confirm')}
        danger
        onConfirm={() => resetMutation.mutateAsync(toReset.id)}
        onClose={() => setToReset(null)}
      />
    </>
  );
}
