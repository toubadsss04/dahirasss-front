import { useTranslation } from 'react-i18next';

import { avatarColor, initials } from '../../utils/format';

/**
 * Display of a daara name.
 *
 * The only place in the code where a daara name is formatted. The name is
 * rendered exactly as it was entered at creation, with no prefix added, so a
 * daara called Keur Massar reads as Keur Massar and nothing else. A member
 * without a category reads as such rather than as a blank.
 *
 * @param {object} props Component props.
 * @param {string} props.name Name entered at creation.
 * @param {boolean} [props.withMark] Show the coloured initial beside the name.
 * @param {string} [props.subtitle] Secondary line, typically the description.
 * @returns {JSX.Element} The label.
 */
export default function DaaraLabel({ name, withMark = false, subtitle }) {
  const { t } = useTranslation();
  const label = name || t('common.empty.noCategory');

  if (!withMark) {
    return <span className="chip">{label}</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background: avatarColor(label),
          flex: '0 0 auto',
        }}
      >
        {initials(label)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
