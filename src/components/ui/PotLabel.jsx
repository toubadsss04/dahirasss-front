import { useTranslation } from 'react-i18next';

/**
 * The pot an expense or a Barkelou went to, as a small badge.
 *
 * The Gamou and the projects counting in it share the Gamou colour; a project
 * standing apart from any Gamou keeps the neutral one.
 *
 * @param {object} props Component props.
 * @param {{project_name?: string|null, is_gamou?: boolean}} props.operation The expense or gift.
 * @returns {JSX.Element} The badge.
 */
export default function PotLabel({ operation }) {
  const { t } = useTranslation();
  const label = operation.project_name ?? t('pots.gamou');
  return (
    <span className={operation.is_gamou ? 'badge b-open' : 'badge b-draft'}>{label}</span>
  );
}
