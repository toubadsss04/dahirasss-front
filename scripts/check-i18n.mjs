/**
 * Guards on the promise that switching language leaves no French behind.
 *
 * Three separate failures are possible and each has its own check here.
 *
 * A sentence can be written straight into a screen, where no catalogue will
 * ever reach it. The linter refuses that between JSX tags, but it cannot tell a
 * label from a className, so the props that render as text are checked here by
 * name.
 *
 * A key can exist in one language and not the other, which shows the reader a
 * French fallback in an otherwise Arabic screen.
 *
 * And a key can be copied across untranslated, which looks complete to a key
 * count and reads as French to a person. That is caught by comparing the two
 * values and by looking for French inside the Arabic catalogue.
 *
 * Run with: npm run i18n:check
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import ar from '../src/i18n/ar.js';
import fr from '../src/i18n/fr.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = join(ROOT, 'src');

/**
 * Props whose value is read by a person rather than by the browser.
 *
 * Anything not on this list is technical: className, variant, size, type. A new
 * prop that renders text belongs here the day it is introduced.
 */
const TEXT_PROPS = [
  'label',
  'title',
  'subtitle',
  'placeholder',
  'helperText',
  'description',
  'message',
  'emptyMessage',
  'submitLabel',
  'confirmLabel',
  'cancelLabel',
  'reasonLabel',
  'successMessage',
  'noOptionsText',
  'alt',
  'aria-label',
];

/** Values that are punctuation or a unit rather than language. */
const ALLOWED = new Set(['', '—', '·', ' · ', 'F', '?', '/', ' / ', ' → ', ':', ' : ']);

/** Words that only ever appear in French, used to spot an untranslated value. */
const FRENCH_MARKERS = [
  /\b(le|la|les|un|une|des|du|au|aux)\b/i,
  /\b(aucun|aucune|pour|sur|dans|avec|sans|par|est|sont|plus)\b/i,
  /[éèêëàâçùûôîï]/i,
];

/**
 * Values legitimately identical in both languages.
 *
 * A name, a figure, or a line made only of placeholders carries no language, so
 * finding it unchanged in the Arabic catalogue is correct rather than a
 * forgotten translation.
 */
const SAME_IN_BOTH = new Set([
  '—',
  'Dahira Sant Serigne Saliou, Touba unité 4',
  '5000',
  'Gamou 2027',
  '{{name}} · {{status}}',
  '{{label}} · {{exercise}}',
]);

const problems = [];

/**
 * Walk every JavaScript source file under src.
 *
 * @param {string} directory Where to start.
 * @returns {Array<string>} Absolute paths of the files found.
 */
function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.jsx?$/.test(name) ? [path] : [];
  });
}

/**
 * Report any French sentence left anywhere in the source.
 *
 * The linter only inspects text sitting directly between JSX tags, so a
 * sentence hidden inside an expression walks straight past it. That is not a
 * hypothetical: the deactivate button of the daara cards was written as a
 * ternary and stayed French through the whole conversion.
 *
 * This looks at every string literal instead, and reports the ones that read as
 * French. Code identifiers survive because they carry no accent and no article.
 */
