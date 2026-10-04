import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AppSelect from '../forms/AppSelect';
import { useExerciseStore } from '../../store/exerciseStore';

/**
 * Global exercise picker shown in the top bar.
 *
 * Every financial screen reads its selection, so switching here changes what
 * the whole application reports on.
 *
 * @returns {JSX.Element | null} The picker, or nothing when no exercise exists.
 */
export default function ExerciseSelector() {
  const { t } = useTranslation();
  const exercises = useExerciseStore((state) => state.exercises);
  const selectedId = useExerciseStore((state) => state.selectedId);
  const hasLoaded = useExerciseStore((state) => state.hasLoaded);
  const load = useExerciseStore((state) => state.load);
  const select = useExerciseStore((state) => state.select);

  useEffect(() => {
    if (!hasLoaded) load();
  }, [hasLoaded, load]);

  if (exercises.length === 0) {
    return hasLoaded ? <span className="chip">{t('common.noExercise')}</span> : null;
  }

  return (
    <AppSelect
      label={t('common.exercise')}
      value={selectedId ?? ''}
      onChange={select}
      options={exercises.map((exercise) => ({
        value: exercise.id,
        label: exercise.name,
      }))}
      sx={{ minWidth: 168 }}
    />
  );
}
