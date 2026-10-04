import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Previous and next controls for an offset paginated listing.
 *
 * Renders nothing when everything fits on one page.
 *
 * @param {object} props Component props.
 * @param {number} props.total How many rows match in all.
 * @param {number} props.offset Index of the first row shown.
 * @param {number} props.limit Rows per page.
 * @param {(offset: number) => void} props.onChange Called with the new offset.
 * @returns {JSX.Element|null} The pager.
 */
export default function Pager({ total, offset, limit, onChange }) {
  const { t } = useTranslation();
  if (total <= limit) return null;

  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="pager">
      <span>{t('common.pager.range', { from, to, total })}</span>
      <Button
        size="small"
        color="inherit"
        startIcon={<ChevronLeft size={15} className="flip-rtl" />}
        disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        {t('common.pager.previous')}
      </Button>
      <Button
        size="small"
        color="inherit"
        endIcon={<ChevronRight size={15} className="flip-rtl" />}
        disabled={to >= total}
        onClick={() => onChange(offset + limit)}
      >
        {t('common.pager.next')}
      </Button>
    </div>
  );
}
