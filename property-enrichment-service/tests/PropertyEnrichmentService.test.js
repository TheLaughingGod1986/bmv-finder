const PropertyEnrichmentService = require('../services/PropertyEnrichmentService');
const ValidationService = require('../services/ValidationService');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('PropertyEnrichmentService', () => {
  let service;
  let validationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyEnrichmentService(mockLogger);
    validationService = new ValidationService();
  });

  describe('enrichPropertyData', () => {
    it('should return null when no EPC data is found', async () => {
      // Mock empty EPC response
      axios.get.mockResolvedValue({
        status: 200,
        data: { rows: [] }
      });

      const result = await service.enrichPropertyData('SW1A1AA', '10');
      
      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('No EPC data found', {
        postcode: 'SW1A1AA',
        number: '10'
      });
    });

    it('should return enriched property data when exact match is found', async () => {
      // Mock EPC response with matching data
      const mockEPCData = {
        rows: [{
          address: '10',
          postcode: 'SW1A1AA',
          street: 'Downing Street',
          number_of_bedrooms: '3',
          current_energy_efficiency: 'C',
          total_floor_area: '82.5',
          property_type: 'semi_detached',
          construction_year: '1985',
          current_energy_rating: 'C',
          potential_energy_rating: 'B',
          inspection_date: '2023-01-15',
          certificate_id: '123456789'
        }]
      };

      axios.get.mockResolvedValue({
        status: 200,
        data: mockEPCData
      });

      const result = await service.enrichPropertyData('SW1A1AA', '10');

      expect(result).toEqual({
        address: '10 Downing Street, SW1A1AA',
        bedrooms: 3,
        epc_rating: 'C',
        floor_area_m2: 82.5,
        property_type: 'Semi detached',
        construction_year: '1985',
        current_energy_rating: 'C',
        potential_energy_rating: 'B',
        epc_date: '2023-01-15',
        certificate_id: '123456789'
      });
    });

    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.enrichPropertyData('SW1A1AA', '10');
      
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching EPC data', expect.any(Object));
    });
  });

  describe('normalizePostcode', () => {
    it('should normalize postcode format', () => {
      expect(service.normalizePostcode('sw1a 1aa')).toBe('SW1A1AA');
      expect(service.normalizePostcode('SW1A  1AA')).toBe('SW1A1AA');
      expect(service.normalizePostcode('')).toBe('');
    });
  });

  describe('normalizeHouseNumber', () => {
    it('should normalize house number format', () => {
      expect(service.normalizeHouseNumber('10')).toBe('10');
      expect(service.normalizeHouseNumber(' 10A ')).toBe('10a');
      expect(service.normalizeHouseNumber('The Cottage')).toBe('the cottage');
      expect(service.normalizeHouseNumber('')).toBe('');
    });
  });

  describe('findBestAddressMatch', () => {
    it('should find exact match', () => {
      const epcData = [
        { address: '10', postcode: 'SW1A1AA' },
        { address: '11', postcode: 'SW1A1AA' }
      ];

      const result = service.findBestAddressMatch(epcData, '10', 'SW1A1AA');
      
      expect(result).toEqual({ address: '10', postcode: 'SW1A1AA' });
    });

    it('should find partial match when exact match not found', () => {
      const epcData = [
        { address: '10A', postcode: 'SW1A1AA' },
        { address: '11', postcode: 'SW1A1AA' }
      ];

      const result = service.findBestAddressMatch(epcData, '10', 'SW1A1AA');
      
      expect(result).toEqual({ address: '10A', postcode: 'SW1A1AA' });
    });

    it('should return null when no match found', () => {
      const epcData = [
        { address: '11', postcode: 'SW1A1AA' },
        { address: '12', postcode: 'SW1A1AA' }
      ];

      const result = service.findBestAddressMatch(epcData, '10', 'SW1A1AA');
      
      expect(result).toBeNull();
    });
  });

  describe('extractBedrooms', () => {
    it('should extract valid bedroom count', () => {
      expect(service.extractBedrooms({ number_of_bedrooms: '3' })).toBe(3);
      expect(service.extractBedrooms({ number_of_bedrooms: '0' })).toBe(0);
    });

    it('should return null for invalid bedroom data', () => {
      expect(service.extractBedrooms({ number_of_bedrooms: 'invalid' })).toBeNull();
      expect(service.extractBedrooms({ number_of_bedrooms: null })).toBeNull();
      expect(service.extractBedrooms({})).toBeNull();
    });
  });

  describe('extractEPCRating', () => {
    it('should extract valid EPC rating', () => {
      expect(service.extractEPCRating({ current_energy_efficiency: 'C' })).toBe('C');
      expect(service.extractEPCRating({ current_energy_rating: 'A' })).toBe('A');
    });

    it('should return null for invalid EPC rating', () => {
      expect(service.extractEPCRating({ current_energy_efficiency: 'X' })).toBeNull();
      expect(service.extractEPCRating({ current_energy_efficiency: 'invalid' })).toBeNull();
      expect(service.extractEPCRating({})).toBeNull();
    });
  });

  describe('extractFloorArea', () => {
    it('should extract valid floor area', () => {
      expect(service.extractFloorArea({ total_floor_area: '82.5' })).toBe(82.5);
      expect(service.extractFloorArea({ total_floor_area: '100' })).toBe(100);
    });

    it('should return null for invalid floor area', () => {
      expect(service.extractFloorArea({ total_floor_area: 'invalid' })).toBeNull();
      expect(service.extractFloorArea({ total_floor_area: null })).toBeNull();
      expect(service.extractFloorArea({})).toBeNull();
    });
  });

  describe('extractPropertyType', () => {
    it('should extract and normalize property type', () => {
      expect(service.extractPropertyType({ property_type: 'semi_detached' })).toBe('Semi detached');
      expect(service.extractPropertyType({ property_type: 'detached-house' })).toBe('Detached house');
      expect(service.extractPropertyType({ property_type: 'FLAT' })).toBe('Flat');
    });

    it('should return null for missing property type', () => {
      expect(service.extractPropertyType({ property_type: null })).toBeNull();
      expect(service.extractPropertyType({})).toBeNull();
    });
  });
});

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validatePropertyRequest', () => {
    it('should validate correct input', () => {
      const result = validationService.validatePropertyRequest('SW1A1AA', '10');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing postcode', () => {
      const result = validationService.validatePropertyRequest('', '10');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Postcode is required');
    });

    it('should reject invalid postcode format', () => {
      const result = validationService.validatePropertyRequest('INVALID', '10');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid UK postcode format');
    });

    it('should reject missing house number', () => {
      const result = validationService.validatePropertyRequest('SW1A1AA', '');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('House number is required');
    });

    it('should reject invalid house number format', () => {
      const result = validationService.validatePropertyRequest('SW1A1AA', '!@#$%');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid house number format');
    });
  });

  describe('isValidUKPostcode', () => {
    it('should accept valid UK postcodes', () => {
      expect(validationService.isValidUKPostcode('SW1A1AA')).toBe(true);
      expect(validationService.isValidUKPostcode('M1 1AA')).toBe(true);
      expect(validationService.isValidUKPostcode('B33 8TH')).toBe(true);
      expect(validationService.isValidUKPostcode('W1A 0AX')).toBe(true);
    });

    it('should reject invalid UK postcodes', () => {
      expect(validationService.isValidUKPostcode('INVALID')).toBe(false);
      expect(validationService.isValidUKPostcode('12345')).toBe(false);
      expect(validationService.isValidUKPostcode('')).toBe(false);
      expect(validationService.isValidUKPostcode(null)).toBe(false);
    });
  });

  describe('isValidHouseNumber', () => {
    it('should accept valid house numbers', () => {
      expect(validationService.isValidHouseNumber('10')).toBe(true);
      expect(validationService.isValidHouseNumber('10A')).toBe(true);
      expect(validationService.isValidHouseNumber('The Cottage')).toBe(true);
      expect(validationService.isValidHouseNumber('Rose Villa')).toBe(true);
    });

    it('should reject invalid house numbers', () => {
      expect(validationService.isValidHouseNumber('!@#$%')).toBe(false);
      expect(validationService.isValidHouseNumber('')).toBe(false);
      expect(validationService.isValidHouseNumber(null)).toBe(false);
    });
  });
}); 