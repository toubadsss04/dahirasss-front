import { useTranslation } from 'react-i18next';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import AppSelect from '../forms/AppSelect';
import FormDialog from '../ui/FormDialog';
import { pricingModeKey } from '../../constants/labels';
import { PRICING_MODES } from '../../constants/rental';

/**
 * Creation or correction of an article of the catalogue.
 *
 * Quantities are not typed here: the stock only changes through movements.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {boolean} [props.editing] Whether an existing article is corrected.
 * @param {object} props.form Form state.
 * @param {(form: object) => void} props.onChange Called with the new state.
 * @param {Array<{value: string, label: string}>} props.categoryOptions Active categories.
 * @param {Array<{value: string, label: string}>} props.unitOptions Active units.
 * @param {boolean} props.submitDisabled Hold the submit button back.
 * @param {() => Promise<unknown>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ArticleFormDialog({
  open,
  editing = false,
  form,
  onChange,
  categoryOptions,
  unitOptions,
  submitDisabled,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const set = (field) => (event) => onChange({ ...form, [field]: event.target.value });

  return (
    <FormDialog
      open={open}
      title={editing ? t('rental.articles.editTitle') : t('rental.articles.newTitle')}
      submitLabel={editing ? t('common.actions.save') : t('common.actions.create')}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
      onClose={onClose}
      maxWidth="sm"
    >
      <TextField
        label={t('rental.articles.fields.name')}
        value={form.name}
        onChange={set('name')}
        size="small"
        required
        autoFocus
      />
      <TextField
        label={t('rental.articles.fields.reference')}
        value={form.reference}
        onChange={set('reference')}
        size="small"
      />
      <AppSelect
        label={t('rental.articles.fields.category')}
        value={form.categoryId}
        onChange={(value) => onChange({ ...form, categoryId: value })}
        options={categoryOptions}
        allowEmpty
        placeholder={t('rental.articles.noCategory')}
        fullWidth
      />
      <AppSelect
        label={t('rental.articles.fields.unit')}
        value={form.unitId}
        onChange={(value) => onChange({ ...form, unitId: value })}
        options={unitOptions}
        fullWidth
      />
      <TextField
        label={t('rental.articles.fields.price')}
        value={form.price}
        onChange={set('price')}
        size="small"
        type="number"
        inputProps={{ min: 0, step: 1 }}
        helperText={t('rental.articles.priceHint')}
      />
      <TextField
        label={t('rental.articles.fields.replacementPrice')}
        value={form.replacementPrice}
        onChange={set('replacementPrice')}
        size="small"
        type="number"
        inputProps={{ min: 0, step: 1 }}
        helperText={t('rental.articles.replacementPriceHint')}
      />
      <AppSelect
        label={t('rental.articles.fields.pricingMode')}
        value={form.pricingMode}
        onChange={(value) => onChange({ ...form, pricingMode: value })}
        options={Object.values(PRICING_MODES).map((mode) => ({
          value: mode,
          label: t(pricingModeKey(mode)),
        }))}
        fullWidth
      />
      <TextField
        label={t('rental.articles.fields.description')}
        value={form.description}
        onChange={set('description')}
        size="small"
        multiline
        minRows={2}
      />
      {editing && (
        <FormControlLabel
          control={
            <Switch
              checked={form.isActive}
              onChange={(event) => onChange({ ...form, isActive: event.target.checked })}
            />
          }
          label={t('rental.articles.fields.active')}
        />
      )}
    </FormDialog>
  );
}
