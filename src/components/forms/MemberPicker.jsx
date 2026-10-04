import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { memberGenderShortKey } from '../../constants/labels';
import { useKeyboardSafeDropdown } from '../../hooks/useKeyboardSafeDropdown';
import { avatarColor, matchesSearch, personInitials } from '../../utils/format';

/**
 * Searchable member picker.
 *
 * Typing filters the list by name or phone, word by word and ignoring accents
 * and case, which matters for names such as Aïcha or Ndèye, and also by
 * section when sections are shown. Each option shows the member's sex as F or
 * H at the right of the line under the name, so two people bearing the same
 * name can be told apart. The panel is height capped and scrolls
 * internally, so a long list stays usable on a phone.
 *
 * On a phone the field rises to the top of the screen when it opens, and the
 * list always opens below it, sized to what the keyboard leaves visible, so
 * the text being typed is never hidden behind the list.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.members Members to choose from.
 * @param {object|null} props.value Selected member.
 * @param {(member: object|null) => void} props.onChange Called with the selection.
 * @param {string} [props.label] Field label.
 * @param {boolean} [props.disabled] Whether the field is disabled.
 * @param {string} [props.helperText] Hint shown under the field.
 * @param {boolean} [props.showDaara] Show each member's section, for a list spanning several.
 * @param {boolean} [props.groupBySection] Group the list under a heading per section.
 *   The members must then arrive sorted by section.
 * @returns {JSX.Element} The picker.
 */
export default function MemberPicker({
  members = [],
  value,
  onChange,
  label,
  disabled = false,
  helperText,
  showDaara = false,
  groupBySection = false,
}) {
  const { t } = useTranslation();
  const { anchorRef, listMaxHeight, onOpen, onClose } = useKeyboardSafeDropdown();
  const filterMembers = (options, { inputValue }) =>
    options.filter((member) =>
      matchesSearch(
        `${member.full_name || `${member.first_name} ${member.last_name}`} ${member.phone || ''} ${showDaara ? member.entity_name || '' : ''}`,
        inputValue,
      ),
    );

  const labelFor = (member) =>
    member.full_name || `${member.first_name} ${member.last_name}`.trim();

  return (
    <Autocomplete
      options={members}
      value={value ?? null}
      onChange={(_, selected) => onChange(selected)}
      getOptionLabel={labelFor}
      isOptionEqualToValue={(option, selected) => option.id === selected?.id}
      filterOptions={filterMembers}
      groupBy={
        groupBySection
          ? (member) => member.entity_name || t('common.empty.noCategory')
          : undefined
      }
      disabled={disabled}
      noOptionsText={t('common.noMemberMatches')}
      size="small"
      fullWidth
      ref={anchorRef}
      className="keyboard-safe-field"
      onOpen={onOpen}
      onClose={onClose}
      slotProps={{
        listbox: { style: { maxHeight: listMaxHeight } },
        popper: {
          placement: 'bottom-start',
          modifiers: [{ name: 'flip', enabled: false }],
        },
      }}
      renderInput={(params) => (
        <TextField {...params} label={label ?? t('common.member')} helperText={helperText} />
      )}
      renderOption={(optionProps, member) => {
        const { key, ...rest } = optionProps;
        const name = labelFor(member);
        const details = [showDaara ? member.entity_name : null, member.phone]
          .filter(Boolean)
          .join(' · ');
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                background: avatarColor(name),
                flex: '0 0 auto',
              }}
            >
              {personInitials(member)}
            </Box>
            <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
              <Box sx={{ fontWeight: 600, fontSize: 14 }}>{name}</Box>
              {(details || member.gender) && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  <span>{details}</span>
                  {member.gender && (
                    <Box component="span" sx={{ fontWeight: 600, flex: '0 0 auto' }}>
                      {t(memberGenderShortKey(member.gender))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      }}
    />
  );
}
