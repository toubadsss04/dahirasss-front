import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

/**
 * Style caches, one per reading direction.
 *
 * Material UI writes its spacing in physical terms: the gap between a button
 * icon and its label is a right margin. Under a right-to-left layout the icon
 * moves to the other side but the margin does not follow, and the two end up
 * touching. There are dozens of such rules across dialogs, fields, menus and
 * alerts, and patching them one by one would mean finding them one by one.
 *
 * This flips them all at the source instead: every physical rule Material UI
 * emits is mirrored on its way into the page. Nothing to remember, and nothing
 * to forget when a new component is used for the first time.
 *
 * The two caches carry different keys so the class names never collide when the
 * language is switched without a reload.
 */

/** Styles as written, for a left-to-right reading. */
export const ltrCache = createCache({ key: 'mui', stylisPlugins: [prefixer] });

/** The same styles, mirrored, for a right-to-left reading. */
export const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });

/**
 * The cache matching a reading direction.
 *
 * @param {boolean} rightToLeft Whether the interface reads right to left.
 * @returns {import('@emotion/cache').EmotionCache} The cache to provide.
 */
export function cacheFor(rightToLeft) {
  return rightToLeft ? rtlCache : ltrCache;
}
