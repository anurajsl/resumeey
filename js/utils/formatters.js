/* Formatters */

/**
 * Format date range for display
 */
export function formatDateRange(start, end, isCurrent = false) {
  if (!start) return '';
  const s = formatMonthYear(start);
  const e = isCurrent ? 'Present' : (end ? formatMonthYear(end) : 'Present');
  return `${s} – ${e}`;
}

export function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + '-01');
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format relative time
 */
export function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format score as color class
 */
export function scoreColorClass(score) {
  if (score >= 80) return 'score-great';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-ok';
  return 'score-poor';
}

export function scoreBgClass(score) {
  if (score >= 80) return 'score-bg-great';
  if (score >= 60) return 'score-bg-good';
  if (score >= 40) return 'score-bg-ok';
  return 'score-bg-poor';
}

export function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Title case
 */
export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Truncate string
 */
export function truncate(str, maxLen = 100, ellipsis = '…') {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + ellipsis;
}

/**
 * Pluralize
 */
export function pluralize(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

/**
 * Format years of experience
 */
export function formatYears(years) {
  if (!years || years === 0) return 'No experience';
  if (years < 1) return 'Less than 1 year';
  if (years === 1) return '1 year';
  return `${years} years`;
}

/**
 * Percentage display
 */
export function percent(value, decimals = 0) {
  return `${Math.round(value * 10 ** decimals) / 10 ** decimals}%`;
}

/**
 * Generate a short unique ID
 */
export function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Strip HTML tags
 */
export function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(str) {
  return str?.replace(/\s+/g, ' ').trim() ?? '';
}
