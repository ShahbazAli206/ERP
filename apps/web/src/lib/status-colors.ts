/**
 * Fixed status palette (good / warning / serious / critical) — validated via
 * the dataviz color methodology, distinct from the categorical chart
 * palette so a status color never impersonates a data series. Defined once
 * as CSS variables in `globals.css` (`--status-*`, same steps in light and
 * dark) and referenced here so every module uses the same four colors for
 * "this row needs attention" states (e.g. Inventory low-stock, Finance
 * overdue receivables, Tax compliance flags) instead of inventing ad hoc
 * red/yellow/green per module.
 *
 * IMPORTANT: never rely on color alone — always pair with an icon and/or
 * text label (e.g. a `Badge` with both an icon and a text child), since two
 * of the four steps intentionally dip below 3:1 contrast on a light
 * surface.
 */
export type StatusTone = 'good' | 'warning' | 'serious' | 'critical';

export const STATUS_COLOR_VAR: Record<StatusTone, string> = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
};
