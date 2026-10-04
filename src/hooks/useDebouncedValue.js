import { useEffect, useState } from 'react';

/**
 * Hold a value back until it has stopped changing for a while.
 *
 * Used for searches sent to the API, so a query goes out once the person
 * pauses rather than on every key.
 *
 * @template T
 * @param {T} value The value as it changes.
 * @param {number} delay How long it must stay still, in milliseconds.
 * @returns {T} The settled value.
 */
export function useDebouncedValue(value, delay) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
