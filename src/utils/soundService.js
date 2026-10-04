import ouverture from '../assets/ouverture.mp3';

/**
 * The opening sound.
 *
 * Imported rather than referenced by URL so the bundler fingerprints it, ships
 * it, and fails the build if it ever goes missing. A path written by hand only
 * fails in the browser, silently, once it is too late to notice.
 */

/**
 * The one element the sound is ever played through.
 *
 * A browser grants the right to play to the element that was played inside a
 * tap, not to the page, and pointing that element at another file afterwards
 * loses the grant. So there is a single element, created once and kept.
 */
let opening = null;

/** Whether the right to play has already been claimed, so it is claimed once. */
let reserved = false;

/**
 * Where the sign-in leaves word that the sound is owed.
 *
 * The chime belongs to arriving at the dashboard, not to the moment the
 * password is accepted, so the two screens have to agree across a navigation.
 * Session storage rather than a module variable: it survives a full reload, and
 * it is gone the next time the application is opened, so a restored session
 * never chimes on its own.
 */
const LOGIN_FLAG = 'daara.justSignedIn';

/** How loud the chime is played, once it is allowed to be heard. */
const VOLUME = 0.7;

/**
 * Return the element the opening sound plays through, creating it once.
 *
 * @returns {HTMLAudioElement|null} The element, or null outside a browser.
 */
function openingSound() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }
  if (!opening) {
    opening = new Audio(ouverture);
    opening.preload = 'auto';
    opening.volume = VOLUME;
  }
  return opening;
}

/**
 * Claim the right to play the chime, from inside the tap that signs in.
 *
 * Browsers refuse a sound that no one asked for, and only lift that refusal
 * for an element played while a tap is being handled. By the time the sign-in
 * request comes back the tap is long over, so the right is claimed here and
 * spent later, on arrival.
 *
 * The element is asked to play and stopped in the same breath, before the
 * sound can be heard. Stopping it only once the request has come back is too
 * late: on a phone that request takes long enough for the chime to be heard
 * at sign-in, which is not where it belongs. What grants the right is asking
 * during the tap, not the sound that follows.
 *
 * Playing it muted, as this once did, grants nothing at all: a muted sound is
 * allowed without a tap anywhere, which is why iPhones stayed silent.
 *
 * Called on every platform: a phone on Android refuses an unasked sound just
 * as an iPhone does. Claimed once, unless the browser refused, in which case
 * the next tap tries again.
 *
 * @returns {void}
 */
export function prepareOpeningSound() {
  const audio = openingSound();
  if (!audio || reserved) return;
  reserved = true;
  try {
    const started = audio.play();
    audio.pause();
    audio.currentTime = 0;
    if (started && typeof started.then === 'function') {
      started
        .then(() => {
          // Some browsers report the playback as started anyway. Stopping it
          // again costs nothing and keeps the sign-in silent.
          audio.pause();
          audio.currentTime = 0;
        })
        .catch((error) => {
          if (error.name === 'NotAllowedError') {
            reserved = false;
          }
        });
    }
  } catch (error) {
    reserved = false;
    console.warn('Could not reserve the opening sound:', error.message);
  }
}

/**
 * Play the opening sound.
 *
 * @returns {Promise<void>} Resolves once playback has started, or been refused.
 */
export async function playOpeningSound() {
  const audio = openingSound();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.volume = VOLUME;
    await audio.play().catch((error) => {
      console.warn('Sound playback prevented:', error.message);
    });
  } catch (error) {
    console.warn('Failed to play the opening sound:', error.message);
  }
}

/**
 * Record that a sign-in has just happened.
 *
 * Called by the sign-in screen, read once by the dashboard.
 */
export function setLoginFlag() {
  try {
    window.sessionStorage.setItem(LOGIN_FLAG, '1');
  } catch {
    /* Blocked site data is tolerated: the chime is simply skipped. */
  }
}

/**
 * Play the opening sound if a sign-in has just happened, then forget it.
 *
 * The flag is cleared before the sound is played, so a re-render, a fast
 * refresh in development, or a second mount cannot play it twice.
 *
 * @returns {Promise<void>} Resolves once playback has started, or been skipped.
 */
export async function playOpeningSoundIfNeeded() {
  let owed = false;
  try {
    owed = window.sessionStorage.getItem(LOGIN_FLAG) === '1';
    if (owed) {
      window.sessionStorage.removeItem(LOGIN_FLAG);
    }
  } catch {
    return;
  }
  if (owed) {
    await playOpeningSound();
  }
}
