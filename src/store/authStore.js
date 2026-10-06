import { create } from 'zustand';

import {
  setAccessToken,
  setSessionRefresher,
  setUnauthorizedHandler,
} from '../services/apiClient';
import i18n from '../i18n';
import * as authService from '../services/auth.service';
import {
  clearRefreshToken,
  readRefreshToken,
  writeRefreshToken,
} from '../services/tokenStorage';
import { notify } from './notificationStore';

/** Refusal sent when a member was signed out because too many were connected. */
const EVICTED_CODE = 'session_evicted';

/**
 * Authentication state.
 *
 * The access token lives in memory only and is renewed silently when it
 * expires. The refresh token is persisted per tab, so a page reload does not
 * force a new sign-in and several accounts can stay signed in side by side.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  /**
   * Apply a token response returned by the API.
   *
   * @param {object} session The payload carrying tokens and the account.
   */
  applySession(session) {
    setAccessToken(session.access_token);
    writeRefreshToken(session.refresh_token);
    set({ user: session.user, isAuthenticated: true, isBootstrapping: false });
  },

  /**
   * Exchange the stored refresh token for a fresh token pair.
   *
   * @returns {Promise<string | null>} The new access token, or null when no
   *   refresh token is stored.
   */
  async renewSession() {
    const token = readRefreshToken();
    if (!token) return null;
    const session = await authService.refreshSession(token);
    get().applySession(session);
    return session.access_token;
  },

  /**
   * Restore a session from the persisted refresh token on application start.
   *
   * The stored token is dropped only when the API rejects it. A network
   * failure, such as a server still waking up, keeps it for the next attempt.
   *
   * @returns {Promise<void>} Resolves once the attempt has settled.
   */
  async bootstrap() {
    try {
      const accessToken = await get().renewSession();
      if (!accessToken) {
        set({ isBootstrapping: false });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        get().clearSession();
        return;
      }
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },

  /**
   * Sign in with an existing password.
   *
   * @param {string} email The identifier.
   * @param {string} password The password.
   * @returns {Promise<void>} Resolves once the session is applied.
   */
  async signIn(email, password) {
    const session = await authService.login(email, password);
    get().applySession(session);
  },

  /**
   * Create the first password of an account and sign in.
   *
   * @param {string} email The identifier.
   * @param {string} password The chosen password.
   * @returns {Promise<void>} Resolves once the session is applied.
   */
  async createPassword(email, password) {
    const session = await authService.createPassword(email, password);
    get().applySession(session);
  },

  /**
   * Sign out, recording the action in the audit trail when possible.
   *
   * @returns {Promise<void>} Resolves once local state is cleared.
   */
  async signOut() {
    try {
      await authService.logout();
    } catch {
      /* A failed sign-out must never trap the user in the application. */
    }
    get().clearSession();
  },

  /**
   * Replace the account kept in the session, after it changed on the server.
   *
   * @param {object} user The account as returned by the API.
   */
  setUser(user) {
    set({ user });
  },

  /**
   * Carry a rename over to the signed-in account when it is the one edited.
   *
   * The session keeps its own copy of the account, outside the query cache,
   * so renaming oneself from the accounts screen would otherwise leave the old
   * name in the sidebar until the next sign-in.
   *
   * @param {object} account The account as returned by the API after an update.
   */
  syncEditedAccount(account) {
    const { user } = get();
    if (!user || !account || user.id !== account.id) return;
    set({ user: { ...user, full_name: account.full_name } });
  },

  /** Drop the session locally, without calling the API. */
  clearSession() {
    setAccessToken(null);
    clearRefreshToken();
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },

  /**
   * Report whether the current user holds the given role.
   *
   * @param {string} role Role to test against.
   * @returns {boolean} True when the roles match.
   */
  hasRole(role) {
    return get().user?.role === role;
  },
}));

setSessionRefresher(() => useAuthStore.getState().renewSession());

setUnauthorizedHandler((code) => {
  if (code === EVICTED_CODE) {
    notify(i18n.t(`errors.api.${EVICTED_CODE}`), 'warning');
  }
  useAuthStore.getState().clearSession();
});
