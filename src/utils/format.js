/**
 * Formatting helpers shared by every screen.
 *
 * Amounts are whole CFA francs. They arrive from the API as integers and are
 * never divided, so no rounding error can creep into a displayed total.
 *
 * Neither amounts nor dates are translated. They keep one written form in every
 * language, so a figure on screen always matches the figure on the paper record
 * beside it and nobody has to convert between two conventions to compare them.
 */

import { FIGURE_TAG } from '../i18n';

/**
 * Zone every instant is shown in. The Dahira lives on Dakar time, so a member
 * abroad reads the same hour as one in Dakar.
 */
const DAHIRA_TIME_ZONE = 'Africa/Dakar';

/**
 * Tell whether a value is an instant rather than a calendar day.
 *
 * A calendar day (YYYY-MM-DD) is shown as typed, with no zone applied; an
 * instant, such as a creation timestamp, is shown on Dakar time.
 *
 * @param {string | Date | null | undefined} value The value to show.
 * @returns {boolean} True for a timestamp or a Date instance.
 */
function isInstant(value) {
  if (value instanceof Date) return true;
  return typeof value === 'string' && value.includes('T');
}

/**
 * Today's calendar day in Dakar, as YYYY-MM-DD.
 *
 * Used as the default date of a new operation, so one typed late in the
 * evening from abroad still carries Dakar's day.
 *
 * @returns {string} The day, ready for a date input.
 */
export function todayInDakar() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAHIRA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const AVATAR_PALETTE = [
  '#12726b',
  '#b98524',
  '#3a6ea5',
  '#8a4f9e',
  '#c0442e',
  '#1f8a5b',
  '#0e3b38',
  '#a5673f',
];

/**
 * Force a run to read left to right and keep it whole.
 *
 * An amount or a date is a Latin run. Dropped into an Arabic sentence with no
 * isolation, the bidirectional algorithm reorders it against the text around
 * it: the currency jumps in front of the number, and a leading minus sign
 * migrates to the far end. On a ledger that is not a cosmetic defect, because
 * a debit can end up reading as a credit.
 *
 * The two marks below say "this piece is left to right, and it ends here".
 * They carry no width, so nothing changes in French.
 *
 * @param {string} text The formatted figure.
 * @returns {string} The same figure, protected from its surroundings.
 */
function isolate(text) {
  return `\u2066${text}\u2069`;
}

/**
 * Format an amount in CFA francs with narrow spaces between thousands.
 *
 * @param {number | null | undefined} amount Whole francs.
 * @param {{ withCurrency?: boolean, signed?: boolean }} [options] Rendering options.
 * @returns {string} The formatted amount.
 */
export function formatMoney(amount, options = {}) {
  const { withCurrency = true, signed = false } = options;
  const value = Number(amount ?? 0);
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : '';
  const body = Math.abs(value)
    .toLocaleString(FIGURE_TAG)
    .replace(/[\u202f\u00a0]/g, ' ');
  return isolate(`${sign}${body}${withCurrency ? ' F' : ''}`);
}

/**
 * Format a percentage with at most one decimal, e.g. 12,1 %.
 *
 * @param {number | string | null | undefined} value Percent, as a number or a decimal string.
 * @returns {string} The formatted percentage.
 */
export function formatPercent(value) {
  const body = Number(value ?? 0)
    .toLocaleString(FIGURE_TAG, { maximumFractionDigits: 1 })
    .replace(/[\u202f\u00a0]/g, ' ');
  return isolate(`${body} %`);
}

/**
 * Parse a value into a Date, without shifting a calendar date.
 *
 * A bare YYYY-MM-DD string is parsed by the browser as UTC midnight, which
 * renders as the previous day for anyone west of Greenwich. Dates in this
 * application are calendar days, not instants, so they are built in local
 * time to keep the day the user typed.
 *
 * @param {string | Date | null | undefined} value ISO date or Date instance.
 * @returns {Date | null} The date, or null when it cannot be read.
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format an ISO date as day/month/year.
 *
 * @param {string | Date | null | undefined} value ISO date or Date instance.
 * @returns {string} The formatted date, or an em dash when empty.
 */
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return isolate(
    date.toLocaleDateString(FIGURE_TAG, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(isInstant(value) ? { timeZone: DAHIRA_TIME_ZONE } : {}),
    }),
  );
}

/**
 * Format an ISO timestamp as a short day and time, on Dakar time.
 *
 * @param {string | Date | null | undefined} value ISO timestamp.
 * @returns {string} The formatted timestamp, or an em dash when empty.
 */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '—';
  const zone = { timeZone: DAHIRA_TIME_ZONE };
  const day = date.toLocaleDateString(FIGURE_TAG, { day: '2-digit', month: '2-digit', ...zone });
  const time = date.toLocaleTimeString(FIGURE_TAG, {
    hour: '2-digit',
    minute: '2-digit',
    ...zone,
  });
  return isolate(`${day} · ${time}`);
}

/** A letter of any script, so Arabic names get initials too. */
const LETTER = /\p{L}/u;

/** An aside written between brackets, such as the nickname in "Ibrahima (Bro)". */
const ASIDE = /\([^)]*\)/g;

/**
 * Find the letter a name part is known by.
 *
 * An aside between brackets is not part of the name, so it is set aside, and
 * so is any sign in front of the first letter. A part holding nothing but an
 * aside, such as "(Bro)", still has a letter: the one right after the bracket.
 *
 * @param {string | null | undefined} part A first name, a surname or one word.
 * @returns {string} The uppercase letter, or an empty string when there is none.
 */
