import { apiClient } from './apiClient';

/** Sign-in branches returned by the identifier step. */
export const IDENTIFIER_STATUS = {
  UNKNOWN: 'UNKNOWN',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
};

/**
 * Ask the API which sign-in branch applies to an identifier.
 *
 * @param {string} email The identifier typed by the user.
 * @returns {Promise<{status: string, full_name: string | null, message: string}>} The branch.
 */
export async function fetchIdentifierStatus(email) {
  const { data } = await apiClient.post('/auth/identifier-status', { email });
  return data;
}

/**
 * Create the first password of an account and sign in.
 *
 * @param {string} email The identifier.
 * @param {string} password The chosen password.
 * @returns {Promise<object>} Tokens and the account.
 */
export async function createPassword(email, password) {
  const { data } = await apiClient.post('/auth/set-password', { email, password });
  return data;
}

/**
 * Sign in with an existing password.
 *
 * @param {string} email The identifier.
 * @param {string} password The password.
 * @returns {Promise<object>} Tokens and the account.
 */
export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

/**
 * Exchange a refresh token for a fresh token pair.
 *
 * @param {string} refreshToken The stored refresh token.
 * @returns {Promise<object>} Tokens and the account.
 */
export async function refreshSession(refreshToken) {
  const { data } = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  return data;
}

/**
 * Record the sign-out in the audit trail.
 *
 * @returns {Promise<void>} Resolves once the trail entry is written.
 */
export async function logout() {
  await apiClient.post('/auth/logout');
}

/**
 * Read the authenticated account.
 *
 * @returns {Promise<object>} The current user.
 */
export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

/**
 * Make the signed-in super administrator a member of a section.
 *
 * @param {{entityId: string, gender: string}} membership The section chosen and
 *   the sex of the member created.
 * @returns {Promise<object>} The account, now linked to its member.
 */
export async function joinSection({ entityId, gender }) {
  const { data } = await apiClient.post('/auth/me/membership', {
    entity_id: entityId,
    gender,
  });
  return data;
}
