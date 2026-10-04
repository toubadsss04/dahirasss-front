import { useTranslation } from 'react-i18next';

import { Money } from './index';
import { avatarColor, initials } from '../../utils/format';

/**
 * Card of one category on the categories screen: its members and what they
 * gave during the selected exercise.
 *
 * Used for every category and for the members who belong to none, which is
 * why the badge and the actions are passed in rather than built here.
 *
 * @param {object} props Component props.
 * @param {string} props.name Name shown on the card.
 * @param {string} [props.description] Secondary line under the name.
 * @param {React.ReactNode} [props.badge] Status shown beside the name.
 * @param {number} props.membersCount Active members.
 * @param {{total_contributions?: number, total_project_payments?: number, balance?: number}} [props.stats]
 *   Figures of the exercise, absent when no exercise is selected.
 * @param {React.ReactNode} [props.actions] Buttons shown under the figures.
 * @returns {JSX.Element} The card.
 */
export default function CategoryCard({ name, description, badge, membersCount, stats, actions }) {
  const { t } = useTranslation();

  return (
    <div className="card ent">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--serif)',
            fontSize: 19,
            fontWeight: 600,
            color: '#fff',
            background: avatarColor(name),
            flex: '0 0 auto',
          }}
        >
          {initials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16.5 }}>{name}</h3>
          {description && (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--muted)',
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {description}
            </div>
          )}
        </div>
        {badge}
      </div>

      <div className="e-stats">
        <div>
          <div className="s-l">{t('daaras.stats.members')}</div>
          <div className="s-v">{membersCount}</div>
        </div>
        <div>
          <div className="s-l">{t('daaras.stats.projects')}</div>
          <div className="s-v pos">
            <Money value={stats?.total_project_payments ?? 0} />
          </div>
        </div>
        <div>
          <div className="s-l">{t('daaras.stats.collected')}</div>
          <div className="s-v pos">
            <Money value={stats?.total_contributions ?? 0} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--faint)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            {t('daaras.stats.balance')}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600 }}>
            <Money value={stats?.balance ?? 0} />
          </div>
        </div>
      </div>

      {actions && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderTop: '1px solid var(--line-soft)',
            paddingTop: 12,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
