/**
 * Read the subject of a JSON Web Token without verifying it.
 *
 * Only the API can trust a token. The client reads the subject solely to tell
 * which account a stored token belongs to.
 *
 * @param {string | null} token The encoded token.
 * @returns {string | null} The subject claim, or null when unreadable.
 */
export function readTokenSubject(token) {
  if (!token) return null;
  try {
    const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(encodedPayload));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
