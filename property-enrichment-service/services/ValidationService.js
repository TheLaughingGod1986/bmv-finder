class ValidationService {
  /**
   * Validate property enrichment request parameters
   * @param {string} postcode - UK postcode
   * @param {string} number - House number/name
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validatePropertyRequest(postcode, number) {
    const errors = [];

    // Validate postcode
    if (!postcode) {
      errors.push('Postcode is required');
    } else if (!this.isValidUKPostcode(postcode)) {
      errors.push('Invalid UK postcode format');
    }

    // Validate house number
    if (!number) {
      errors.push('House number is required');
    } else if (!this.isValidHouseNumber(number)) {
      errors.push('Invalid house number format');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate UK postcode format
   * @param {string} postcode - Postcode to validate
   * @returns {boolean} True if valid UK postcode
   */
  isValidUKPostcode(postcode) {
    if (!postcode || typeof postcode !== 'string') {
      return false;
    }

    // Remove spaces and convert to uppercase
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();

    // UK postcode regex pattern
    // Format: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i;

    return postcodeRegex.test(cleanPostcode);
  }

  /**
   * Validate house number format
   * @param {string} number - House number/name to validate
   * @returns {boolean} True if valid house number
   */
  isValidHouseNumber(number) {
    if (!number || typeof number !== 'string') {
      return false;
    }

    const cleanNumber = number.trim();

    // Check if it's a valid house number/name
    // Allow: numbers (1, 2, 3...), number + letter (1A, 2B...), names (The Cottage, Rose Villa...)
    const numberRegex = /^[0-9]+[A-Za-z]?$|^[A-Za-z\s\-']+$/i;

    return numberRegex.test(cleanNumber) && cleanNumber.length <= 50;
  }

  /**
   * Sanitize input string
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .substring(0, 100); // Limit length
  }

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid API key format
   */
  isValidAPIKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Basic validation - should be non-empty and reasonable length
    return apiKey.trim().length > 0 && apiKey.trim().length <= 1000;
  }
}

module.exports = ValidationService; 