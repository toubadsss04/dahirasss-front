import { useTranslation } from 'react-i18next';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';

import { CONTRIBUTOR_KINDS } from '../../constants/projects';
import MemberPicker from '../forms/MemberPicker';
import FormDialog from '../ui/FormDialog';

/**
 * Entry of a payment towards a project.
 *
 * The contributor is either a member of the Daara, chosen among every member
 * whatever their daara and shown with it, or someone from outside, typed by name with an
 * optional phone number. When the dialog is opened from a contributor's row,
 * that contributor is fixed and only the new instalment is typed.
 *
 * The same dialog corrects a recorded payment: the contributor stays fixed
 * and only the amount, the date and the comment can change.
 *
 * @param {object} props Component props.
 * @param {boolean} props.open Whether the dialog is visible.
 * @param {boolean} [props.editing] Whether a recorded payment is corrected.
 * @param {object} props.form The form values.
 * @param {(form: object) => void} props.onChange Called with the new values.
 * @param {Array<object>} props.members Every member that may be chosen.
 * @param {boolean} props.membersLoading Whether the member list is still loading.
 * @param {boolean} props.submitDisabled Hold the submit button back.
 * @param {() => Promise<void>} props.onSubmit Called on submission.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function ProjectPaymentDialog({
  open,
  editing = false,
  form,
  onChange,
  members,
  membersLoading,
  submitDisabled,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation();
  const set = (field) => (event) => onChange({ ...form, [field]: event.target.value });

  return (
    <FormDialog
      open={open}
      title={
        editing
          ? t('projects.payment.editTitle', { name: form.contributor.full_name })
          : form.contributor
            ? t('projects.payment.titleFor', { name: form.contributor.full_name })
            : t('projects.payment.title')
      }
      submitLabel={editing ? t('common.actions.edit') : undefined}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      {!form.contributor && (
        <>
          <RadioGroup
            row
            value={form.kind}
            onChange={(event) => onChange({ ...form, kind: event.target.value })}
          >
            <FormControlLabel
              value={CONTRIBUTOR_KINDS.MEMBER}
              control={<Radio size="small" />}
              label={t('projects.payment.kindMember')}
            />
            <FormControlLabel
              value={CONTRIBUTOR_KINDS.EXTERNAL}
              control={<Radio size="small" />}
              label={t('projects.payment.kindExternal')}
            />
          </RadioGroup>

          {form.kind === CONTRIBUTOR_KINDS.MEMBER ? (
            <MemberPicker
              members={members}
              value={form.member}
              onChange={(member) => onChange({ ...form, member })}
              disabled={membersLoading}
              showDaara
              helperText={t('projects.payment.memberHint')}
            />
          ) : (
            <>
              <TextField
                label={t('projects.payment.externalName')}
                value={form.external_name}
                onChange={set('external_name')}
                size="small"
                required
              />
              <TextField
                label={t('projects.payment.externalPhone')}
                value={form.external_phone}
                onChange={set('external_phone')}
                size="small"
                slotProps={{ htmlInput: { inputMode: 'tel' } }}
              />
            </>
          )}
        </>
      )}

      <TextField
        label={t('common.fields.amount')}
        value={form.amount}
        onChange={(event) =>
          onChange({ ...form, amount: event.target.value.replace(/[^0-9]/g, '') })
        }
        size="small"
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        required
      />
      <TextField
        label={t('common.fields.date')}
        type="date"
        value={form.payment_date}
        onChange={set('payment_date')}
        size="small"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={t('common.fields.comment')}
        value={form.comment}
        onChange={set('comment')}
        size="small"
        multiline
        minRows={2}
      />
    </FormDialog>
  );
}
