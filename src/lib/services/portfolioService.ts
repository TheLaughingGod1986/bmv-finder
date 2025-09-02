import { getDatabasePool } from '../database/connection';
import { 
  Portfolio, 
  PortfolioProperty, 
  Property, 
  PortfolioPerformance,
  PortfolioSchema,
  PortfolioPropertySchema,
  PropertySchema,
  PortfolioPerformanceSchema
} from '../database/schema';
import { GenericPropertyDocument } from '@/types/elasticsearch';

interface DatabaseResult {
  [key: string]: any;
}

interface TransformedResult {
  [key: string]: any;
}

// Helper function to transform database results from snake_case to camelCase
function transformDbResult<T>(dbResult: DatabaseResult | DatabaseResult[]): T {
  if (Array.isArray(dbResult)) {
    return dbResult.map(transformDbResult) as T;
  }
  
  if (dbResult && typeof dbResult === 'object') {
    const transformed: TransformedResult = {};
    for (const [key, value] of Object.entries(dbResult)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Handle null values and type conversions based on the field type
      if (value === null) {
        switch (camelKey) {
          case 'bedrooms':
          case 'floorArea':
          case 'lastSalePrice':
          case 'estimatedValue':
          case 'purchasePrice':
          case 'rentalIncome':
          case 'expenses':
            transformed[camelKey] = 0;
            break;
          case 'lastSaleDate':
          case 'purchaseDate':
          case 'lastValuationDate':
          case 'addedAt':
          case 'createdAt':
          case 'updatedAt':
            transformed[camelKey] = new Date();
            break;
          case 'propertyType':
          case 'epcRating':
            transformed[camelKey] = 'Unknown';
            break;
          case 'rentalEstimate':
          case 'marketData':
            transformed[camelKey] = {};
            break;
          default:
            transformed[camelKey] = value;
        }
      } else {
        // Handle type conversions for non-null values
        switch (camelKey) {
          case 'bedrooms':
          case 'floorArea':
          case 'lastSalePrice':
          case 'estimatedValue':
          case 'purchasePrice':
          case 'rentalIncome':
          case 'expenses':
            // Convert string numbers to actual numbers - handle both string and number inputs
            if (typeof value === 'string') {
              const parsed = parseFloat(value);
              transformed[camelKey] = isNaN(parsed) ? 0 : parsed;
            } else if (typeof value === 'number') {
              transformed[camelKey] = value;
            } else {
              transformed[camelKey] = Number(value) || 0;
            }
            break;
          case 'lastSaleDate':
          case 'purchaseDate':
          case 'lastValuationDate':
          case 'addedAt':
          case 'createdAt':
          case 'updatedAt':
            // Convert string dates to Date objects
            if (value instanceof Date) {
              transformed[camelKey] = value;
            } else if (typeof value === 'string') {
              const parsed = new Date(value);
              transformed[camelKey] = isNaN(parsed.getTime()) ? new Date() : parsed;
            } else {
              transformed[camelKey] = new Date();
            }
            break;
          case 'rentalEstimate':
          case 'marketData':
            // Parse JSON strings to objects
            if (typeof value === 'string') {
              try {
                transformed[camelKey] = JSON.parse(value);
              } catch {
                transformed[camelKey] = {};
              }
            } else if (value && typeof value === 'object') {
              transformed[camelKey] = value;
            } else {
              transformed[camelKey] = {};
            }
            break;
          default:
            transformed[camelKey] = value;
        }
      }
    }
    return transformed as T;
  }
  
  return dbResult as T;
}

export class PortfolioService {
  
