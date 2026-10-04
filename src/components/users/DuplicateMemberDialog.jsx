import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { TriangleAlert, UserCheck } from 'lucide-react';

import { memberGenderShortKey } from '../../constants/labels';
import { extractErrorMessage } from '../../services/apiClient';
import { avatarColor, personInitials } from '../../utils/format';

/**
 * Warning shown when the name typed for a new account is already a member's.
 *
 * Creating the account from scratch would record the same person twice, so
 * the first way out is to make the account from that member. Creating anyway
 * stays possible for two different people sharing a name. A member who is
 * already someone's account is listed for information and cannot be chosen.
 *
 * @param {object} props Component props.
 * @param {Array<object>|null} props.matches The matching members, null when closed.
 * @param {(member: object) => void} props.onUseMember Called with the member to build the account from.
 * @param {() => Promise<void>} props.onCreateAnyway Called to create a new person regardless.
 * @param {() => void} props.onClose Called when dismissed.
 * @returns {JSX.Element} The dialog.
 */
export default function DuplicateMemberDialog({
  matches,
  onUseMember,
  onCreateAnyway,
  onClose,
}) {
  const { t } = useTranslation();
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const createAnyway = async () => {
    setBusy(true);
    setError('');
    try {
      await onCreateAnyway();
    } catch (createError) {
      setError(extractErrorMessage(createError, 'errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={Boolean(matches)}
      onClose={isBusy ? undefined : close}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TriangleAlert size={20} color="var(--warn)" />
        {t('users.duplicate.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, mb: 2 }}>
          {t('users.duplicate.body', { count: matches?.length ?? 0 })}
        </DialogContentText>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(matches ?? []).map((member) => {
            const name = `${member.first_name} ${member.last_name}`;
            return (
              <div
                key={member.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    background: avatarColor(name),
                    flex: '0 0 auto',
                  }}
                >
                  {personInitials(member)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    <span>
                      {member.entity_name || t('common.empty.noCategory')}
                      {member.phone && (
                        <>
                          {' · '}
                          <bdi dir="ltr">{member.phone}</bdi>
                        </>
                      )}
                    </span>
                    {member.gender && (
                      <span style={{ fontWeight: 600, flex: '0 0 auto' }}>
                        {t(memberGenderShortKey(member.gender))}
                      </span>
                    )}
                  </div>
                </div>
                {member.has_account ? (
                  <span className="chip">{t('users.duplicate.hasAccount')}</span>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<UserCheck size={14} />}
                    disabled={isBusy}
                    onClick={() => onUseMember(member)}
                  >
                    {t('users.duplicate.useMember')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={close} disabled={isBusy} color="inherit">
          {t('common.actions.cancel')}
        </Button>
        <Button
          onClick={createAnyway}
          disabled={isBusy}
          color="warning"
          startIcon={isBusy ? <CircularProgress size={15} color="inherit" /> : null}
        >
          {t('users.duplicate.createAnyway')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
