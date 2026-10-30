import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------ formatting */

const Naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const NairaPrecise = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNaira(amount: number | null | undefined, precise = false): string {
  if (amount == null || Number.isNaN(amount)) {
    return precise ? NairaPrecise.format(0) : Naira.format(0);
  }
  return precise ? NairaPrecise.format(amount) : Naira.format(amount);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('en-NG').format(value);
}

/** '22 Oct 2026, 09:15' - compact but unambiguous for clinical tables. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** '3 days ago' / 'in 2 hours' - used by notifications and expiry monitors. */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const deltaMs = date.getTime() - Date.now();
  const abs = Math.abs(deltaMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(deltaMs / ms), unit);
  }
  return rtf.format(Math.round(deltaMs / 1000), 'second');
}

/** Age in years from a date of birth. */
export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? '').trim().charAt(0);
  const b = (last ?? '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || 'Unnamed';
}

/** Body mass index from height (cm) and weight (kg). */
export function calculateBmi(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/** Split a full name into its two halves - the API stores them separately. */
export function splitName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!name) return { firstName: '', lastName: '' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/* ------------------------------------------------------------ phone normalization */

/**
 * Normalize a Nigerian phone number for storage/transmission.
 * Accepts formats: 08031234567, 2348031234567, +2348031234567, 0803-123-4567, etc.
 * Returns: 2348031234567 (E.164 without +) or empty string if invalid.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Strip spaces, dashes, parentheses, and leading +
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  // Handle leading 0 (local format) -> convert to 234
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '234' + cleaned.slice(1);
  }
  // Handle leading 234 (international without +)
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return cleaned;
  }
  // Handle leading +234 (already handled by cleaning)
  // If it's already a valid length, return as-is
  if ((cleaned.startsWith('234') && cleaned.length === 13) || (cleaned.startsWith('0') && cleaned.length === 11)) {
    return cleaned.startsWith('0') ? '234' + cleaned.slice(1) : cleaned;
  }
  // Return cleaned but mark as potentially invalid (caller should validate)
  return cleaned;
}

/**
 * Validate a Nigerian phone number.
 * Returns true if the number appears to be a valid Nigerian mobile number.
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Must be 13 digits starting with 234, followed by valid network prefixes
  if (!/^234[789][01]\d{8}$/.test(normalized)) return false;
  return true;
}

/**
 * Format a normalized phone number for display (e.g., 0803 123 4567).
 * Expects a normalized number (234XXXXXXXXXX) or local format (0XXXXXXXXXX).
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (normalized.length === 13 && normalized.startsWith('234')) {
    const local = '0' + normalized.slice(3);
    return local.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  if (normalized.length === 11 && normalized.startsWith('0')) {
    return normalized.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  // Fallback: return as-is if we can't format
  return phone;
}

/**
 * Get placeholder/hint text for phone inputs.
 */
export const PHONE_PLACEHOLDER = 'e.g. 08031234567';

/* ------------------------------------------------------------ clinical utilities */

/** Common allergy suggestions for the multi-select input. */
export const ALLERGY_SUGGESTIONS = [
  'Penicillin',
  'Sulfonamides',
  'Aspirin',
  'Ibuprofen',
  'Tramadol',
  'Codeine',
  'Latex',
  'Peanuts',
  'Eggs',
  'Shellfish',
] as const;

/** Next of kin relationship options. */
export const KIN_RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Other',
] as const;

/** Blood group options with Unknown. */
export const BLOOD_GROUPS = [
  'Unknown',
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
] as const;

/** Genotype options with Unknown. */
export const GENOTYPES = [
  'Unknown',
  'AA',
  'AS',
  'SS',
  'AC',
] as const;

/* ------------------------------------------------------------ allergies utilities */

/**
 * Convert an array of allergy strings to a comma-separated string for API payload.
 * Returns empty string if the array is empty/undefined.
 * Deduplicates and trims each item.
 */
export function allergiesToApi(list: string[] | undefined | null): string {
  if (!list || list.length === 0) return '';
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of list) {
    const trimmed = item.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      cleaned.push(trimmed);
    }
  }
  return cleaned.join(', ');
}

/**
 * Parse allergies from API response into a string array.
 * Handles comma-separated strings, semicolon-separated, arrays, null, undefined.
 * Returns empty array if no valid allergies found.
 */
export function allergiesFromApi(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((s) => s?.trim())
      .filter((s): s is string => Boolean(s && s.trim()));
  }
  // String: split on comma or semicolon
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