  // Create a new portfolio for a user
  async createPortfolio(userId: string, name: string, description?: string): Promise<Portfolio> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'INSERT INTO portfolios (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, description]
      );
      
      const portfolio = transformDbResult(result.rows[0]);
      return PortfolioSchema.parse(portfolio);
    } finally {
      client.release();
    }
  }

  // Get all portfolios for a user
  async getUserPortfolios(userId: string): Promise<(Portfolio & { properties: PortfolioProperty[] })[]> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      // Get all portfolios
      const portfoliosResult = await client.query(
        'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
              const portfolios = transformDbResult(portfoliosResult.rows) as Portfolio[];
      const parsedPortfolios = portfolios.map(portfolio => PortfolioSchema.parse(portfolio));
      
      // For each portfolio, get its properties
      const portfoliosWithProperties = await Promise.all(
        parsedPortfolios.map(async (portfolio) => {
          const propertiesResult = await client.query(
            'SELECT * FROM portfolio_properties WHERE portfolio_id = $1',
            [portfolio.id]
          );
          
          const properties = transformDbResult(propertiesResult.rows) as Property[];
          const parsedProperties = properties.map(property => PortfolioPropertySchema.parse(property));
          
          return {
            ...portfolio,
            properties: parsedProperties
          };
        })
      );
      
      return portfoliosWithProperties;
    } finally {
      client.release();
    }
  }

  // Get a specific portfolio with its properties
  async getPortfolio(portfolioId: string): Promise<Portfolio & { properties: PortfolioProperty[] }> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      const portfolioResult = await client.query(
        'SELECT * FROM portfolios WHERE id = $1',
        [portfolioId]
      );
      
      if (portfolioResult.rows.length === 0) {
        throw new Error('Portfolio not found');
      }
      
      const portfolio = transformDbResult(portfolioResult.rows[0]);
      const parsedPortfolio = PortfolioSchema.parse(portfolio);
      
      const propertiesResult = await client.query(
        'SELECT * FROM portfolio_properties WHERE portfolio_id = $1',
        [portfolioId]
      );
      
              const properties = transformDbResult(propertiesResult.rows) as Property[];
      const parsedProperties = properties.map(property => PortfolioPropertySchema.parse(property));
      
      return {
        ...parsedPortfolio,
        properties: parsedProperties
      };
    } finally {
      client.release();
    }
  }

  // Add a property to a portfolio
  async addPropertyToPortfolio(portfolioId: string, propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>, portfolioPropertyData?: Partial<PortfolioProperty>): Promise<PortfolioProperty> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      console.log('Adding property to portfolio:', { portfolioId, propertyData, portfolioPropertyData });
      
      // First, check if property already exists
      let propertyResult = await client.query(
        'SELECT * FROM properties WHERE address = $1 AND postcode = $2',
        [propertyData.address, propertyData.postcode]
      );
      
      console.log('Property check result:', propertyResult.rows);
      
      let property;
      if (propertyResult.rows.length > 0) {
        // Property exists, use it but ensure all required fields are populated
        const existingProperty = transformDbResult(propertyResult.rows[0]);
        console.log('Existing property:', existingProperty);
        
        // Update the existing property with any new data
        const updatedProperty = {
                  ...(existingProperty as GenericPropertyDocument),
        propertyType: propertyData.propertyType || (existingProperty as GenericPropertyDocument).propertyType || 'Unknown',
        bedrooms: propertyData.bedrooms || (existingProperty as GenericPropertyDocument).bedrooms || 0,
        floorArea: propertyData.floorArea || (existingProperty as GenericPropertyDocument).floorArea || 0,
        epcRating: propertyData.epcRating || (existingProperty as GenericPropertyDocument).epcRating || 'Unknown',
        estimatedValue: propertyData.estimatedValue || (propertyData as GenericPropertyDocument).currentValuation || (existingProperty as GenericPropertyDocument).estimatedValue || 0,
        rentalEstimate: propertyData.rentalEstimate ? 
          { monthly: propertyData.rentalEstimate.monthly || 0, yearly: propertyData.rentalEstimate.yearly || 0 } : 
          ((propertyData as GenericPropertyDocument).recommendedRent ? 
            { monthly: (propertyData as GenericPropertyDocument).recommendedRent, yearly: (propertyData as GenericPropertyDocument).recommendedRent * 12 } : 
            (existingProperty as GenericPropertyDocument).rentalEstimate || {}
          )
        };
        
        console.log('Updated property:', updatedProperty);
        
        // Update the property in the database
        propertyResult = await client.query(
          `UPDATE properties 
           SET property_type = $1, bedrooms = $2, floor_area = $3, epc_rating = $4, 
               estimated_value = $5, rental_estimate = $6, updated_at = NOW()
           WHERE address = $7 AND postcode = $8 
           RETURNING *`,
          [
            updatedProperty.propertyType,
            updatedProperty.bedrooms,
            updatedProperty.floorArea,
            updatedProperty.epcRating,
            updatedProperty.estimatedValue,
            JSON.stringify(updatedProperty.rentalEstimate),
            propertyData.address,
            propertyData.postcode
          ]
        );
        
        property = transformDbResult(propertyResult.rows[0]);
      } else {
        console.log('Property does not exist, inserting new property');
        // Property doesn't exist, insert it
        propertyResult = await client.query(
          'INSERT INTO properties (address, postcode, property_type, bedrooms, floor_area, epc_rating, estimated_value, rental_estimate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [
            propertyData.address, 
            propertyData.postcode, 
            propertyData.propertyType || 'Unknown', 
            propertyData.bedrooms || 0, 
            propertyData.floorArea || 0, 
            propertyData.epcRating || 'Unknown', 
            propertyData.estimatedValue || (propertyData as GenericPropertyDocument).currentValuation || 0, 
            JSON.stringify(
              propertyData.rentalEstimate ? 
                { monthly: propertyData.rentalEstimate.monthly || 0, yearly: propertyData.rentalEstimate.yearly || 0 } : 
                ((propertyData as GenericPropertyDocument).recommendedRent ? 
                  { monthly: (propertyData as GenericPropertyDocument).recommendedRent, yearly: (propertyData as GenericPropertyDocument).recommendedRent * 12 } : 
                  { monthly: 0, yearly: 0 }
                )
            )
          ]
        );
        property = transformDbResult(propertyResult.rows[0]);
      }
      
      console.log('Property after transform:', property);
      
      const parsedProperty = PropertySchema.parse(property);
      console.log('Parsed property:', parsedProperty);
      
      // Check if property is already in this portfolio
      const existingPortfolioProperty = await client.query(
        'SELECT * FROM portfolio_properties WHERE portfolio_id = $1 AND property_id = $2',
        [portfolioId, parsedProperty.id]
      );
      
      if (existingPortfolioProperty.rows.length > 0) {
        throw new Error('Property is already in this portfolio');
      }
      
      // Then, add it to the portfolio
      const portfolioPropertyResult = await client.query(
        'INSERT INTO portfolio_properties (portfolio_id, property_id, added_at, notes, purchase_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [portfolioId, parsedProperty.id, new Date(), portfolioPropertyData?.notes, portfolioPropertyData?.purchasePrice]
      );
      
      const portfolioProperty = transformDbResult(portfolioPropertyResult.rows[0]);
      return PortfolioPropertySchema.parse(portfolioProperty);
    } catch (error) {
      console.error('Error in addPropertyToPortfolio:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Remove a property from a portfolio
  async removePropertyFromPortfolio(portfolioId: string, propertyId: string): Promise<void> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      await client.query(
        'DELETE FROM portfolio_properties WHERE portfolio_id = $1 AND property_id = $2',
        [portfolioId, propertyId]
      );
    } finally {
      client.release();
    }
  }

  // Update portfolio property details
  async updatePortfolioProperty(portfolioId: string, propertyId: string, updates: Partial<PortfolioProperty>): Promise<PortfolioProperty> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      const setClauses: string[] = [];
      const values: (string | number | Date | null)[] = [];
      let paramIndex = 1;
      
      if (updates.notes !== undefined) {
        setClauses.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      
      if (updates.purchasePrice !== undefined) {
        setClauses.push(`purchase_price = $${paramIndex++}`);
        values.push(updates.purchasePrice);
      }
      
      if (setClauses.length === 0) {
        throw new Error('No updates provided');
      }
      
      values.push(portfolioId, propertyId);
      
      const result = await client.query(
        `UPDATE portfolio_properties SET ${setClauses.join(', ')} WHERE portfolio_id = $${paramIndex++} AND property_id = $${paramIndex++} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new Error('Portfolio property not found');
      }
      
      const portfolioProperty = transformDbResult(result.rows[0]);
      return PortfolioPropertySchema.parse(portfolioProperty);
    } finally {
      client.release();
    }
  }

  // Calculate portfolio performance
  async calculatePortfolioPerformance(portfolioId: string): Promise<PortfolioPerformance> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      // Get portfolio properties with their current valuations
      const result = await client.query(`
        SELECT 
          pp.id,
          pp.portfolio_id,
          pp.purchase_price,
          p.estimated_value,
          p.rental_estimate
        FROM portfolio_properties pp
        JOIN properties p ON pp.property_id = p.id
        WHERE pp.portfolio_id = $1
      `, [portfolioId]);
      
      if (result.rows.length === 0) {
        throw new Error('Portfolio not found or has no properties');
      }
      
      let totalPurchasePrice = 0;
      let totalCurrentValue = 0;
      let totalAnnualRent = 0;
      
      result.rows.forEach(row => {
        const purchasePrice = row.purchase_price || 0;
        const currentValue = row.estimated_value || 0;
        const annualRent = (row.rental_estimate ? JSON.parse(row.rental_estimate).yearly : 0) || 0;
        
        totalPurchasePrice += purchasePrice;
        totalCurrentValue += currentValue;
        totalAnnualRent += annualRent;
      });
      
      const totalReturn = totalCurrentValue - totalPurchasePrice;
      const returnPercentage = totalPurchasePrice > 0 ? (totalReturn / totalPurchasePrice) * 100 : 0;
      const grossYield = totalPurchasePrice > 0 ? (totalAnnualRent / totalPurchasePrice) * 100 : 0;
      
      const performance: PortfolioPerformance = {
        id: `perf_${portfolioId}`,
        portfolioId,
        date: new Date(),
        totalValue: totalCurrentValue,
        totalProperties: result.rows.length,
        totalRentalIncome: totalAnnualRent,
        totalExpenses: 0, // Not tracked in current implementation
        netReturn: totalReturn,
        capitalGrowth: returnPercentage,
        rentalYield: grossYield
      };
      
      return PortfolioPerformanceSchema.parse(performance);
    } finally {
      client.release();
    }
  }

  // Save portfolio performance
  async savePortfolioPerformance(performance: PortfolioPerformance): Promise<void> {
    const pool = getDatabasePool();
    const client = await pool.connect();
    
    try {
      await client.query(
        'INSERT INTO portfolio_performance (id, portfolio_id, date, total_value, total_properties, total_rental_income, total_expenses, net_return, capital_growth, rental_yield) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, total_value = EXCLUDED.total_value, total_properties = EXCLUDED.total_properties, total_rental_income = EXCLUDED.total_rental_income, total_expenses = EXCLUDED.total_expenses, net_return = EXCLUDED.net_return, capital_growth = EXCLUDED.capital_growth, rental_yield = EXCLUDED.rental_yield',
        [performance.id, performance.portfolioId, performance.date, performance.totalValue, performance.totalProperties, performance.totalRentalIncome, performance.totalExpenses, performance.netReturn, performance.capitalGrowth, performance.rentalYield]
      );
    } finally {
      client.release();
    }
  }
}
