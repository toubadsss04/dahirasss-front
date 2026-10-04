import { useCallback, useEffect, useRef, useState } from 'react';

/** Tallest the list may grow, when the screen has room for it. */
const MAX_LIST_HEIGHT = 320;

/** Shortest the list may shrink to, so a few names always show. */
const MIN_LIST_HEIGHT = 160;

/** Room kept for the sticky top bar and the field itself, in pixels. */
const RESERVED_HEIGHT = 170;

/** Time the on-screen keyboard takes to finish sliding in, in milliseconds. */
const KEYBOARD_SETTLE_MS = 320;

/** Class that gives the page extra room below, so the field can rise to the top. */
const OPEN_CLASS = 'dropdown-open';

/**
 * Tell whether the screen is driven by touch, where an on-screen keyboard
 * rises over the page. With a mouse there is no keyboard to dodge, so the
 * page must not move when a list opens.
 *
 * @returns {boolean} True on a touch screen.
 */
function isTouchScreen() {
  return Boolean(window.matchMedia?.('(pointer: coarse)').matches);
}

/**
 * Keep a searchable dropdown usable while the phone keyboard is up.
 *
 * On a phone, the keyboard covers the bottom half of the screen. A field
 * near the bottom then has no room below it, so the list opened above and
 * covered the very field being typed in. Here the field is scrolled to the
 * top of what remains visible, the list always opens below it, and the list
 * is sized to the height the keyboard leaves free. With a mouse nothing
 * moves: the list simply opens below the field.
 *
 * @returns {{
 *   anchorRef: import('react').MutableRefObject<HTMLElement|null>,
 *   listMaxHeight: number,
 *   onOpen: () => void,
 *   onClose: () => void,
 * }} What the dropdown needs.
 */
export function useKeyboardSafeDropdown() {
  const anchorRef = useRef(null);
  const timerRef = useRef(null);
  const [listMaxHeight, setListMaxHeight] = useState(MAX_LIST_HEIGHT);
  const [isOpen, setOpen] = useState(false);

  const measure = useCallback(() => {
    const visible = window.visualViewport?.height ?? window.innerHeight;
    const room = visible - RESERVED_HEIGHT;
    setListMaxHeight(Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, room)));
  }, []);

  const onOpen = useCallback(() => {
    setOpen(true);
    if (!isTouchScreen()) {
      measure();
      return;
    }
    document.body.classList.add(OPEN_CLASS);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      measure();
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      anchorRef.current?.scrollIntoView({
        block: 'start',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }, KEYBOARD_SETTLE_MS);
  }, [measure]);

  const onClose = useCallback(() => {
    setOpen(false);
    clearTimeout(timerRef.current);
    document.body.classList.remove(OPEN_CLASS);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', measure);
    return () => viewport?.removeEventListener('resize', measure);
  }, [isOpen, measure]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      document.body.classList.remove(OPEN_CLASS);
    },
    [],
  );

  return { anchorRef, listMaxHeight, onOpen, onClose };
}
