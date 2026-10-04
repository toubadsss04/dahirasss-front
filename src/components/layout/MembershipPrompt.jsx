import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import { UserPlus } from 'lucide-react';

import AppSelect from '../forms/AppSelect';
import { KEYS } from '../../constants/queryKeys';
import { useDomainMutation } from '../../hooks/useDomainMutation';
import { usePermissions } from '../../hooks/usePermissions';
import { joinSection } from '../../services/auth.service';
import { extractErrorMessage } from '../../services/apiClient';
import { fetchDaaraNames } from '../../services/daara.service';
import { memberGenderOptions } from '../../services/members.service';
import { useAuthStore } from '../../store/authStore';

/**
 * Invitation shown to a super administrator who is not yet a member.
 *
 * Every super administrator belongs to the Dahira as a member of a section,
 * so they can give at meetings like everyone else. Until they have chosen
 * one, along with their sex, this band stays at the top of every screen.
 * With no section created yet, it only says that one is needed first. Once
 * chosen, the section is changed from the member's own record.
 *
 * @returns {JSX.Element|null} The band, or nothing once the account is a member.
 */
export default function MembershipPrompt() {
  const { t } = useTranslation();
  const { user, isSuperAdmin } = usePermissions();
  const setUser = useAuthStore((state) => state.setUser);
  const [sectionId, setSectionId] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  const mustJoin = isSuperAdmin && !user?.member_id;
  const sections = useQuery({
    queryKey: [KEYS.daaraNames],
    queryFn: fetchDaaraNames,
    enabled: mustJoin,
  });
  const joinMutation = useDomainMutation('member', joinSection, {
    successMessage: t('membership.joined'),
    onSuccess: setUser,
  });

  if (!mustJoin) return null;

  const options = (sections.data ?? []).map((section) => ({
    value: section.id,
    label: section.name,
  }));

  const submit = async () => {
    setError('');
    try {
      await joinMutation.mutateAsync({ entityId: sectionId, gender });
    } catch (failure) {
      setError(extractErrorMessage(failure, 'errors.saveFailed'));
    }
  };

  return (
    <div className="callout" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <span className="ic">
        <UserPlus size={20} />
      </span>
      <span className="tx" style={{ flex: '1 1 240px' }}>
        {options.length > 0 ? t('membership.prompt') : t('membership.noSection')}
        {error && <div style={{ color: 'var(--neg)', marginTop: 4 }}>{error}</div>}
      </span>
      {options.length > 0 && (
        <>
          <AppSelect
            value={sectionId}
            onChange={setSectionId}
            options={options}
            allowEmpty
            placeholder={t('membership.choose')}
            sx={{ minWidth: 190 }}
          />
          <AppSelect
            value={gender}
            onChange={setGender}
            options={memberGenderOptions(t)}
            allowEmpty
            placeholder={t('membership.chooseGender')}
            sx={{ minWidth: 140 }}
          />
          <Button
            variant="contained"
            onClick={submit}
            disabled={!sectionId || !gender || joinMutation.isPending}
          >
            {t('membership.join')}
          </Button>
        </>
      )}
    </div>
  );
}
