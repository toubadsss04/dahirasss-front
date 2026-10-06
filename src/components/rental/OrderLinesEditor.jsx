import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Plus, Trash2, Truck } from 'lucide-react';

import AppSelect from '../forms/AppSelect';
import { Money } from '../ui';
import { pricingModeKey, serviceTypeKey } from '../../constants/labels';
import { LINE_KINDS, PRICING_MODES, SERVICE_TYPES } from '../../constants/rental';
import {
  emptyOrderLine,
  emptyServiceLine,
  lineMode,
  priceLine,
} from '../../services/rental.service';

/**
 * The lines of an order being written, with the amount of each line and what
 * is free over the period.
 *
 * An article line picks its article and may price it per day or per event
 * for this order; a price left empty takes the article's reference price, and
 * an article priced case by case asks for one. A service line, such as
 * transport, is a single cost: no quantity, no discount, no stock, only its
 * kind, a wording given room to describe it, and its price.
 *
 * @param {object} props Component props.
 * @param {Array<object>} props.lines Line states.
 * @param {(lines: Array<object>) => void} props.onChange Called with the new lines.
 * @param {Array<object>} props.articles Article options, with what is free over the period.
 * @param {number} props.days Length of the rental, for daily prices.
 * @returns {JSX.Element} The editor.
 */
export default function OrderLinesEditor({ lines, onChange, articles, days }) {
  const { t } = useTranslation();
  const byId = new Map(articles.map((article) => [article.id, article]));
  const update = (index, changes) =>
    onChange(lines.map((line, position) => (position === index ? { ...line, ...changes } : line)));
  const remove = (index) => onChange(lines.filter((_, position) => position !== index));
  const options = articles.map((article) => ({
    value: article.id,
    label: article.reference ? `${article.name} · ${article.reference}` : article.name,
  }));
  const modeOptions = Object.values(PRICING_MODES).map((mode) => ({
    value: mode,
    label: t(pricingModeKey(mode)),
  }));
  const serviceOptions = Object.values(SERVICE_TYPES).map((type) => ({
    value: type,
    label: t(serviceTypeKey(type)),
  }));

  return (
    <div className="card" style={{ padding: '4px 16px 12px' }}>
      {lines.map((line, index) => {
        const isService = line.kind === LINE_KINDS.SERVICE;
        const article = isService ? null : byId.get(line.articleId);
        const mode = lineMode(line, article);
        const price = line.unitPrice !== '' ? line.unitPrice : (article?.price ?? '');
        const amounts =
          isService || article
            ? priceLine(
                isService
                  ? { ...line, quantity: 1, discount: '', unitPrice: price || 0 }
                  : { ...line, unitPrice: price || 0 },
                mode,
                days,
              )
            : null;
        const requested = Number(line.quantity || 0);
        const short = article && article.free !== null && requested > article.free;

        return (
          <div className={isService ? 'order-line service' : 'order-line'} key={index}>
            {isService ? (
              <div className="line-main">
                <AppSelect
                  label={t('rental.orders.service')}
                  value={line.serviceType}
                  onChange={(value) => update(index, { serviceType: value })}
                  options={serviceOptions}
                  fullWidth
                />
                <TextField
                  label={t('rental.orders.serviceLabel')}
                  value={line.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  size="small"
                  required={line.serviceType === SERVICE_TYPES.OTHER}
                  placeholder={
                    line.serviceType === SERVICE_TYPES.TRANSPORT
                      ? t('rental.orders.transportHint')
                      : undefined
                  }
                  inputProps={{ maxLength: 150 }}
                />
              </div>
            ) : (
              <div className="line-main">
                <AppSelect
                  label={t('rental.columns.article')}
                  value={line.articleId}
                  onChange={(value) => update(index, { articleId: value, unitPrice: '', pricingMode: '' })}
                  options={options}
                  fullWidth
                />
                <AppSelect
                  label={t('rental.orders.pricing')}
                  value={mode}
                  onChange={(value) =>
                    update(index, { pricingMode: value === article?.pricing_mode ? '' : value })
                  }
                  options={modeOptions}
                  disabled={!article}
                  fullWidth
                />
              </div>
            )}
            {!isService && (
              <TextField
                label={t('rental.columns.quantity')}
                value={line.quantity}
                onChange={(event) => update(index, { quantity: event.target.value })}
                size="small"
                type="number"
                inputProps={{ min: 1, step: 1 }}
              />
            )}
            <TextField
              label={isService ? t('rental.orders.serviceCost') : t('rental.columns.unitPrice')}
              value={line.unitPrice}
              onChange={(event) => update(index, { unitPrice: event.target.value })}
              placeholder={
                article?.price !== null && article?.price !== undefined ? String(article.price) : ''
              }
              size="small"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              InputLabelProps={{ shrink: true }}
              error={
                (isService && line.unitPrice === '') ||
                (Boolean(article) && article.price === null && line.unitPrice === '')
              }
            />
            {!isService && (
              <TextField
                label={t('rental.columns.discount')}
                value={line.discount}
                onChange={(event) => update(index, { discount: event.target.value })}
                size="small"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.5 }}
              />
            )}
            <Tooltip title={t('rental.orders.removeLine')}>
              <span>
                <IconButton
                  onClick={() => remove(index)}
                  disabled={lines.length === 1}
                  aria-label={t('rental.orders.removeLine')}
                >
                  <Trash2 size={16} />
                </IconButton>
              </span>
            </Tooltip>
            {(article || isService) && (
              <div className="meta">
                {article && (
                  <span>
                    {article.unit_name} ·{' '}
                    {mode === PRICING_MODES.PER_DAY
                      ? t('rental.orders.perDayFor', { count: Math.max(days, 1) })
                      : t(pricingModeKey(mode))}
                  </span>
                )}
                {isService && <span>{t('rental.orders.serviceMeta')}</span>}
                {article && article.free !== null && (
                  <span style={short ? { color: 'var(--neg)', fontWeight: 600 } : undefined}>
                    {t('rental.orders.freeForPeriod', { count: article.free })}
                  </span>
                )}
                {article && article.price === null && line.unitPrice === '' && (
                  <span>{t('rental.orders.priceRequired')}</span>
                )}
                {isService && line.unitPrice === '' && (
                  <span>{t('rental.orders.servicePriceRequired')}</span>
                )}
                {amounts && (
                  <span>
                    {t('rental.columns.amount')} : <Money value={amounts.net} />
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <Button
          size="small"
          startIcon={<Plus size={15} />}
          onClick={() => onChange([...lines, emptyOrderLine()])}
        >
          {t('rental.orders.addLine')}
        </Button>
        <Button
          size="small"
          startIcon={<Truck size={15} />}
          onClick={() => onChange([...lines, emptyServiceLine()])}
        >
          {t('rental.orders.addService')}
        </Button>
      </div>
    </div>
  );
}
