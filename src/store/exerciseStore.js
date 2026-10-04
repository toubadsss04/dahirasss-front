import { create } from 'zustand';

import { fetchExercises } from '../services/exercises.service';

const SELECTED_KEY = 'daara.exercise_id';

/**
 * Read the previously selected exercise.
 *
 * @returns {string | null} The stored identifier, or null.
 */
function readStoredSelection() {
  try {
    return window.localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist the selected exercise so it survives a reload.
 *
 * @param {string | null} exerciseId The identifier to store.
 */
function writeStoredSelection(exerciseId) {
  try {
    if (exerciseId) {
      window.localStorage.setItem(SELECTED_KEY, exerciseId);
    } else {
      window.localStorage.removeItem(SELECTED_KEY);
    }
  } catch {
    /* Blocked site data only costs the remembered selection. */
  }
}

/**
 * Exercise selection shared by every financial screen.
 *
 * The selector falls back to the first open exercise, then to the most recent
 * one, so a fresh sign-in lands on something sensible without a click.
 */
export const useExerciseStore = create((set, get) => ({
  exercises: [],
  selectedId: readStoredSelection(),
  isLoading: false,
  hasLoaded: false,

  /**
   * Load the exercise list and settle on a selection.
   *
   * @returns {Promise<void>} Resolves once the attempt has settled.
   */
  async load() {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const exercises = await fetchExercises();
      const stored = get().selectedId;
      const isStoredStillValid = exercises.some((exercise) => exercise.id === stored);
      const openExercise = exercises.find((exercise) => exercise.status === 'OPEN');
      const selectedId = isStoredStillValid
        ? stored
        : (openExercise?.id ?? exercises[0]?.id ?? null);

      writeStoredSelection(selectedId);
      set({ exercises, selectedId, isLoading: false, hasLoaded: true });
    } catch {
      set({ exercises: [], isLoading: false, hasLoaded: true });
    }
  },

  /**
   * Change the active exercise.
   *
   * @param {string} exerciseId The identifier to select.
   */
  select(exerciseId) {
    writeStoredSelection(exerciseId);
    set({ selectedId: exerciseId });
  },

  /**
   * Return the selected exercise object.
   *
   * @returns {object | null} The exercise, or null when none is selected.
   */
  selected() {
    const { exercises, selectedId } = get();
    return exercises.find((exercise) => exercise.id === selectedId) ?? null;
  },

  /** Clear the list, used when signing out. */
  reset() {
    set({ exercises: [], hasLoaded: false });
  },
}));
