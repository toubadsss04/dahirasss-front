/**
 * Pot key of the Gamou of the selected exercise.
 *
 * An expense or a Barkelou goes either to the Gamou of an exercise or to a
 * project. On a form the choice is one select, so the Gamou needs a key of its
 * own beside the project identifiers.
 */
export const GAMOU_POT = 'GAMOU';

/** Values of the filter that splits operations by pot. */
export const POT_FILTERS = {
  GAMOU: 'GAMOU',
  PROJECTS: 'PROJECTS',
  APART: 'APART',
};

/** Shortest donor name and expense description the API accepts. */
export const MIN_LABEL_LENGTH = 2;
