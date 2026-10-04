import { apiClient } from './apiClient';

/**
 * List the exercises the caller may see, most recent first.
 *
 * @returns {Promise<Array<object>>} The exercises.
 */
export async function fetchExercises() {
  const { data } = await apiClient.get('/exercises');
  return Array.isArray(data) ? data : (data?.items ?? []);
}
