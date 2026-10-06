import { useTranslation } from 'react-i18next';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { ChevronDown } from 'lucide-react';

import { useDropdownPlacement } from '../../hooks/useDropdownPlacement';

/** Height cap on the dropdown panel, so long lists scroll instead of growing. */
const MENU_MAX_HEIGHT = 320;

/**
 * Dropdown built on the Material UI select.
 *
 * The project uses no native select anywhere, so this component is the single
 * way a choice list is rendered. The panel opens below the field, or above it
 * when the window has no room below, never over it, and is height capped so a
 * long list scrolls.
 *
 * When an empty choice is offered, the label is pinned above the field and the
 * outline notched for it. Without that, Material UI treats the field as empty
 * and lays the label over the placeholder text.
 *
 * @param {object} props Component props.
 * @param {string} [props.label] Field label.
 * @param {string} props.value Selected value.
 * @param {(value: string) => void} props.onChange Called with the new value.
 * @param {Array<{value: string, label: string}>} props.options Available choices.
 * @param {string} [props.placeholder] Label of the empty choice.
 * @param {boolean} [props.allowEmpty] Whether the empty choice is offered.
 * @param {boolean} [props.disabled] Whether the field is disabled.
 * @param {boolean} [props.required] Whether a choice is mandatory, marked on the label.
 * @param {boolean} [props.fullWidth] Whether the field spans its container.
 * @param {string} [props.helperText] Short explanation shown under the field.
 * @param {'small' | 'medium'} [props.size] Field density.
 * @param {object} [props.sx] Additional styles.
 * @returns {JSX.Element} The dropdown.
 */
export default function AppSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  allowEmpty = false,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'small',
  helperText,
  sx,
}) {
  const { t } = useTranslation();
  const { anchorRef, menuProps, onOpen } = useDropdownPlacement(MENU_MAX_HEIGHT);
  const labelId = label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <FormControl
      ref={anchorRef}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      required={required}
      sx={sx}
    >
      {label && (
        <InputLabel id={labelId} shrink={allowEmpty ? true : undefined}>
          {label}
        </InputLabel>
      )}
      <Select
        labelId={labelId}
        label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        IconComponent={(iconProps) => <ChevronDown size={16} {...iconProps} />}
        onOpen={onOpen}
        MenuProps={menuProps}
        displayEmpty={allowEmpty}
        notched={allowEmpty && Boolean(label) ? true : undefined}
      >
        {allowEmpty && (
          <MenuItem value="">
            <em>{placeholder ?? t('common.filters.any')}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
