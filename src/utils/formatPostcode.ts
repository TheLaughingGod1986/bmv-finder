// Enhanced: Format a string as a UK postcode (e.g., ss95el -> SS9 5EL)
export function formatPostcode(input: string): string {
  if (!input) return '';
  // Remove all non-alphanumeric, uppercase, and trim
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Always insert a space before the last 3 characters if possible
  if (cleaned.length > 3) {
    return cleaned.slice(0, -3).trim() + ' ' + cleaned.slice(-3);
  }
  return cleaned;
} 