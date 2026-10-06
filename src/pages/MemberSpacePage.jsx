import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, HandCoins, Wallet } from 'lucide-react';

import ProgressBar from '../components/projects/ProgressBar';
import { EmptyState, ErrorNote, KpiCard, Loader, Money, PageHeader, StatusBadge } from '../components/ui';
import { rentalOrderStatusKey } from '../constants/labels';
import { KEYS } from '../constants/queryKeys';
import { ORDER_STATUS_TONES } from '../constants/rental';
import { extractErrorMessage } from '../services/apiClient';
import { fetchMyAccount, sharePercent } from '../services/member-account.service';
import { formatDate } from '../utils/format';

/**
 * Dated payments of one project, exercise or the donations, shown on demand.
 *
 * @param {object} props Component props.
 * @param {Array<{payment_date: string, amount: number, note: string|null}>} props.payments Payments.
 * @returns {JSX.Element} The list.
 */
function PaymentList({ payments }) {
  const { t } = useTranslation();
  if (payments.length === 0) {
    return <div className="stat-row lab">{t('memberSpace.noPayment')}</div>;
  }
  return payments.map((payment, index) => (
    <div className="stat-row" key={`${payment.payment_date}-${index}`}>
      <span className="lab">
        <span className="num">{formatDate(payment.payment_date)}</span>
        {payment.note && <span style={{ color: 'var(--faint)' }}> · {payment.note}</span>}
      </span>
      <Money value={payment.amount} />
    </div>
  ));
}

/**
 * A card that opens on its dated payments.
 *
 * @param {object} props Component props.
 * @param {React.ReactNode} props.header Always visible.
 * @param {Array<object>} props.payments Payments shown once opened.
 * @returns {JSX.Element} The card.
 */
function ExpandableCard({ header, payments }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      {header}
      <button
        type="button"
        className="link-btn"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10 }}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t(open ? 'memberSpace.hidePayments' : 'memberSpace.showPayments', {
          count: payments.length,
        })}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <PaymentList payments={payments} />
        </div>
      )}
    </div>
  );
}

/**
 * A member's own space: what they gave to each project, to each Gamou and as
 * donations, what the projects with a share still ask of them, and the
 * rentals they took as a customer with what their invoices still await.
 * Rentals are kept apart from the totals, since they pay for material and
 * are not gifts to the Dahira.
 *
 * Every figure comes from the member linked to the signed-in account; the
 * page never names a member itself.
 *
 * @returns {JSX.Element} The screen.
 */
export default function MemberSpacePage() {
  const { t } = useTranslation();
  const account = useQuery({ queryKey: [KEYS.myAccount], queryFn: fetchMyAccount });

  if (account.isLoading) return <Loader />;
  if (account.error) return <ErrorNote message={extractErrorMessage(account.error)} />;

  const data = account.data;
  const donationsTotal = data.donations.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeader
        title={t('memberSpace.title', { name: `${data.first_name} ${data.last_name}`.trim() })}
        subtitle={data.entity_name ?? t('memberSpace.noCategory')}
      />

      <div className="grid kpis" style={{ marginBottom: 22 }}>
        <KpiCard
          label={t('memberSpace.given')}
          value={data.given_total}
          accent
          icon={<HandCoins size={15} />}
          meta={t('memberSpace.givenMeta')}
        />
        <KpiCard
          label={t('memberSpace.remaining')}
          value={data.remaining_total}
          icon={<Wallet size={15} />}
          meta={t('memberSpace.remainingMeta')}
        />
      </div>

      <div className="section-title">
        <h2>{t('memberSpace.projects')}</h2>
        <div className="line" />
      </div>
      {data.projects.length === 0 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <EmptyState message={t('memberSpace.noProject')} />
        </div>
      )}
      {data.projects.map((project) => (
        <ExpandableCard
          key={project.project_id}
          payments={project.payments}
          header={
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600 }}>{project.name}</div>
                <StatusBadge
                  label={t(`memberSpace.projectStatus.${project.status}`)}
                  tone={project.status === 'OPEN' ? 'open' : 'closed'}
                />
              </div>
              <div style={{ margin: '10px 0' }}>
                <ProgressBar percent={sharePercent(project)} emptyLabel={t('memberSpace.noShare')} />
              </div>
              <div className="stat-row">
                <span className="lab">{t('memberSpace.paid')}</span>
                <Money value={project.paid} />
              </div>
              {project.share !== null && (
                <>
                  <div className="stat-row">
                    <span className="lab">{t('memberSpace.share')}</span>
                    <Money value={project.share} />
                  </div>
                  <div className="stat-row">
                    <span className="lab">{t('memberSpace.left')}</span>
                    <b>
                      <Money value={project.remaining} />
                    </b>
                  </div>
                </>
              )}
            </>
          }
        />
      ))}

      <div className="section-title" style={{ marginTop: 22 }}>
        <h2>{t('memberSpace.gamou')}</h2>
        <div className="line" />
      </div>
      {data.exercises.length === 0 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <EmptyState message={t('memberSpace.noContribution')} />
        </div>
      )}
      {data.exercises.map((exercise) => (
        <ExpandableCard
          key={exercise.exercise_id}
          payments={exercise.payments}
          header={
            <div className="stat-row" style={{ padding: 0 }}>
              <span style={{ fontWeight: 600 }}>{exercise.name}</span>
              <Money value={exercise.total} />
            </div>
          }
        />
      ))}

      {data.rentals.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 22 }}>
            <h2>{t('memberSpace.rentals')}</h2>
            <div className="line" />
          </div>
          {data.rental_balance > 0 && (
            <p style={{ color: 'var(--muted)', margin: '-6px 0 12px' }}>
              {t('memberSpace.rentalBalance')} : <Money value={data.rental_balance} />
            </p>
          )}
          {data.rentals.map((rental) => (
            <div className="card" style={{ padding: 16, marginBottom: 12 }} key={rental.order_number}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {rental.event_type} · <span className="num">{rental.order_number}</span>
                  </div>
                  <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(rental.start_date)} → {formatDate(rental.end_date)}
                  </div>
                </div>
                <StatusBadge
                  label={t(rentalOrderStatusKey(rental.status))}
                  tone={ORDER_STATUS_TONES[rental.status]}
                />
              </div>
              <div className="stat-row" style={{ marginTop: 8 }}>
                <span className="lab">
                  {rental.invoice_number
                    ? t('memberSpace.invoiced', { number: rental.invoice_number })
                    : t('memberSpace.notInvoiced')}
                </span>
                <Money value={rental.amount} />
              </div>
              {rental.balance !== null && (
                <>
                  <div className="stat-row">
                    <span className="lab">{t('memberSpace.paid')}</span>
                    <Money value={rental.paid} />
                  </div>
                  <div className="stat-row">
                    <span className="lab">{t('memberSpace.left')}</span>
                    <b>
                      <Money value={rental.balance} />
                    </b>
                  </div>
                </>
              )}
            </div>
          ))}
        </>
      )}

      {data.donations.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 22 }}>
            <h2>{t('memberSpace.donations')}</h2>
            <div className="line" />
          </div>
          <ExpandableCard
            payments={data.donations}
            header={
              <div className="stat-row" style={{ padding: 0 }}>
                <span style={{ fontWeight: 600 }}>{t('memberSpace.donationsTotal')}</span>
                <Money value={donationsTotal} />
              </div>
            }
          />
        </>
      )}
    </>
  );
}