function checkFrenchResidue() {
  // A quoted string of at least four characters, on one line.
  const literals = /(['"])((?:(?!\1)[^\\\n]|\\.){4,})\1/g;

  for (const path of sourceFiles(SOURCE)) {
    if (path.includes(`${join('src', 'i18n')}`)) continue;
    // The theme holds colours and font names by design, never a sentence, and
    // a font stack ending in sans-serif reads as French to the marker below.
    if (path.includes(`${join('src', 'theme')}`)) continue;
    const source = readFileSync(path, 'utf8');

    for (const match of source.matchAll(literals)) {
      const value = match[2];
      if (ALLOWED.has(value)) continue;
      // Import paths, class names and keys are not sentences.
      if (/^[\w./@-]+$/.test(value)) continue;
      if (!FRENCH_MARKERS.some((pattern) => pattern.test(value))) continue;

      const line = source.slice(0, match.index).split('\n').length;
      problems.push(
        `${relative(ROOT, path)}:${line}  phrase française en dur : ${JSON.stringify(value)}`,
      );
    }
  }
}

/** Report every text-bearing prop given a literal string instead of a key. */
function checkLiteralProps() {
  const pattern = new RegExp(`\\b(${TEXT_PROPS.join('|')})=("([^"]*)"|'([^']*)')`, 'g');

  for (const path of sourceFiles(SOURCE)) {
    // The catalogues are where sentences are supposed to live.
    if (path.includes(`${join('src', 'i18n')}`)) continue;
    const source = readFileSync(path, 'utf8');

    for (const match of source.matchAll(pattern)) {
      const value = match[3] ?? match[4];
      if (ALLOWED.has(value)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      problems.push(
        `${relative(ROOT, path)}:${line}  ${match[1]} porte un texte en dur : ${JSON.stringify(value)}`,
      );
    }
  }
}

/**
 * Report keys the code asks for that no catalogue holds.
 *
 * Parity between the two catalogues says nothing about whether a screen asks
 * for a key that was never written. That gap is real: the account form was
 * changed to take a first and last name and asked for two keys that did not
 * exist yet, and every check passed.
 *
 * Only literal keys can be checked. A key built at runtime, such as the status
 * labels, is skipped here and caught by the loud missing-key handler instead.
 *
 * @param {Map<string, string>} french Every leaf of the French catalogue.
 */
function checkKeysExist(french) {
  const call = /\bt\(\s*'([a-zA-Z][\w.]*)'/g;
  const families = new Set([...french.keys()].map(pluralFamily));

  for (const path of sourceFiles(SOURCE)) {
    if (path.includes(`${join('src', 'i18n')}`)) continue;
    const source = readFileSync(path, 'utf8');

    for (const match of source.matchAll(call)) {
      const key = match[1];
      if (french.has(key) || families.has(key)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      problems.push(`${relative(ROOT, path)}:${line}  clé inexistante : ${key}`);
    }
  }
}

/**
 * Flatten a catalogue into dotted keys.
 *
 * @param {object} node The catalogue or one of its sections.
 * @param {string} [prefix] Key path accumulated so far.
 * @returns {Map<string, string>} Every leaf, by dotted key.
 */
function flatten(node, prefix = '') {
  const entries = new Map();
  for (const [name, value] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (value && typeof value === 'object') {
      for (const [nested, leaf] of flatten(value, key)) entries.set(nested, leaf);
    } else {
      entries.set(key, value);
    }
  }
  return entries;
}

/** The plural suffixes i18next reads, longest first so _one wins over _other. */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/**
 * Strip the plural suffix from a key.
 *
 * A counted sentence is one entry in two languages that disagree on how many
 * forms it takes: French distinguishes two, Arabic six. Comparing the suffixed
 * keys would report four missing French entries for every counted sentence,
 * which is not a gap but the point.
 *
 * @param {string} key A dotted key, possibly suffixed.
 * @returns {string} The key without its plural suffix.
 */
function pluralFamily(key) {
  return key.replace(PLURAL_SUFFIX, '');
}

/** Report sentences present in one catalogue and missing from the other. */
function checkParity(french, arabic) {
  const frenchFamilies = new Set([...french.keys()].map(pluralFamily));
  const arabicFamilies = new Set([...arabic.keys()].map(pluralFamily));

  for (const key of frenchFamilies) {
    if (!arabicFamilies.has(key)) problems.push(`ar : phrase absente  ${key}`);
  }
  for (const key of arabicFamilies) {
    if (!frenchFamilies.has(key)) problems.push(`fr : phrase absente  ${key}`);
  }

  // Arabic needs all six forms of a counted sentence. Five of them present is
  // a gap that only shows up on the one count that lands in the missing form.
  const REQUIRED = ['zero', 'one', 'two', 'few', 'many', 'other'];
  const counted = new Set(
    [...arabic.keys()].filter((key) => PLURAL_SUFFIX.test(key)).map(pluralFamily),
  );
  for (const family of counted) {
    const missing = REQUIRED.filter((form) => !arabic.has(`${family}_${form}`));
    if (missing.length > 0) {
      problems.push(`ar : formes de pluriel manquantes  ${family} → ${missing.join(', ')}`);
    }
  }
}

/** Report Arabic values that are still French, whether copied or forgotten. */
function checkArabicIsArabic(french, arabic) {
  for (const [key, value] of arabic) {
    if (typeof value !== 'string' || SAME_IN_BOTH.has(value)) continue;

    if (french.get(key) === value) {
      problems.push(`ar : identique au français  ${key}`);
      continue;
    }
    const marker = FRENCH_MARKERS.find((pattern) => pattern.test(value));
    if (marker) {
      problems.push(`ar : contient du français  ${key} → ${JSON.stringify(value)}`);
    }
  }
}

checkLiteralProps();
checkFrenchResidue();
const french = flatten(fr);
const arabic = flatten(ar);
checkKeysExist(french);
checkParity(french, arabic);
checkArabicIsArabic(french, arabic);

const translated = arabic.size;
console.log(`français : ${french.size} clés`);
console.log(`arabe    : ${translated} clés (${Math.round((translated / french.size) * 100)} %)`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problème(s) :\n`);
  for (const line of problems) console.error(`  ${line}`);
  process.exit(1);
}
console.log('\nAucun texte en dur, aucune clé orpheline.');
