import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { KEYS } from '../constants/queryKeys';
import { availablePots } from '../services/finance.service';
import { fetchProjects } from '../services/projects.service';

/** More open projects than the Dahira ever runs at once. */
const OPEN_PROJECTS_LIMIT = 100;

/**
 * Choices of the pot an expense or a Barkelou goes to, labelled for a select.
 *
 * @param {string|undefined} exerciseId The exercise selected in the interface.
 * @param {boolean} enabled Load the projects only while a form needs them.
 * @returns {Array<{value: string, label: string}>} The pots, the Gamou first.
 */
export function usePotOptions(exerciseId, enabled) {
  const { t } = useTranslation();
  const projects = useQuery({
    queryKey: [KEYS.projects, 'open-pots'],
    queryFn: () => fetchProjects({ status: 'OPEN', limit: OPEN_PROJECTS_LIMIT }),
    enabled,
  });

  return availablePots(projects.data?.items ?? [], exerciseId).map(({ value, project }) => ({
    value,
    label: project
      ? t(project.is_gamou ? 'pots.gamouProject' : 'pots.apartProject', { name: project.name })
      : t('pots.gamou'),
  }));
}
