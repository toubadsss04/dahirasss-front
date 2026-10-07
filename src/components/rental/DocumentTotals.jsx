import { useTranslation } from 'react-i18next';

import { Money } from '../ui';

/**
 * Totals of an order or an invoice: before discount, discounts, amount due,
 * and for an invoice what was paid and what remains.
 *
 * Fees added after the invoice was issued show between the rental and the
 * amount due, which then covers both.
 *
 * @param {object} props Component props.
 * @param {number} props.gross Total before discount.
 * @param {number} props.discount All discounts.
 * @param {number} props.net Amount due for the rental.
 * @param {number} [props.charges] Active fees on top of the rental, for an invoice.
 * @param {number} [props.paid] Paid so far, for an invoice.
 * @param {number} [props.balance] Still due, for an invoice.
 * @returns {JSX.Element} The totals block.
 */
export default function DocumentTotals({ gross, discount, net, charges = 0, paid, balance }) {
  const { t } = useTranslation();
  const withPayments = paid !== undefined && balance !== undefined;

  return (
    <div className="card recap">
      <div className="r-row">
        <span className="l">{t('rental.totals.gross')}</span>
        <Money value={gross} />
      </div>
      {discount > 0 && (
        <div className="r-row">
          <span className="l">{t('rental.totals.discount')}</span>
          <Money value={-discount} />
        </div>
      )}
      {charges > 0 && (
        <>
          <div className="r-row">
            <span className="l">{t('rental.totals.rental')}</span>
            <Money value={net} />
          </div>
          <div className="r-row">
            <span className="l">{t('rental.totals.charges')}</span>
            <Money value={charges} />
          </div>
        </>
      )}
      <div className="r-row grand">
        <span className="l">{t('rental.totals.net')}</span>
        <Money value={net + charges} />
      </div>
      {withPayments && (
        <>
          <div className="r-row">
            <span className="l">{t('rental.totals.paid')}</span>
            <Money value={paid} />
          </div>
          <div className="r-row tot">
            <span className="l">{t('rental.totals.balance')}</span>
            <Money value={balance} />
          </div>
        </>
      )}
    </div>
  );
}
