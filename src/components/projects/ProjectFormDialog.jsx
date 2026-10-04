import { useTranslation } from 'react-i18next';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import { SHARE_MODES } from '../../constants/projects';
import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';

/**
 * Keep only the digits of a typed amount.
 *
 * @param {string} value The text as typed.
 * @returns {string} The digits.
 */
const digits = (value) => value.replace(/[^0-9]/g, '');

/**
 * Creation or correction form of a project.
 *
 * The cost is optional, since it is often unknown when the project starts,
 * and can be filled in later through the same form.
 *
 * A project may be tied to a Gamou: its payments then count in that exercise
 * and a meeting of the exercise can collect for it. The link can only change
 * while the project has received nothing.
 *
 * The share asked of each member is optional too. It is either the same for
 * everyone, or set per category in a compact grid, one small field per
 * category; a category left empty asks nothing of its members.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {boolean} props.editing Whether an existing project is corrected.
 * @param {object} props.form The form values.
 * @param {(form: object) => void} props.onChange Called with the new values.
 * @param {boolean} props.submitDisabled Hold the submit button back.
 * @param {() => Promise<void>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @param {Array<{value: string, label: string}>} props.exerciseOptions Exercises a project may be tied to.
 * @param {string} [props.defaultExerciseId] Exercise proposed when the link is switched on.
 * @param {boolean} [props.gamouLocked] Hold the Gamou link as it is.
 * @param {Array<{id: string, name: string}>} [props.categories] Categories a share may be set for.
 * @returns {JSX.Element} The dialog.
 */
export default function ProjectFormDialog({
  open,
  editing,
  form,
  onChange,
  submitDisabled,
  onSubmit,
  onClose,
  exerciseOptions = [],
  defaultExerciseId = '',
  gamouLocked = false,
  categories = [],
}) {
  const { t } = useTranslation();
  const set = (field) => (event) => onChange({ ...form, [field]: event.target.value });
  const setAmount = (field) => (event) =>
    onChange({ ...form, [field]: digits(event.target.value) });
  const isGamou = Boolean(form.exercise_id);
  const setCategoryAmount = (entityId) => (event) =>
    onChange({
      ...form,
      category_amounts: { ...form.category_amounts, [entityId]: digits(event.target.value) },
    });
  const toggleGamou = (event) =>
    onChange({
      ...form,
      exercise_id: event.target.checked
        ? defaultExerciseId || exerciseOptions[0]?.value || ''
        : '',
    });

  return (
    <FormDialog
      open={open}
      title={editing ? t('projects.form.editTitle') : t('projects.form.title')}
      submitLabel={editing ? t('common.actions.edit') : t('common.actions.create')}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <TextField
        label={t('projects.form.name')}
        value={form.name}
        onChange={set('name')}
        size="small"
        autoFocus
        required
      />
      <FormControlLabel
        control={
          <Switch
            checked={isGamou}
            onChange={toggleGamou}
            disabled={gamouLocked || exerciseOptions.length === 0}
          />
        }
        label={t('projects.form.gamou')}
      />
      {isGamou && (
        <AppSelect
          label={t('projects.form.exercise')}
          value={form.exercise_id}
          onChange={(value) => onChange({ ...form, exercise_id: value })}
          options={exerciseOptions}
          disabled={gamouLocked}
          fullWidth
        />
      )}
      {gamouLocked && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -6 }}>
          {t('projects.form.gamouLocked')}
        </div>
      )}
      <TextField
        label={t('projects.form.cost')}
        value={form.cost}
        onChange={setAmount('cost')}
        helperText={t('projects.form.costHint')}
        size="small"
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {t('projects.form.share')}
        </div>
        <RadioGroup
          row
          value={form.share_mode}
          onChange={(event) => onChange({ ...form, share_mode: event.target.value })}
        >
          <FormControlLabel
            value={SHARE_MODES.SAME}
            control={<Radio size="small" />}
            label={t('projects.form.shareSame')}
          />
          <FormControlLabel
            value={SHARE_MODES.CATEGORY}
            control={<Radio size="small" />}
            label={t('projects.form.shareCategory')}
            disabled={categories.length === 0}
          />
        </RadioGroup>
      </div>
      {form.share_mode === SHARE_MODES.SAME ? (
        <TextField
          label={t('projects.form.amountPerMember')}
          value={form.amount_per_member}
          onChange={setAmount('amount_per_member')}
          helperText={t('projects.form.amountPerMemberHint')}
          size="small"
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
            maxHeight: 220,
            overflowY: 'auto',
            paddingTop: 6,
          }}
        >
          {categories.map((category) => (
            <TextField
              key={category.id}
              label={category.name}
              value={form.category_amounts[category.id] ?? ''}
              onChange={setCategoryAmount(category.id)}
              size="small"
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          ))}
        </div>
      )}
      <TextField
        label={t('common.fields.description')}
        value={form.description}
        onChange={set('description')}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
