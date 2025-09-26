/**
 * Time Utility Functions for Memo App Timer System
 *
 * Implements smart time rounding logic that rounds to nearest 30-minute increments
 * based on the 10-minute tolerance rule.
 */

/**
 * Smart time rounding logic for timer entries
 *
 * Rules:
 * - If time > 10 minutes over nearest 30-min mark → round up
 * - If time ≤ 10 minutes over → round down
 * - Result is always X.0h or X.5h (30-minute increments only)
 *
 * Examples:
 * - 1h 45min → 2h 00min (rounds up)
 * - 1h 35min → 1h 30min (rounds down)
 * - 1h 50min → 2h 00min (rounds up)
 * - 0h 45min → 1h 00min (rounds up)
 * - 2h 10min → 2h 00min (rounds down)
 * - 2h 25min → 2h 30min (rounds up)
 */

export interface TimeRoundingResult {
  originalMinutes: number;
  roundedMinutes: number;
  originalFormatted: string;
  roundedFormatted: string;
  wasRounded: boolean;
  roundedUp: boolean;
}

/**
 * Round time in minutes to nearest 30-minute increment
 * @param minutes - Time in minutes to round
 * @returns Rounded time in minutes (always multiple of 30, minimum 30)
 */
export function roundToNearestHalfHour(minutes: number): number {
  // Ensure minimum of 30 minutes (0.5 hours)
  if (minutes < 30) {
    return 30;
  }

  // Find the nearest 30-minute marks (below and above)
  const lowerMark = Math.floor(minutes / 30) * 30;
  const upperMark = lowerMark + 30;

  // Calculate how many minutes over the lower mark
  const minutesOver = minutes - lowerMark;

  // Apply the 10-minute tolerance rule
  if (minutesOver <= 10) {
    // Round down to lower mark
    return lowerMark;
  } else {
    // Round up to upper mark
    return upperMark;
  }
}

/**
 * Round time in seconds to nearest 30-minute increment
 * @param seconds - Time in seconds to round
 * @returns Rounded time in seconds (always multiple of 1800)
 */
export function roundSecondsToNearestHalfHour(seconds: number): number {
  const minutes = Math.round(seconds / 60);
  const roundedMinutes = roundToNearestHalfHour(minutes);
  return roundedMinutes * 60;
}

/**
 * Get detailed time rounding result with formatting
 * @param minutes - Original time in minutes
 * @returns Detailed rounding result object
 */
export function getTimeRoundingDetails(minutes: number): TimeRoundingResult {
  const roundedMinutes = roundToNearestHalfHour(minutes);
  const wasRounded = minutes !== roundedMinutes;
  const roundedUp = roundedMinutes > minutes;

  return {
    originalMinutes: minutes,
    roundedMinutes,
    originalFormatted: formatMinutesToHourString(minutes),
    roundedFormatted: formatMinutesToHourString(roundedMinutes),
    wasRounded,
    roundedUp,
  };
}

/**
 * Format minutes into human-readable hour string
 * @param minutes - Time in minutes
 * @returns Formatted string like "1h 30min" or "2h"
 */
export function formatMinutesToHourString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format minutes into decimal hours (e.g., 1.5 for 1h 30min)
 * @param minutes - Time in minutes
 * @returns Decimal hours
 */
export function formatMinutesToDecimalHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format seconds into HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatSecondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate job order number based on year and sequence
 * Year-based prefix: 2025=8xxx, 2026=9xxx, etc.
 * @param year - The year for the job
 * @param sequence - The sequence number (1-999)
 * @returns 4-digit order number
 */
export function generateJobOrderNumber(year: number, sequence: number): number {
  if (year < 2025) {
    throw new Error('Job order numbers start from year 2025');
  }

  if (sequence < 1 || sequence > 999) {
    throw new Error('Sequence number must be between 1 and 999');
  }

  // Year code: 2025=8, 2026=9, 2027=0, 2028=1, etc.
  const yearCode = (year - 2017) % 10;

  // Format: YXXX where Y is year code and XXX is 3-digit sequence
  const orderNumber = yearCode * 1000 + sequence;

  return orderNumber;
}

/**
 * Validate job order number format
 * @param orderNumber - The order number to validate
 * @returns Object with validation result and details
 */
export function validateJobOrderNumber(orderNumber: number): {
  isValid: boolean;
  year?: number;
  sequence?: number;
  yearCode?: number;
  error?: string;
} {
  // Must be 4 digits
  if (orderNumber < 1000 || orderNumber > 9999) {
    return {
      isValid: false,
      error: 'Order number must be 4 digits',
    };
  }

  const yearCode = Math.floor(orderNumber / 1000);
  const sequence = orderNumber % 1000;

  // Year code must be valid (8 for 2025, 9 for 2026, etc.)
  const year = 2017 + yearCode;

  if (year < 2025) {
    return {
      isValid: false,
      error: 'Invalid year code. Jobs start from 2025 (8xxx)',
    };
  }

  if (sequence === 0) {
    return {
      isValid: false,
      error: 'Sequence number cannot be 0',
    };
  }

  return {
    isValid: true,
    year,
    sequence,
    yearCode,
  };
}

/**
 * Get suggested next job order number for current year
 * @param existingNumbers - Array of existing order numbers
 * @param year - Target year (defaults to current year)
 * @returns Suggested next order number
 */
export function suggestNextJobOrderNumber(
  existingNumbers: number[],
  year: number = new Date().getFullYear()
): number {
  if (year < 2025) {
    year = 2025; // Default to minimum supported year
  }

  const yearCode = (year - 2017) % 10;
  const yearPrefix = yearCode * 1000;

  // Filter numbers for this year
  const currentYearNumbers = existingNumbers
    .filter((num) => Math.floor(num / 1000) === yearCode)
    .map((num) => num % 1000)
    .sort((a, b) => a - b);

  // Find first available sequence number
  let sequence = 1;
  for (const existingSequence of currentYearNumbers) {
    if (existingSequence === sequence) {
      sequence++;
    } else {
      break;
    }
  }

  // Make sure we don't exceed 3 digits
  if (sequence > 999) {
    throw new Error(`No available sequence numbers for year ${year}`);
  }

  return yearPrefix + sequence;
}
