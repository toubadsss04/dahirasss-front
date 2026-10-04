import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';

import { FilterBar } from '../ui';

/**
 * Choice of a period, by its first and last day.
 *
 * @param {object} props Component props.
 * @param {string} props.dateFrom First day, YYYY-MM-DD.
 * @param {string} props.dateTo Last day, YYYY-MM-DD.
 * @param {(period: {dateFrom: string, dateTo: string}) => void} props.onChange Called with the new period.
 * @returns {JSX.Element} The filter.
 */
export default function PeriodFilter({ dateFrom, dateTo, onChange }) {
  const { t } = useTranslation();

  return (
    <FilterBar>
      <TextField
        label={t('rental.period.from')}
        type="date"
        value={dateFrom}
        onChange={(event) => onChange({ dateFrom: event.target.value, dateTo })}
        size="small"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={t('rental.period.to')}
        type="date"
        value={dateTo}
        onChange={(event) => onChange({ dateFrom, dateTo: event.target.value })}
        size="small"
        InputLabelProps={{ shrink: true }}
      />
    </FilterBar>
  );
}
