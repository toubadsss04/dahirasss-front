/** Client-side checks mirroring the rules enforced by the API. */

import i18n from '../i18n';

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Validate a password against the shared policy.
 *
 * The same rule lives in the API and is authoritative there. This copy only
 * spares the user a round trip.
 *
 * @param {string} password The candidate password.
 * @returns {string | null} An error message, or null when the password passes.
 */
export function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return i18n.t('validation.passwordTooShort', { min: PASSWORD_MIN_LENGTH });
  }
  // A letter in any script, and a digit in any numbering system, matching the
  // Unicode-aware check the API applies. Testing for a-z here would reject a
  // password written in Arabic that the server accepts, locking the person out
  // of an account whose password is perfectly valid.
  if (!/\p{Letter}/u.test(password)) {
    return i18n.t('validation.passwordNeedsLetter');
  }
  if (!/\p{Number}/u.test(password)) {
    return i18n.t('validation.passwordNeedsDigit');
  }
  return null;
}

/**
 * Validate an email address loosely, the API remains authoritative.
 *
 * @param {string} email The candidate address.
 * @returns {string | null} An error message, or null when the address passes.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return i18n.t('validation.identifierRequired');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return i18n.t('validation.identifierNotEmail');
  }
  return null;
}

/**
 * Validate the identifier of a new account, restricted to a single domain.
 *
 * @param {string} email The candidate address.
 * @param {string} domain The only domain accepted, without the leading "@".
 * @returns {string | null} An error message, or null when the address passes.
 */
export function validateAccountEmail(email, domain) {
  const formatError = validateEmail(email);
  if (formatError) return formatError;
  if (!email.trim().toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
    return i18n.t('validation.identifierWrongDomain', { domain });
  }
  return null;
}
