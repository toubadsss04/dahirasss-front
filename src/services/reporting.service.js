import { apiClient } from './apiClient';

/**
 * Read the dashboard figures for one exercise.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object>} Summary, daaras and monthly evolution.
 */
export async function fetchDashboard(exerciseId) {
  const { data } = await apiClient.get(`/dashboard/${exerciseId}`);
  return data;
}

/**
 * Read the full financial statement of one exercise.
 *
 * @param {string} exerciseId Identifier.
 * @param {string} [daaraId] Restrict the breakdown to one daara.
 * @returns {Promise<object>} The statement.
 */
export async function fetchStatement(exerciseId, daaraId) {
  const { data } = await apiClient.get(`/statement/${exerciseId}`, {
    params: daaraId ? { entity_id: daaraId } : {},
  });
  return data;
}

/**
 * Read the unified movement journal of one exercise.
 *
 * @param {string} exerciseId Identifier.
 * @param {object} [params] Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of movements.
 */
export async function fetchJournal(exerciseId, params = {}) {
  const { data } = await apiClient.get(`/journal/${exerciseId}`, { params });
  return data;
}

/**
 * Search the audit trail.
 *
 * Paged by cursor rather than by page number, because the trail only grows
 * and skipping rows would get slower the further back you look.
 *
 * @param {object} [params] Filters, window and cursor.
 * @returns {Promise<{items: Array<object>, next_cursor: string|null, has_more: boolean}>}
 *   One page of entries.
 */
export async function fetchAuditTrail(params = {}) {
  const { data } = await apiClient.get('/audit', { params });
  return data;
}

/**
 * Empty the audit trail.
 *
 * Erases every entry, whatever the filters shown on screen, and nothing else:
 * members, operations and exercises keep their own records. The operation
 * cannot be undone.
 *
 * @returns {Promise<{deleted: number}>} How many entries were erased.
 */
export async function purgeAuditTrail() {
  const { data } = await apiClient.delete('/audit');
  return data;
}
