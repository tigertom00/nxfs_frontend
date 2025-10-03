/**
 * OCR utilities for extracting Norwegian EL-numbers from product labels
 */

/**
 * Extract Norwegian EL-number from OCR text
 * Looks for patterns like "NO 45 234 10" and extracts "4523410"
 * Ignores Swedish (SE), Danish (DK), Finnish (FI) and other country codes
 */
export function extractNorwegianELNumber(ocrText: string): string | null {
  // Split text into lines
  const lines = ocrText.split('\n');

  for (const line of lines) {
    // Try multiple patterns for flexibility

    // Pattern 1: NO + spaces + digits (most common)
    // Examples: "NO 45 234 10", "NO 1 234 567", "NO45 234 10"
    const pattern1 = /NO\s*(\d{1,2})\s*(\d{3})\s*(\d{2,3})/i;
    let match = line.match(pattern1);

    if (!match) {
      // Pattern 2: Just "NO" followed by 6-8 digits (no spaces)
      // Example: "NO4523410"
      const pattern2 = /NO\s*(\d{6,8})/i;
      match = line.match(pattern2);
      if (match) {
        const elNumber = match[1];
        if (elNumber.length >= 6 && elNumber.length <= 8) {
          return elNumber;
        }
      }
    }

    if (match && match.length >= 4) {
      // Extract the three digit groups and combine them
      const part1 = match[1]; // 1-2 digits
      const part2 = match[2]; // 3 digits
      const part3 = match[3]; // 2-3 digits

      const elNumber = part1 + part2 + part3;

      // Validate that it's 6-8 digits (valid EL-number length)
      if (elNumber.length >= 6 && elNumber.length <= 8) {
        return elNumber;
      }
    }
  }

  return null;
}

/**
 * Clean and normalize OCR text for better matching
 */
export function normalizeOCRText(text: string): string {
  return (
    text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Convert to uppercase for consistent matching
      .toUpperCase()
      // Fix common OCR mistakes
      .replace(/N0/g, 'NO') // "N zero" → "NO"
      .replace(/\bNO\b/g, 'NO') // Ensure NO is properly recognized
      // Remove common OCR artifacts
      .replace(/[|]/g, 'I')
      .trim()
  );
}

/**
 * Validate if extracted number matches EL-number format
 */
export function isValidELNumber(number: string): boolean {
  // EL-numbers are 6-8 digits
  return /^\d{6,8}$/.test(number);
}

/**
 * Format EL-number for display (add spaces for readability)
 * Example: "4523410" -> "45 234 10"
 */
export function formatELNumber(elNumber: string): string {
  if (elNumber.length === 7) {
    // Format: XX XXX XX
    return `${elNumber.slice(0, 2)} ${elNumber.slice(2, 5)} ${elNumber.slice(5)}`;
  } else if (elNumber.length === 8) {
    // Format: XX XXX XXX
    return `${elNumber.slice(0, 2)} ${elNumber.slice(2, 5)} ${elNumber.slice(5)}`;
  } else if (elNumber.length === 6) {
    // Format: X XXX XX
    return `${elNumber.slice(0, 1)} ${elNumber.slice(1, 4)} ${elNumber.slice(4)}`;
  }
  return elNumber;
}
