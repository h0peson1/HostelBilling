import { UAParser } from 'ua-parser-js';

/**
 * Parses user-agent header to construct a clean human-readable device name:
 * e.g., 'Apple iPhone', 'Samsung Galaxy', 'Windows PC', 'Apple Mac', etc.
 */
export function parseDeviceFromUserAgent(uaString?: string | null): string {
  if (!uaString || typeof uaString !== 'string') {
    return 'Personal Device';
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  const vendor = result.device.vendor?.trim();
  const model = result.device.model?.trim();
  const osName = result.os.name?.trim();

  // 1. Apple Devices (iPhone, iPad, Mac)
  if (vendor?.toLowerCase() === 'apple' || osName?.toLowerCase() === 'ios') {
    if (model) {
      if (model.toLowerCase().startsWith('iphone')) return 'Apple iPhone';
      if (model.toLowerCase().startsWith('ipad')) return 'Apple iPad';
      return `Apple ${model}`;
    }
    return 'Apple iPhone';
  }

  if (osName?.toLowerCase() === 'macos' || model?.toLowerCase() === 'macintosh') {
    return 'Apple Mac';
  }

  // 2. Samsung Devices
  if (vendor?.toLowerCase() === 'samsung') {
    if (model) {
      if (model.toLowerCase().includes('galaxy')) {
        return `Samsung ${model}`;
      }
      return 'Samsung Galaxy';
    }
    return 'Samsung Galaxy';
  }

  // 3. Other known mobile/tablet vendors
  if (vendor && model) {
    if (model.toLowerCase().startsWith(vendor.toLowerCase())) {
      return model;
    }
    return `${vendor} ${model}`;
  }

  // 4. Desktop Operating Systems
  if (osName) {
    const lowerOS = osName.toLowerCase();
    if (lowerOS.includes('windows')) {
      return 'Windows PC';
    }
    if (lowerOS.includes('mac')) {
      return 'Apple Mac';
    }
    if (lowerOS.includes('linux') || lowerOS.includes('ubuntu') || lowerOS.includes('debian') || lowerOS.includes('fedora')) {
      return 'Linux PC';
    }
    if (lowerOS.includes('android')) {
      return vendor ? `${vendor} Android` : 'Android Device';
    }
    if (lowerOS.includes('chrome os') || lowerOS.includes('chromium')) {
      return 'Chromebook';
    }
    return `${osName} Device`;
  }

  // 5. Fallback to browser or generic device
  if (result.browser.name) {
    return `${result.browser.name} Device`;
  }

  return 'Personal Device';
}

/**
 * Resolves the final device name by checking:
 * 1. Explicitly provided hostname or device_name from request body or query params.
 * 2. If valid and not a placeholder, uses that hostname.
 * 3. Otherwise, falls back to the parsed User-Agent string.
 */
export function resolveDeviceName(
  providedName: string | null | undefined,
  userAgentHeader: string | null | undefined
): string {
  if (providedName && typeof providedName === 'string') {
    const trimmed = providedName.trim();
    const lower = trimmed.toLowerCase();
    const isInvalidPlaceholder =
      trimmed.length === 0 ||
      lower === 'unknown' ||
      lower === 'null' ||
      lower === 'undefined' ||
      lower === 'personal device' ||
      lower === 'device';

    if (!isInvalidPlaceholder) {
      return trimmed;
    }
  }

  return parseDeviceFromUserAgent(userAgentHeader);
}
