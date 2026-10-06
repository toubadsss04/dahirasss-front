import axios from 'axios';

import { extractErrorMessage } from '../utils/apiErrors';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Render puts free services to sleep after fifteen minutes. The first call
 * that wakes one can take the better part of a minute, so the timeout is
 * generous on purpose rather than surfacing a false failure.
 */
const REQUEST_TIMEOUT_MS = 75000;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Sign-in endpoints answer 401 for wrong credentials or a dead refresh token.
 * Those answers are final, so they never trigger a silent refresh.
 */
const SESSION_ROUTES = ['/auth/login', '/auth/refresh', '/auth/set-password', '/auth/identifier-status'];

let accessToken = null;
let onUnauthorized = null;
let sessionRefresher = null;
let pendingRefresh = null;

/**
 * Store the bearer token used on subsequent requests.
 *
 * @param {string | null} token Access token, or null to clear it.
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Register the callback invoked when the API rejects the current session.
 *
 * @param {(code: string | null) => void} handler Called once the session is no
 *   longer valid, with the refusal code when the server gave one, such as
 *   session_evicted for a member signed out by the cap on connections.
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Register the function that renews the access token from the refresh token.
 *
 * @param {() => Promise<string | null>} refresher Resolves with the new access
 *   token, or null when no session can be renewed.
 */
export function setSessionRefresher(refresher) {
  sessionRefresher = refresher;
}

/**
 * Renew the access token, sharing one call between concurrent failures.
 *
 * A screen often fires several requests at once. When the access token has
 * expired they all fail together, and they must wait on the same renewal
 * rather than each spending the refresh token on its own.
 *
 * @returns {Promise<string | null>} The new access token, or null.
 */
function renewAccessToken() {
  if (!pendingRefresh) {
    pendingRefresh = sessionRefresher().finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
}

/**
 * Tell whether a request targets a sign-in endpoint.
 *
 * @param {string | undefined} url The request URL.
 * @returns {boolean} True for endpoints whose 401 is final.
 */
function isSessionRoute(url) {
  return SESSION_ROUTES.some((route) => (url || '').includes(route));
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || !config || isSessionRoute(config.url)) {
      return Promise.reject(error);
    }

    let code = response.data?.code ?? null;
    if (!config.sessionRenewed && sessionRefresher) {
      config.sessionRenewed = true;
      try {
        const renewedToken = await renewAccessToken();
        if (renewedToken) {
          return apiClient(config);
        }
      } catch (refreshError) {
        if (refreshError.response?.status !== 401) {
          return Promise.reject(error);
        }
        code = refreshError.response.data?.code ?? code;
      }
    }

    if (onUnauthorized) {
      onUnauthorized(code);
    }
    return Promise.reject(error);
  },
);

export { extractErrorMessage };
