import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { Plus, Search } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import DaaraLabel from '../components/ui/DaaraLabel';
import FormDialog from '../components/ui/FormDialog';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { memberStatusKey } from '../constants/labels';
import { ROUTES, buildPath } from '../constants/routes';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaras } from '../services/daara.service';
import {
  createMember,
  fetchAllMembers,
  filterMembers,
} from '../services/members.service';
import { avatarColor, formatDate, personInitials } from '../utils/format';

const EMPTY_FORM = { first_name: '', last_name: '', phone: '', entity_id: '' };

/**
 * List of members with filters and creation.
 *
 * Every account sees and opens every member, whatever their section.
 *
 * The section and status filters are sent to the API, since they change rarely.
 * The search is not: it runs in the browser over the list already loaded, so
 * typing a name costs no request and never replaces the screen with a loader.
 *
 * @returns {JSX.Element} The screen.
 */
export default function MembersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [daaraFilter, setDaaraFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const daaras = useQuery({ queryKey: ['daaras'], queryFn: () => fetchDaaras() });

  const members = useQuery({
    queryKey: ['members', 'all', { daaraFilter, statusFilter }],
    queryFn: () =>
      fetchAllMembers({
        entity_id: daaraFilter || undefined,
        status: statusFilter || undefined,
      }),
  });
  const visibleMembers = useMemo(
    () => filterMembers(members.data ?? [], search),
    [members.data, search],
  );

  const createMutation = useDomainMutation('member', createMember, {
    successMessage: t('members.created'),
  });

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  if (members.isLoading) return <Loader />;
  if (members.error) return <ErrorNote message={extractErrorMessage(members.error)} />;

  const daaraOptions = (daaras.data ?? []).map((daara) => ({
    value: daara.id,
    label: daara.name,
  }));

  return (
    <>
      <PageHeader
        title={t('members.title')}
        subtitle={t('members.subtitle', { count: members.data.length })}
        actions={
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openForm}>
            {t('members.add')}
          </Button>
        }
      />

      <FilterBar>
        <TextField
          placeholder={t('members.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
        {daaraOptions.length > 1 && (
          <AppSelect
            value={daaraFilter}
            onChange={setDaaraFilter}
            options={daaraOptions}
            allowEmpty
            placeholder={t('common.filters.allDaaras')}
            sx={{ minWidth: 170 }}
          />
        )}
        <AppSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ACTIVE', label: t(memberStatusKey('ACTIVE')) },
            { value: 'INACTIVE', label: t(memberStatusKey('INACTIVE')) },
          ]}
          allowEmpty
          placeholder={t('common.filters.allStatuses')}
          sx={{ minWidth: 150 }}
        />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'member', label: t('members.columns.member') },
          { key: 'phone', label: t('members.columns.phone') },
          { key: 'daara', label: t('members.columns.daara') },
          { key: 'joined', label: t('members.columns.joined') },
          { key: 'status', label: t('members.columns.status') },
        ]}
        rows={visibleMembers}
        emptyMessage={t('members.empty')}
        renderRow={(member) => (
          <tr
            key={member.id}
            className="click"
            onClick={() => navigate(buildPath(ROUTES.memberDetail, { memberId: member.id }))}
            style={{ cursor: 'pointer' }}
          >
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
                    background: avatarColor(member.full_name),
                    flex: '0 0 auto',
                  }}
                >
                  {personInitials(member)}
                </div>
                <span style={{ fontWeight: 600 }}>{member.full_name}</span>
              </div>
            </td>
            <td className="num">{member.phone || t('common.empty.value')}</td>
            <td>
              <DaaraLabel name={member.entity_name} />
            </td>
            <td className="num">{formatDate(member.joined_on)}</td>
            <td>
              <StatusBadge
                label={t(memberStatusKey(member.status))}
                tone={member.status === 'ACTIVE' ? 'active' : 'inactive'}
              />
            </td>
          </tr>
        )}
      />

      <FormDialog
        open={isFormOpen}
        title={t('members.form.title')}
        submitLabel={t('common.actions.create')}
        onClose={() => setFormOpen(false)}
        onSubmit={() =>
          createMutation.mutateAsync({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone: form.phone.trim() || null,
            entity_id: form.entity_id || null,
          })
        }
      >
        <TextField
          label={t('members.form.firstName')}
          value={form.first_name}
          onChange={(event) => setForm({ ...form, first_name: event.target.value })}
          size="small"
          autoFocus
          required
        />
        <TextField
          label={t('members.form.lastName')}
          value={form.last_name}
          onChange={(event) => setForm({ ...form, last_name: event.target.value })}
          size="small"
          required
        />
        <TextField
          label={t('common.fields.phone')}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          size="small"
        />
        <AppSelect
          label={t('common.fields.daara')}
          value={form.entity_id}
          onChange={(value) => setForm({ ...form, entity_id: value })}
          options={daaraOptions}
          allowEmpty
          placeholder={t('common.empty.noCategory')}
          fullWidth
        />
      </FormDialog>
    </>
  );
}
