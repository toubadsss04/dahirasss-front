/**
 * Turn an API rejection into a sentence the reader can act on.
 *
 * The server answers a refusal twice: once as a stable code, and once as a
 * French sentence. The code is preferred, because only the code can be shown in
 * the reader's own language. The sentence is the safety net, so a refusal the
 * interface has never seen still says something useful instead of nothing.
 *
 * Automatic checks on the request body come back differently, as a list of
 * failures naming a field and a rule. Those are rebuilt here from the two
 * translated halves rather than shown as the library phrases them.
 */

import i18n from '../i18n';

/**
 * Translate one validation failure into a sentence.
 *
 * @param {object} failure One entry of the validation detail.
 * @returns {string} The sentence to show.
 */
function translate(failure) {
  const name = failure.loc?.[failure.loc.length - 1];
  const key = `errors.field.${name}`;
  const field = i18n.exists(key) ? i18n.t(key) : i18n.t('errors.field.fallback');
  const limit =
    failure.ctx?.min_length ?? failure.ctx?.max_length ?? failure.ctx?.gt;

  switch (failure.type) {
    case 'missing':
      return i18n.t('errors.rule.missing', { field });
    case 'string_too_short':
      return i18n.t('errors.rule.tooShort', { field, limit });
    case 'string_too_long':
      return i18n.t('errors.rule.tooLong', { field, limit });
    case 'greater_than':
      return i18n.t('errors.rule.greaterThan', { field, limit });
    case 'greater_than_equal':
      return i18n.t('errors.rule.atLeast', { field, limit: failure.ctx?.ge });
    case 'less_than_equal':
      return i18n.t('errors.rule.atMost', { field, limit: failure.ctx?.le });
    case 'int_parsing':
    case 'decimal_parsing':
      return i18n.t('errors.rule.notANumber', { field });
    case 'date_from_datetime_parsing':
    case 'date_parsing':
      return i18n.t('errors.rule.notADate', { field });
    case 'enum':
      return i18n.t('errors.rule.unexpectedValue', { field });
    case 'value_error':
      // Raised by our own validators, which answer in French. Nothing better is
      // available, so the server's wording stands.
      return (
        failure.msg?.replace(/^Value error,\s*/, '') ||
        i18n.t('errors.rule.invalid', { field })
      );
    default:
      return i18n.t('errors.rule.invalid', { field });
  }
}

/**
 * Extract a readable message from a rejected request.
 *
 * @param {unknown} error The rejected value from a request.
 * @param {string} [fallbackKey] Translation key used when nothing else fits.
 * @returns {string} A sentence suitable for display.
 */
export function extractErrorMessage(error, fallbackKey = 'errors.generic') {
  const data = error?.response?.data;

  // A refusal the server named. This is the only branch that can speak the
  // reader's language, so it comes first.
  const key = data?.code ? `errors.api.${data.code}` : null;
  if (key && i18n.exists(key)) {
    return i18n.t(key);
  }

  const detail = data?.detail;

  // A refusal we have no translation for. Showing the server's French sentence
  // is worse than showing Arabic and better than showing nothing.
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    return [...new Set(detail.map(translate))].join(' ');
  }

  if (error?.code === 'ECONNABORTED') {
    return i18n.t('errors.timeout');
  }
  if (!error?.response) {
    return i18n.t('errors.unreachable');
  }
  if (error.response.status >= 500) {
    return i18n.t('errors.server');
  }
  return i18n.t(fallbackKey);
}
