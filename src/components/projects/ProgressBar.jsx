import { useTranslation } from 'react-i18next';

/**
 * Horizontal progress bar with its percentage.
 *
 * The bar fills up to its end, while the label keeps the real figure, so an
 * amount above the target reads as such, for instance 160 %.
 *
 * @param {object} props Component props.
 * @param {number|null} props.percent Completion, 100 meaning the target is reached, or null when unknown.
 * @param {string} [props.emptyLabel] Shown instead of the bar when there is no target.
 * @returns {JSX.Element} The bar.
 */
export default function ProgressBar({ percent, emptyLabel }) {
  const { t } = useTranslation();
  if (percent == null) {
    return <span className="progress-label">{emptyLabel}</span>;
  }
  return (
    <div className="progress">
      <div className="progress-track">
        <div
          className={percent >= 100 ? 'progress-fill done' : 'progress-fill'}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="progress-label">
        <bdi dir="ltr">{t('common.percent', { value: percent })}</bdi>
      </span>
    </div>
  );
}
