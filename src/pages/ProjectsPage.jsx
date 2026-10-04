import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { Plus, Search } from 'lucide-react';

import AppSelect from '../components/forms/AppSelect';
import Pager from '../components/projects/Pager';
import ProgressBar from '../components/projects/ProgressBar';
import ProjectFormDialog from '../components/projects/ProjectFormDialog';
import {
  DataTable,
  ErrorNote,
  FilterBar,
  Loader,
  Money,
  PageHeader,
  StatusBadge,
} from '../components/ui';
import { projectStatusKey } from '../constants/labels';
import {
  PROJECT_STATUSES,
  PROJECTS_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from '../constants/projects';
import { buildPath, ROUTES } from '../constants/routes';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDomainMutation } from '../hooks/useDomainMutation';
import { usePermissions } from '../hooks/usePermissions';
import { extractErrorMessage } from '../services/apiClient';
import { fetchDaaraNames } from '../services/daara.service';
import {
  createProject,
  emptyProjectForm,
  fetchProjectYears,
  fetchProjects,
  gamouExerciseOptions,
  isProjectFormValid,
  progressPercent,
  toProjectCreate,
} from '../services/projects.service';
import { useExerciseStore } from '../store/exerciseStore';
import { formatDate } from '../utils/format';

/** Choices of the Gamou filter, sent to the API as a boolean. */
const GAMOU_FILTERS = { GAMOU: 'true', OTHER: 'false' };

/**
 * Dahira projects.
 *
 * A project is either tied to a Gamou, its payments then counting in that
 * exercise, or a pot of its own. Projects accumulate over the years, so the
 * list is never loaded whole. It is browsed one year of creation at a time,
 * the most recent by default, and the year list only offers years in which a
 * project exists. Within a year the projects come newest first, one page at a
 * time, and the search and the filters run on the server.
 *
 * @returns {JSX.Element} The screen.
 */
