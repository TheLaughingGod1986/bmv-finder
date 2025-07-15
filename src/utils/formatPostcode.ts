// Format a string as a UK postcode (e.g., ss95el -> SS9 5EL)
export function formatPostcode(input: string): string {
  if (!input) return '';
  const upper = input.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  // Only format if it looks like a postcode (5-8 chars, ends with 3 letters/digits)
  if (cleaned.length >= 5 && cleaned.length <= 8) {
    return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3);
  }
  return cleaned;
} 