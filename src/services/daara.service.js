import { apiClient } from './apiClient';

/**
 * List the daaras visible to the caller.
 *
 * @param {{status?: string, search?: string}} [params] Optional filters.
 * @returns {Promise<Array<object>>} The daaras.
 */
export async function fetchDaaras(params = {}) {
  const { data } = await apiClient.get('/entities', { params });
  return data;
}

/**
 * List the name of every active daara, for any account.
 *
 * Unlike fetchDaaras, this is not narrowed to the caller's daaras, and holds
 * nothing but names, so a manager can choose another daara to browse.
 *
 * @returns {Promise<Array<{id: string, name: string}>>} The daaras.
 */
export async function fetchDaaraNames() {
  const { data } = await apiClient.get('/entities/names');
  return data;
}

/**
 * Read one daara.
 *
 * @param {string} daaraId Identifier.
 * @returns {Promise<object>} The daara.
 */
export async function fetchDaara(daaraId) {
  const { data } = await apiClient.get(`/entities/${daaraId}`);
  return data;
}

/**
 * Create a daara.
 *
 * @param {object} payload Name and description.
 * @returns {Promise<object>} The created daara.
 */
export async function createDaara(payload) {
  const { data } = await apiClient.post('/entities', payload);
  return data;
}

/**
 * Update a daara.
 *
 * @param {string} daaraId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The updated daara.
 */
export async function updateDaara(daaraId, payload) {
  const { data } = await apiClient.patch(`/entities/${daaraId}`, payload);
  return data;
}