function leadingLetter(part) {
  if (!part) return '';
  const letter = part.replace(ASIDE, ' ').match(LETTER) ?? part.match(LETTER);
  return letter ? letter[0].toUpperCase() : '';
}

/**
 * Build the initials of a name given as one string.
 *
 * The first word stands for the first name and the last word for the surname,
 * so a compound first name such as "Baye Abdou Biteye" gives BB rather than
 * BA, and an aside between brackets never provides a letter.
 *
 * @param {string | null | undefined} name Full name, or any other label.
 * @returns {string} One or two uppercase letters, or "?" when there is none.
 */
export function initials(name) {
  if (!name) return '?';
  const words = name
    .replace(ASIDE, ' ')
    .split(/\s+/)
    .filter((word) => LETTER.test(word));
  if (words.length === 0) return leadingLetter(name) || '?';
  const first = leadingLetter(words[0]);
  const last = words.length > 1 ? leadingLetter(words[words.length - 1]) : '';
  return `${first}${last}` || '?';
}

/**
 * Build the initials of a person from their first name and surname.
 *
 * Preferred over the full name whenever both halves are known, since only
 * they say where the first name ends: a compound surname then gives its own
 * first letter rather than the one of its last word.
 *
 * @param {{first_name?: string, last_name?: string, full_name?: string} | null | undefined} person
 *   The person as returned by the API.
 * @returns {string} One or two uppercase letters, or "?" when there is none.
 */
export function personInitials(person) {
  if (!person?.first_name) return initials(person?.full_name);
  const letters = `${leadingLetter(person.first_name)}${leadingLetter(person.last_name)}`;
  return letters || initials(person.full_name);
}

/**
 * Pick a stable colour for a name, so the same person keeps the same swatch.
 *
 * @param {string | null | undefined} name Any label.
 * @returns {string} A hex colour from the palette.
 */
export function avatarColor(name) {
  const source = name || '';
  const sum = [...source].reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

/** Marks that carry no width: direction controls, joiners, the byte order mark. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;
/** Arabic short vowels and the superscript alef, both optional in writing. */
const HARAKAT = /[\u064B-\u0652\u0670]/g;
/** Combining marks of the Latin script, which carry the accents of French. */
const LATIN_MARKS = /[\u0300-\u036F]/g;
/** A decorative stretch between letters that readers see through. */
const TATWEEL = /\u0640/g;
/** Letters readers treat as interchangeable, whatever keyboard produced them. */
const ARABIC_FOLDING = [
  [/[أإآٱ]/g, 'ا'], // every alef spelling
  [/ة/g, 'ه'], // teh marbuta to heh
  [/ى/g, 'ي'], // alef maksura to yeh
  [/ؤ/g, 'و'], // waw with hamza
  [/ئ/g, 'ي'], // yeh with hamza
];

/**
 * Fold text down to what a search should compare.
 *
 * Mirrors normalize_search in the API step for step, because the member picker
 * filters in the browser while every other search runs in the database. The two
 * have to agree, or the same query would give two different answers.
 *
 * Everything a reader would call the same letter becomes the same character.
 * That matters most in Arabic: nobody types the hamza, so a search for
 * احمد has to find أحمد.
 *
 * @param {string | null | undefined} value Text to fold.
 * @returns {string} The folded form, for matching only and never for display.
 */
export function normalizeText(value) {
  if (!value) return '';
  let folded = value
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(TATWEEL, '')
    .replace(HARAKAT, '');
  for (const [pattern, replacement] of ARABIC_FOLDING) {
    folded = folded.replace(pattern, replacement);
  }
  return folded
    .normalize('NFD')
    .replace(LATIN_MARKS, '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Tell whether a text answers a search, word by word.
 *
 * Every word typed must appear somewhere in the text, in any order, as the
 * API matches them. A person types a name the way they read it, and the same
 * name may be held surname first elsewhere.
 *
 * @param {string | null | undefined} text What is searched through.
 * @param {string | null | undefined} term What was typed.
 * @returns {boolean} True when every word is found, or when nothing was typed.
 */
export function matchesSearch(text, term) {
  const words = normalizeText(term).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(text);
  return words.every((word) => haystack.includes(word));
}

/**
 * Format a month period as a capitalised French month and year.
 *
 * @param {string | Date | null | undefined} value First day of the month.
 * @returns {string} For instance "Janvier 2026".
 */
export function formatMonth(value) {
  const date = toDate(value);
  if (!date) return '—';
  const label = date.toLocaleDateString(FIGURE_TAG, { month: 'long', year: 'numeric' });
  return isolate(label.charAt(0).toUpperCase() + label.slice(1));
}

/**
 * Format a month period as a short label, for the chart axis.
 *
 * Truncating the formatted month would cut into the isolation marks, so the
 * shortening happens on the bare name and the protection is applied after.
 *
 * @param {string | Date | null | undefined} value First day of the month.
 * @returns {string} For instance "Jan".
 */
export function formatMonthShort(value) {
  const date = toDate(value);
  if (!date) return '—';
  const label = date.toLocaleDateString(FIGURE_TAG, { month: 'short' });
  return isolate(label.charAt(0).toUpperCase() + label.slice(1).replace(/\.$/, ''));
}
