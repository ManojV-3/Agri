export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    voiceCode: 'en-IN',
    locale: 'en-IN'
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    voiceCode: 'kn-IN',
    locale: 'kn-IN'
  }
];

export const DEFAULT_LANGUAGE = 'en';

/**
 * Reads a localized property from an object { en: '...', kn: '...' }
 * Falls back to English if the requested language is missing.
 */
export function getLocalized(obj, lang = 'en') {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
}

/**
 * Format currency in Indian Rupees using Intl
 */
export function formatCurrency(amount, lang = 'en') {
  const locale = lang === 'kn' ? 'kn-IN' : 'en-IN';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₹${Math.round(amount)}`;
  }
}

/**
 * Format localized numbers
 */
export function formatNumber(val, lang = 'en') {
  const locale = lang === 'kn' ? 'kn-IN' : 'en-IN';
  try {
    return new Intl.NumberFormat(locale).format(val);
  } catch {
    return String(val);
  }
}

/**
 * Format localized dates
 */
export function formatDate(timestamp, lang = 'en') {
  const locale = lang === 'kn' ? 'kn-IN' : 'en-IN';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}
