import { create } from 'zustand';

/** How long a notice stays on screen, in milliseconds. */
const DISPLAY_MS = 4000;

let counter = 0;

/**
 * Queue of short notices confirming what an operation did.
 *
 * A queue rather than a single slot: recording several contributions in a row
 * is normal, and each one deserves its own confirmation instead of replacing
 * the previous before it has been read.
 */
export const useNotificationStore = create((set, get) => ({
  queue: [],

  /**
   * Add a notice to the queue.
   *
   * @param {string} message What happened, in plain words.
   * @param {'success' | 'error' | 'info' | 'warning'} [severity] Tone of the notice.
   */
  notify(message, severity = 'success') {
    counter += 1;
    set({ queue: [...get().queue, { id: counter, message, severity }] });
  },

  /**
   * Drop a notice once it has been shown or dismissed.
   *
   * @param {number} id Identifier of the notice.
   */
  dismiss(id) {
    set({ queue: get().queue.filter((notice) => notice.id !== id) });
  },

  /** Milliseconds a notice remains visible. */
  displayDuration: DISPLAY_MS,
}));

/**
 * Raise a notice from outside a React component.
 *
 * @param {string} message What happened.
 * @param {'success' | 'error' | 'info' | 'warning'} [severity] Tone of the notice.
 */
export function notify(message, severity = 'success') {
  useNotificationStore.getState().notify(message, severity);
}
