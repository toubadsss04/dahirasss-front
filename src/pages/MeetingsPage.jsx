import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { ArrowRight, Plus } from 'lucide-react';

import FormDialog from '../components/ui/FormDialog';
import {
  Callout,
  DataTable,
  EmptyState,
  ErrorNote,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { operationStatusKey } from '../constants/labels';
import { ROUTES, buildPath } from '../constants/routes';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { createMeeting, fetchMeetings } from '../services/finance.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatDate, todayInDakar } from '../utils/format';

/**
 * List of meetings for the selected exercise.
 *
 * A meeting gathers the whole Dahira: every member may give there, whatever
 * their section. Several meetings may be held in the same month, so nothing
 * here limits the count, per business rule RM-04.
 *
 * @returns {JSX.Element} The screen.
 */
export default function MeetingsPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const navigate = useNavigate();
  const selected = useExerciseStore((state) => state.selected());
  const exerciseId = selected?.id;

  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    meeting_date: todayInDakar(),
    subject: '',
    description: '',
  });

  const meetings = useQuery({
    queryKey: ['meetings', exerciseId],
    queryFn: () => fetchMeetings({ exercise_id: exerciseId, limit: 200 }),
    enabled: Boolean(exerciseId),
  });

  const createMutation = useDomainMutation('meeting', createMeeting, {
    successMessage: t('meetings.created'),
  });

  if (!exerciseId) {
    return (
      <>
        <PageHeader title={t('meetings.title')} />
        <div className="card">
          <EmptyState message={t('meetings.noExercise')} />
        </div>
      </>
    );
  }

  if (meetings.isLoading) return <Loader />;
  if (meetings.error) return <ErrorNote message={extractErrorMessage(meetings.error)} />;

  const openForm = () => {
    setForm({ meeting_date: todayInDakar(), subject: '', description: '' });
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title={t('meetings.title')}
        subtitle={`${selected.name} · ${t('meetings.subtitle')}`}
        actions={
          canWrite && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openForm}>
              {t('meetings.add')}
            </Button>
          )
        }
      />

      <Callout>{t('meetings.notice')}</Callout>

      <DataTable
        columns={[
          { key: 'date', label: t('meetings.columns.date') },
          { key: 'subject', label: t('meetings.columns.subject') },
          { key: 'contributors', label: t('meetings.columns.contributors'), align: 'right' },
          { key: 'total', label: t('meetings.columns.collected'), align: 'right' },
          { key: 'status', label: t('meetings.columns.status') },
          { key: 'open', label: '' },
        ]}
        rows={meetings.data.items}
        emptyMessage={t('meetings.empty')}
        renderRow={(meeting) => (
          <tr
            key={meeting.id}
            onClick={() =>
              navigate(buildPath(ROUTES.meetingDetail, { meetingId: meeting.id }))
            }
            style={{ cursor: 'pointer' }}
          >
            <td className="num" style={{ fontWeight: 600 }}>
              {formatDate(meeting.meeting_date)}
            </td>
            <td>{meeting.subject || t('common.empty.value')}</td>
            <td className="r num">{meeting.contributors_count}</td>
            <td className="r">
              <Money value={meeting.total_collected} tone />
            </td>
            <td>
              <StatusBadge
                label={t(operationStatusKey(meeting.status))}
                tone={meeting.status === 'ACTIVE' ? 'open' : 'cancel'}
              />
            </td>
            <td className="r" style={{ width: '1%' }}>
              <span className="chip">
                <ArrowRight size={13} /> {t('meetings.open')}
              </span>
            </td>
          </tr>
        )}
      />

      <FormDialog
        open={isFormOpen}
        title={t('meetings.form.title')}
        submitLabel={t('common.actions.create')}
        onClose={() => setFormOpen(false)}
        onSubmit={() =>
          createMutation.mutateAsync({
            exercise_id: exerciseId,
            meeting_date: form.meeting_date,
            subject: form.subject.trim() || null,
            description: form.description.trim() || null,
          })
        }
      >
        <TextField
          label={t('common.fields.date')}
          type="date"
          value={form.meeting_date}
          onChange={(event) => setForm({ ...form, meeting_date: event.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label={t('meetings.form.subject')}
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          size="small"
          placeholder={t('meetings.form.subjectPlaceholder')}
        />
        <TextField
          label={t('meetings.form.description')}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          size="small"
          placeholder={t('meetings.form.descriptionPlaceholder')}
          multiline
          minRows={3}
          maxRows={8}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
      </FormDialog>
    </>
  );
}
