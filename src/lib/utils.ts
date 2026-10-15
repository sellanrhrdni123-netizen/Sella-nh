import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah (IDR)
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp0';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

/**
 * Days and Months in Indonesian
 */
const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format ISO or Date into WIB (Asia/Jakarta) Indonesian format
 * Example: "Selasa, 13 Oktober 2026"
 */
export function formatWIBDate(dateInput: string | Date = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Adjust to WIB (UTC+7)
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (3600000 * 7));

  const dayName = HARI_INDONESIA[wibDate.getDay()];
  const dayNum = wibDate.getDate();
  const monthName = BULAN_INDONESIA[wibDate.getMonth()];
  const year = wibDate.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Format WIB time string
 * Example: "14:35 WIB"
 */
export function formatWIBTime(dateInput: string | Date = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (3600000 * 7));

  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes} WIB`;
}

/**
 * Full WIB formatted timestamp for Telegram bot replies
 * Example: "Selasa, 13 Oktober 2026 — 14:35 WIB"
 */
export function formatTelegramWIBTimestamp(dateInput: string | Date = new Date()): string {
  return `${formatWIBDate(dateInput)} — ${formatWIBTime(dateInput)}`;
}

/**
 * Parse Indonesian informal currency amounts:
 * "15rb", "15ribu" -> 15000
 * "1.5jt", "1,5jt" -> 1500000
 * "500k", "500K" -> 500000
 * "2.5m", "2,5m" -> 2500000000
 * "250.000" -> 250000
 * "rp 75.000" -> 75000
 */
export function parseIndonesianNumber(raw: string, hasFinancialContext: boolean = true): number | null {
  if (!raw) return null;
  const rawTrimmed = raw.trim();
  const clean = rawTrimmed.toLowerCase().replace(/^rp\.?\s*/i, '');

  // Match million: e.g. "1.5jt", "1,5jt", "1.5juta", "5jt"
  const jtMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:jt|juta)$/i);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // Match thousand: e.g. "15rb", "15ribu", "15.5rb", "500k"
  const rbMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)$/i);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // Match explicit billion (miliar) e.g. "100 miliar", "1.5 miliar"
  const miliarMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*miliar$/i);
  if (miliarMatch) {
    const val = parseFloat(miliarMatch[1].replace(',', '.'));
    return Math.round(val * 1000000000);
  }

  // Match suffix 'm' (e.g. "2.5m", "rp 5m", or with explicit financial context)
  // Prevents colliding with physical distance/time units like "5m" in non-financial text
  const mMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*m$/i);
  if (mMatch) {
    const hasExplicitRp = /^rp/i.test(rawTrimmed);
    const hasDecimal = /[.,]/.test(mMatch[1]);
    if (hasExplicitRp || hasDecimal || hasFinancialContext) {
      const val = parseFloat(mMatch[1].replace(',', '.'));
      return Math.round(val * 1000000000);
    }
  }

  // Match standard formatted numbers e.g. "150.000", "150,000", "150000"
  const digitsOnly = clean.replace(/[.,]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return parseInt(digitsOnly, 10);
  }

  return null;
}

/**
 * Visual Progress Bar generator with █ and ░
 * Example: percentage 75 -> "███████░░░"
 */
export function generateProgressBar(percentage: number, length: number = 10): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const filledCount = Math.round((clamped / 100) * length);
  const emptyCount = length - filledCount;

  const filledStr = '█'.repeat(filledCount);
  const emptyStr = '░'.repeat(emptyCount);

  return `${filledStr}${emptyStr}`;
}
