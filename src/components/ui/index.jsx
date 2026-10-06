import { useTranslation } from 'react-i18next';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { Inbox, Info, TriangleAlert } from 'lucide-react';

import { formatMoney } from '../../utils/format';

/**
 * Page title, subtitle and action buttons.
 *
 * @param {object} props Component props.
 * @param {string} props.title Page name.
 * @param {string} [props.subtitle] Short explanation under the title.
 * @param {React.ReactNode} [props.actions] Buttons aligned to the right.
 * @returns {JSX.Element} The header.
 */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

/**
 * Amount rendered in CFA francs with tabular figures.
 *
 * @param {object} props Component props.
 * @param {number} props.value Whole francs.
 * @param {boolean} [props.signed] Show a plus sign on positive amounts.
 * @param {boolean} [props.tone] Colour the amount by sign.
 * @param {boolean} [props.strike] Strike through, used for cancelled rows.
 * @returns {JSX.Element} The amount.
 */
export function Money({ value, signed = false, tone = false, strike = false }) {
  const className = ['money', tone && value < 0 ? 'neg' : '', tone && value > 0 ? 'pos' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={className}
      style={strike ? { textDecoration: 'line-through', opacity: 0.55 } : undefined}
    >
      {formatMoney(value, { signed })}
    </span>
  );
}

/**
 * Coloured status pill.
 *
 * @param {object} props Component props.
 * @param {string} props.label Text to show.
 * @param {'open'|'closed'|'draft'|'active'|'inactive'|'cancel'} props.tone Visual tone.
 * @returns {JSX.Element} The badge.
 */
export function StatusBadge({ label, tone }) {
  const classes = {
    open: 'b-open',
    active: 'b-active',
    closed: 'b-closed',
    draft: 'b-draft',
    inactive: 'b-inactive',
    cancel: 'b-cancel',
  };
  return <span className={`badge ${classes[tone] ?? 'b-draft'} dot`}>{label}</span>;
}

/**
 * Indicator tile used on the dashboard.
 *
 * @param {object} props Component props.
 * @param {string} props.label Indicator name.
 * @param {number} props.value Amount in francs.
 * @param {React.ReactNode} [props.icon] Leading icon.
 * @param {string} [props.meta] Secondary line under the value.
 * @param {boolean} [props.accent] Render as the highlighted tile.
 * @returns {JSX.Element} The tile.
 */
export function KpiCard({ label, value, icon, meta, accent = false }) {
  return (
    <div className={accent ? 'card kpi accent' : 'card kpi'}>
      <div className="k-top">
        {icon && <span className="k-ic">{icon}</span>} {label}
      </div>
      <div className="k-val num">
        {/* The figure and its currency are one unit and read left to right,
            whatever the language around them. Isolating the pair keeps the F
            after the number instead of letting it drift in front. */}
        <bdi dir="ltr">
          {formatMoney(value, { withCurrency: false })}
          <span className="cur">F</span>
        </bdi>
      </div>
      {meta && <div className="k-meta">{meta}</div>}
    </div>
  );
}

/**
 * Filter row placed above a table.
 *
 * @param {object} props Component props.
 * @param {React.ReactNode} props.children Filter controls.
 * @returns {JSX.Element} The filter bar.
 */
export function FilterBar({ children }) {
  return <div className="filters">{children}</div>;
}

/**
 * Placeholder shown when a listing has nothing to display.
 *
 * @param {object} props Component props.
 * @param {string} props.message What is missing and why.
 * @returns {JSX.Element} The placeholder.
 */
export function EmptyState({ message }) {
  return (
    <div className="empty-note">
      <Inbox size={24} style={{ opacity: 0.45 }} />
      <div style={{ marginTop: 10 }}>{message}</div>
    </div>
  );
}

/**
 * Centred spinner used while a screen loads.
 *
 * @returns {JSX.Element} The spinner.
 */
export function Loader() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
      <CircularProgress size={24} />
    </div>
  );
}

/**
 * Inline error message.
 *
 * @param {object} props Component props.
 * @param {string} props.message What went wrong.
 * @returns {JSX.Element} The message.
 */
export function ErrorNote({ message }) {
  return (
    <div className="callout" style={{ borderColor: 'var(--neg)' }}>
      <span className="ic" style={{ color: 'var(--neg)' }}>
        <TriangleAlert size={20} />
      </span>
      <span className="tx">{message}</span>
    </div>
  );
}

/**
 * Explanatory note, used to carry a business rule into the screen.
 *
 * Spacing is left to the stylesheet, since the note sits above content on
 * some screens and closes a card on others.
 *
 * @param {object} props Component props.
 * @param {React.ReactNode} props.children Note content.
 * @param {boolean} [props.warn] Use the warning tone.
 * @returns {JSX.Element} The note.
 */
export function Callout({ children, warn = false }) {
  return (
    <div className={warn ? 'callout warn' : 'callout'}>
      <span className="ic">
        <TriangleAlert size={20} />
      </span>
      <span className="tx">{children}</span>
    </div>
  );
}

/**
 * Table wrapper that scrolls horizontally on narrow screens.
 *
 * The page body never scrolls sideways, only the table inside its own box.
 * With maxHeight the body also scrolls vertically under a sticky header, so a
 * list that grows over time keeps the rest of the page in reach.
 *
 * @param {object} props Component props.
 * @param {Array<{key: string, label: string, align?: string, hint?: string}>} props.columns
 *   Column definitions. A hint shows as a tooltip on an info icon next to the label.
 * @param {Array<object>} props.rows Data rows.
 * @param {(row: object) => React.ReactNode} props.renderRow Row renderer.
 * @param {string} [props.emptyMessage] Shown when there is no row.
 * @param {React.ReactNode} [props.footer] Optional footer row.
 * @param {number} [props.maxHeight] Height in pixels past which the body scrolls.
 * @returns {JSX.Element} The table.
 */
export function DataTable({ columns, rows, renderRow, emptyMessage, footer, maxHeight }) {
  const { t } = useTranslation();
  if (!rows || rows.length === 0) {
    return (
      <div className="card">
        <EmptyState message={emptyMessage || t('common.empty.table')} />
      </div>
    );
  }

  return (
    <div className="card">
      <div
        className={maxHeight ? 'tbl-wrap tbl-scroll' : 'tbl-wrap'}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.align === 'right' ? 'r' : undefined}>
                  {column.hint ? (
                    <Tooltip title={column.hint} arrow>
                      <span className="th-hint" tabIndex={0} aria-label={column.hint}>
                        {column.label}
                        <Info size={12} aria-hidden="true" />
                      </span>
                    </Tooltip>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
          {footer}
        </table>
      </div>
    </div>
  );
}
