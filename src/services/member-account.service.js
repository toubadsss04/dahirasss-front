import { apiClient } from './apiClient';

/**
 * Read the space of the member linked to the signed-in account.
 *
 * @returns {Promise<object>} What the member gave and what the projects still ask of them.
 */
export async function fetchMyAccount() {
  const { data } = await apiClient.get('/me/account');
  return data;
}

/**
 * Share of a project the member has already given, in percent.
 *
 * @param {{share: number|null, paid: number}} project The project as returned by the API.
 * @returns {number|null} The percentage, or null when the project asks nothing fixed.
 */
export function sharePercent(project) {
  if (!project.share) return null;
  return Math.round((project.paid / project.share) * 100);
}
