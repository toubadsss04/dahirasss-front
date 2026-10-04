import { readTokenSubject } from '../utils/jwt';

/**
 * Persistence of the refresh token, isolated per browser tab.
 *
 * Each tab keeps its own token in session storage, so two accounts signed in
 * from two tabs of the same browser never overwrite each other, and signing
 * out of one tab never signs the other out. The latest token is also mirrored
 * in local storage, only to let a freshly opened tab resume the most recent
 * session instead of asking for a new sign-in.
 */

const TAB_KEY = 'daara.tab.refresh_token';
const SHARED_KEY = 'daara.refresh_token';

/**
 * Read a key from a storage area, tolerating blocked site data.
 *
 * @param {Storage} storage The storage area.
 * @param {string} key The key to read.
 * @returns {string | null} The value, or null when unavailable.
 */
function safeRead(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Write or remove a key in a storage area, tolerating blocked site data.
 *
 * @param {Storage} storage The storage area.
 * @param {string} key The key to write.
 * @param {string | null} value The value, or null to remove the key.
 */
function safeWrite(storage, key, value) {
  try {
    if (value) {
      storage.setItem(key, value);
    } else {
      storage.removeItem(key);
    }
  } catch {
    return;
  }
}

/**
 * Read the refresh token of this tab, falling back to the latest session.
 *
 * @returns {string | null} The token, or null when none is stored.
 */
export function readRefreshToken() {
  return safeRead(window.sessionStorage, TAB_KEY) || safeRead(window.localStorage, SHARED_KEY);
}

/**
 * Store the refresh token of this tab and mirror it for new tabs.
 *
 * @param {string} token The refresh token issued by the API.
 */
export function writeRefreshToken(token) {
  safeWrite(window.sessionStorage, TAB_KEY, token);
  safeWrite(window.localStorage, SHARED_KEY, token);
}

/**
 * Forget the refresh token of this tab.
 *
 * The mirrored token is removed only when it belongs to the same account, so
 * signing out here leaves another account signed in elsewhere untouched.
 */
export function clearRefreshToken() {
  const tabSubject = readTokenSubject(safeRead(window.sessionStorage, TAB_KEY));
  const sharedSubject = readTokenSubject(safeRead(window.localStorage, SHARED_KEY));
  if (!tabSubject || tabSubject === sharedSubject) {
    safeWrite(window.localStorage, SHARED_KEY, null);
  }
  safeWrite(window.sessionStorage, TAB_KEY, null);
}
