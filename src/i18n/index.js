import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar';
import fr from './fr';

/**
 * Language setup.
 *
 * Both catalogues ship inside the bundle rather than being fetched. The app is
 * installed on phones and has to work with no network, and resolving the
 * language before the first paint is what stops a French screen flashing up
 * before the Arabic one replaces it.
 */

/** The languages the interface speaks. */
export const LOCALES = { FR: 'fr', AR: 'ar' };

/** Shown in the language switcher, each in its own script. */
export const LOCALE_NAMES = { fr: 'Français', ar: 'العربية' };

const STORAGE_KEY = 'daara.locale';
const DEFAULT_LOCALE = LOCALES.FR;

/** Reading direction of each language. */
const DIRECTION = { fr: 'ltr', ar: 'rtl' };

/**
 * Dates and amounts are written the same way whatever the language.
 *
 * They are the figures of the ledger, and they stay put. A date on screen has
 * to match the date on the paper record beside it, and an amount has to read
 * identically to everyone who looks at it, so neither is translated and both
 * keep Latin digits and French grouping in Arabic too.
 */
export const FIGURE_TAG = 'fr-FR';

/**
 * Read the persisted language preference.
 *
 * @returns {string} A supported language, defaulting to French.
 */
function readStoredLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return Object.values(LOCALES).includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * Stamp the language and its reading direction on the document.
 *
 * @param {string} locale One of the supported languages.
 */
export function applyLocale(locale) {
  const root = document.documentElement;
  root.setAttribute('lang', locale);
  root.setAttribute('dir', DIRECTION[locale] ?? 'ltr');
}

/**
 * Persist and activate a language.
 *
 * @param {string} locale One of the supported languages.
 * @returns {Promise<void>} Resolves once the catalogue is in place.
 */
export async function setLocale(locale) {
  if (!Object.values(LOCALES).includes(locale)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* Blocked site data is tolerated, the choice just will not persist. */
  }
  applyLocale(locale);
  await i18next.changeLanguage(locale);
}

/**
 * The language in effect right now.
 *
 * @returns {string} One of the supported languages.
 */
export function currentLocale() {
  return Object.values(LOCALES).includes(i18next.language)
    ? i18next.language
    : DEFAULT_LOCALE;
}


/**
 * Whether the interface currently reads right to left.
 *
 * @returns {boolean} True in Arabic.
 */
export function isRtl() {
  return DIRECTION[currentLocale()] === 'rtl';
}

const initialLocale = readStoredLocale();
applyLocale(initialLocale);

i18next.use(initReactI18next).init({
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
  },
  // React escapes what it renders, so a second pass would only turn apostrophes
  // into entities.
  interpolation: { escapeValue: false },
  returnNull: false,
  // A key missing here is missing from French too, which is a bug rather than a
  // translation gap. Make it impossible to miss while developing.
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (languages, namespace, key) => {
    if (import.meta.env.DEV) {
      console.error(`[i18n] clé absente : ${key}`);
    }
  },
  parseMissingKeyHandler: (key) => (import.meta.env.DEV ? `‼️${key}‼️` : key),
});

export default i18next;
