/**
 * Bring a form value to the form it is compared in.
 *
 * Surrounding spaces are what a person adds without meaning to, and the API
 * trims them anyway, so they never count as a change.
 *
 * @param {unknown} value A value held by a form.
 * @returns {unknown} The value as it should be compared.
 */
function comparable(value) {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * List the fields a person has actually changed.
 *
 * Both sides must be in form shape, strings as typed, so that an amount read
 * as a number from the API and the same amount typed as text compare equal.
 * Typing a value back to what it was counts as no change at all.
 *
 * @param {Record<string, unknown>} initial The form as it was opened.
 * @param {Record<string, unknown>} current The form as it stands.
 * @returns {string[]} The names of the fields that differ.
 */
export function changedKeys(initial, current) {
  return Object.keys(current).filter(
    (key) => comparable(current[key]) !== comparable(initial[key]),
  );
}

/**
 * Keep only the changed fields, converted to what the API expects.
 *
 * A correction sends the fields that moved and nothing else, so the audit
 * trail records exactly what was corrected and a field left alone can never
 * be overwritten by a stale value.
 *
 * @param {Record<string, unknown>} initial The form as it was opened.
 * @param {Record<string, unknown>} current The form as it stands.
 * @param {Record<string, (value: unknown) => unknown>} converters How each
 *   field is turned into its API value. A field without one is left out.
 * @returns {Record<string, unknown>} The partial update to send.
 */
export function buildChanges(initial, current, converters) {
  return Object.fromEntries(
    changedKeys(initial, current)
      .filter((key) => key in converters)
      .map((key) => [key, converters[key](current[key])]),
  );
}

/**
 * Turn an optional text field into its API value.
 *
 * An emptied field becomes null rather than an empty string, since the API
 * stores whatever text it is given and an empty phone number would otherwise
 * be kept as a value.
 *
 * @param {string} value The text as typed.
 * @returns {string|null} The trimmed text, or null when nothing is left.
 */
export function optionalText(value) {
  const trimmed = (value ?? '').trim();
  return trimmed || null;
}

/**
 * Turn a required text field into its API value.
 *
 * @param {string} value The text as typed.
 * @returns {string} The trimmed text.
 */
export function requiredText(value) {
  return (value ?? '').trim();
}

/**
 * Turn an amount typed as digits into its API value.
 *
 * @param {string} value The digits as typed.
 * @returns {number} The amount in whole francs.
 */
export function amountValue(value) {
  return Math.round(Number(value));
}

/**
 * Tell whether an amount typed as digits can be recorded.
 *
 * @param {string} value The digits as typed.
 * @returns {boolean} True for a whole amount above zero.
 */
export function isValidAmount(value) {
  const amount = Number(value);
  return value !== '' && Number.isFinite(amount) && amount > 0;
}

/**
 * Turn an optional date field into its API value.
 *
 * @param {string} value The date as the date input holds it.
 * @returns {string|null} The ISO date, or null when the field was emptied.
 */
export function optionalDate(value) {
  return value || null;
}

/**
 * Turn a required date field into its API value.
 *
 * The operation dates are mandatory in the database while the update schemas
 * accept null, so an emptied date must be refused by the form before it gets
 * here, never sent as null.
 *
 * @param {string} value The date as the date input holds it.
 * @returns {string} The ISO date.
 */
export function requiredDate(value) {
  return value;
}
