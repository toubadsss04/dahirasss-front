import { useEffect, useState } from 'react';

/** Delay after which a pending request is worth explaining, in milliseconds. */
const NOTICE_DELAY_MS = 5000;

/**
 * Report whether a pending request has been running long enough to explain.
 *
 * On a weak mobile connection a call can take several seconds. Without a word
 * on screen that reads as a frozen application rather than a slow answer.
 *
 * @param {boolean} isPending Whether a request is currently in flight.
 * @param {number} [delay] How long to wait before saying anything.
 * @returns {boolean} True once the wait deserves an explanation.
 */
export function useSlowRequestNotice(isPending, delay = NOTICE_DELAY_MS) {
  const [isSlow, setSlow] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), delay);
    return () => clearTimeout(timer);
  }, [isPending, delay]);

  return isSlow;
}
