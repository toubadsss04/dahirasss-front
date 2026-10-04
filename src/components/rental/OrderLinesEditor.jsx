import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Plus, Trash2 } from 'lucide-react';

import AppSelect from '../forms/AppSelect';
import { Money } from '../ui';
import { pricingModeKey } from '../../constants/labels';
import { emptyOrderLine, priceLine } from '../../services/rental.service';

/**
 * The lines of an order being written: article, quantity, unit price and
 * discount, with the amount of each line and what is free over the period.
 *
 * A price left empty takes the article's reference price. An article priced
 * case by case asks for one.
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

  return (
    <div className="card" style={{ padding: '4px 16px 12px' }}>
      {lines.map((line, index) => {
        const article = byId.get(line.articleId);
        const price = line.unitPrice !== '' ? line.unitPrice : article?.price ?? '';
        const amounts = article ? priceLine({ ...line, unitPrice: price }, article.pricing_mode, days) : null;
        const requested = Number(line.quantity || 0);
        const short = article && article.free !== null && requested > article.free;

        return (
          <div className="order-line" key={index}>
            <AppSelect
              label={t('rental.columns.article')}
              value={line.articleId}
              onChange={(value) => update(index, { articleId: value, unitPrice: '' })}
              options={options}
              fullWidth
            />
            <TextField
              label={t('rental.columns.quantity')}
              value={line.quantity}
              onChange={(event) => update(index, { quantity: event.target.value })}
              size="small"
              type="number"
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label={t('rental.columns.unitPrice')}
              value={line.unitPrice}
              onChange={(event) => update(index, { unitPrice: event.target.value })}
              placeholder={article?.price !== null && article?.price !== undefined ? String(article.price) : ''}
              size="small"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              InputLabelProps={{ shrink: true }}
              error={Boolean(article) && article.price === null && line.unitPrice === ''}
            />
            <TextField
              label={t('rental.columns.discount')}
              value={line.discount}
              onChange={(event) => update(index, { discount: event.target.value })}
              size="small"
              type="number"
              inputProps={{ min: 0, max: 100, step: 0.5 }}
            />
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
            {article && (
              <div className="meta">
                <span>
                  {article.unit_name} · {t(pricingModeKey(article.pricing_mode))}
                </span>
                {article.free !== null && (
                  <span style={short ? { color: 'var(--neg)', fontWeight: 600 } : undefined}>
                    {t('rental.orders.freeForPeriod', { count: article.free })}
                  </span>
                )}
                {article.price === null && line.unitPrice === '' && (
                  <span>{t('rental.orders.priceRequired')}</span>
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
      <Button
        size="small"
        startIcon={<Plus size={15} />}
        onClick={() => onChange([...lines, emptyOrderLine()])}
        sx={{ mt: 1 }}
      >
        {t('rental.orders.addLine')}
      </Button>
    </div>
  );
}
