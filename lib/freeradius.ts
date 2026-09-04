/**
 * FreeRADIUS & Network Controller Utilities
 * Handles MAC address normalization, format checking, and MikroTik / RADIUS rate limits.
 */

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

/**
 * Validates whether a string matches standard hardware MAC address formats
 * (e.g. "E4:5F:01:BC:88:21" or "E4-5F-01-BC-88-21").
 */
export function isValidMacAddress(mac: string): boolean {
  if (!mac || typeof mac !== 'string') return false;
  return MAC_REGEX.test(mac.trim());
}

/**
 * Normalizes any MAC address to standard uppercase colon-separated format
 * (e.g., "e4-5f-01-bc-88-21" -> "E4:5F:01:BC:88:21").
 */
export function normalizeMacAddress(mac: string): string {
  if (!mac) return '';
  return mac
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, '')
    .match(/.{1,2}/g)
    ?.join(':') || mac.toUpperCase();
}

/**
 * Formats upload and download speeds into standard MikroTik-Rate-Limit string format:
 * "<UploadSpeed>M/<DownloadSpeed>M" (e.g. "30M/100M").
 */
export function formatMikrotikRateLimit(uploadMbps: number, downloadMbps: number): string {
  const up = Math.max(1, Math.round(uploadMbps));
  const down = Math.max(1, Math.round(downloadMbps));
  return `${up}M/${down}M`;
}

/**
 * Converts seconds remaining into a clean human-readable countdown string
 * (e.g. "5 Days, 14 Hours Remaining").
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} Day${days > 1 ? 's' : ''}, ${hours} Hour${hours > 1 ? 's' : ''} Remaining`;
  }
  if (hours > 0) {
    return `${hours} Hour${hours > 1 ? 's' : ''}, ${minutes} Minute${minutes > 1 ? 's' : ''} Remaining`;
  }
  return `${minutes} Minute${minutes > 1 ? 's' : ''} Remaining`;
}

/**
 * Formats byte counts into human-readable Gigabyte / Megabyte notation.
 */
export function formatDataUsage(bytes: number): { gb: number; formatted: string } {
  const gb = parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
  if (gb >= 1) {
    return { gb, formatted: `${gb} GB` };
  }
  const mb = parseFloat((bytes / (1024 * 1024)).toFixed(1));
  return { gb, formatted: `${mb} MB` };
}