export default function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManageProjects } = usePermissions();

  const [yearFilter, setYearFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [gamouFilter, setGamouFilter] = useState('');
  const exercises = useExerciseStore((state) => state.exercises);
  const categories = useQuery({
    queryKey: ['daara-names'],
    queryFn: fetchDaaraNames,
    enabled: canManageProjects,
  });
  const selectedExercise = useExerciseStore((state) => state.selected());
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const years = useQuery({ queryKey: ['project-years'], queryFn: fetchProjectYears });
  const yearOptions = years.data ?? [];
  const year = yearOptions.includes(yearFilter) ? yearFilter : (yearOptions[0] ?? null);

  const projects = useQuery({
    queryKey: ['projects', year, statusFilter, gamouFilter, debouncedSearch, offset],
    queryFn: () =>
      fetchProjects({
        year: year ?? undefined,
        status: statusFilter || undefined,
        gamou: gamouFilter || undefined,
        search: debouncedSearch || undefined,
        limit: PROJECTS_PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
    enabled: years.isSuccess,
  });

  const createMutation = useDomainMutation('project', createProject, {
    successMessage: t('projects.created'),
    onSuccess: (project) =>
      navigate(buildPath(ROUTES.projectDetail, { projectId: project.id })),
  });

  const changeYear = (value) => {
    setYearFilter(Number(value));
    setOffset(0);
  };
  const changeStatus = (value) => {
    setStatusFilter(value);
    setOffset(0);
  };
  const changeGamou = (value) => {
    setGamouFilter(value);
    setOffset(0);
  };
  const changeSearch = (event) => {
    setSearch(event.target.value);
    setOffset(0);
  };

  const rows = projects.data?.items ?? [];
  const total = projects.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('projects.title')}
        subtitle={
          year
            ? t('projects.subtitleYear', { count: total, year })
            : t('projects.subtitle', { count: total })
        }
        actions={
          canManageProjects && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setForm(emptyProjectForm())}
            >
              {t('projects.add')}
            </Button>
          )
        }
      />

      <FilterBar>
        {yearOptions.length > 0 && (
          <AppSelect
            label={t('projects.year')}
            value={String(year)}
            onChange={changeYear}
            options={yearOptions.map((value) => ({
              value: String(value),
              label: String(value),
            }))}
            sx={{ minWidth: 120 }}
          />
        )}
        <TextField
          placeholder={t('projects.search')}
          value={search}
          onChange={changeSearch}
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
        <AppSelect
          value={statusFilter}
          onChange={changeStatus}
          options={[
            { value: PROJECT_STATUSES.OPEN, label: t(projectStatusKey('OPEN')) },
            { value: PROJECT_STATUSES.CLOSED, label: t(projectStatusKey('CLOSED')) },
          ]}
          allowEmpty
          placeholder={t('common.filters.allStatuses')}
          sx={{ minWidth: 170 }}
        />
        <AppSelect
          value={gamouFilter}
          onChange={changeGamou}
          options={[
            { value: GAMOU_FILTERS.GAMOU, label: t('projects.gamouOnly') },
            { value: GAMOU_FILTERS.OTHER, label: t('projects.outsideGamou') },
          ]}
          allowEmpty
          placeholder={t('projects.allKinds')}
          sx={{ minWidth: 170 }}
        />
      </FilterBar>

      {(years.isLoading || projects.isLoading) && <Loader />}
      {years.error && <ErrorNote message={extractErrorMessage(years.error)} />}
      {projects.error && <ErrorNote message={extractErrorMessage(projects.error)} />}

      {projects.data && (
        <>
          <DataTable
            columns={[
              { key: 'name', label: t('projects.columns.name') },
              { key: 'created', label: t('projects.columns.created') },
              { key: 'status', label: t('projects.columns.status') },
              { key: 'contributors', label: t('projects.columns.contributors'), align: 'right' },
              { key: 'cost', label: t('projects.columns.cost'), align: 'right' },
              { key: 'collected', label: t('projects.columns.collected'), align: 'right' },
              { key: 'progress', label: t('projects.columns.progress') },
            ]}
            rows={rows}
            emptyMessage={t('projects.empty')}
            renderRow={(row) => (
              <tr
                key={row.id}
                className="clickable"
                onClick={() =>
                  navigate(buildPath(ROUTES.projectDetail, { projectId: row.id }))
                }
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <span className={row.is_gamou ? 'badge b-open' : 'badge b-draft'}>
                    {row.is_gamou ? row.exercise_name : t('projects.outsideGamou')}
                  </span>
                  {row.description && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {row.description}
                    </div>
                  )}
                </td>
                <td className="num">{formatDate(row.created_at)}</td>
                <td>
                  <StatusBadge
                    label={t(projectStatusKey(row.status))}
                    tone={row.status === PROJECT_STATUSES.OPEN ? 'open' : 'closed'}
                  />
                </td>
                <td className="r num">{row.contributors_count}</td>
                <td className="r">
                  {row.cost ? <Money value={row.cost} /> : t('projects.costUnknown')}
                </td>
                <td className="r">
                  <Money value={row.collected} />
                </td>
                <td>
                  <ProgressBar
                    percent={progressPercent(row.collected, row.cost)}
                    emptyLabel={t('common.empty.value')}
                  />
                </td>
              </tr>
            )}
          />
          <Pager
            total={total}
            offset={offset}
            limit={PROJECTS_PAGE_SIZE}
            onChange={setOffset}
          />
        </>
      )}

      {form && (
        <ProjectFormDialog
          open={Boolean(form)}
          editing={false}
          form={form}
          onChange={setForm}
          submitDisabled={!isProjectFormValid(form)}
          onSubmit={() => createMutation.mutateAsync(toProjectCreate(form))}
          onClose={() => setForm(null)}
          exerciseOptions={gamouExerciseOptions(exercises)}
          categories={categories.data ?? []}
          defaultExerciseId={
            selectedExercise?.status === 'CLOSED' ? '' : (selectedExercise?.id ?? '')
          }
        />
      )}
    </>
  );
}
