import { NO_CATEGORY } from '../constants/members';
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

/**
 * Turn the value of a category filter into the parameters the API expects.
 *
 * @param {string} value A category identifier, NO_CATEGORY for the members
 *   who belong to none, or an empty string for every category.
 * @returns {{entity_id?: string, uncategorized?: boolean}} The query parameters.
 */
export function categoryFilterParams(value) {
  if (!value) return {};
  if (value === NO_CATEGORY) return { uncategorized: true };
  return { entity_id: value };
}

/**
 * Choices of a category filter: every category, then the members without one.
 *
 * @param {Array<{id: string, name: string}>} categories The categories.
 * @param {string} noCategoryLabel Label of the choice for members without a category.
 * @returns {Array<{value: string, label: string}>} The choices.
 */
export function categoryFilterOptions(categories, noCategoryLabel) {
  return [
    ...categories.map((category) => ({ value: category.id, label: category.name })),
    { value: NO_CATEGORY, label: noCategoryLabel },
  ];
}
