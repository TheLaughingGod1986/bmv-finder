import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { 
  RecentSaleDocument, 
  PropertiesEnhancedDocument, 
  HPIDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';

// Helper functions for intelligent property data estimation
function estimateBuildYearFromPostcode(postcode: string): number | null {
  if (!postcode) return null;
  
  // Extract postcode area (e.g., 'NE5' from 'NE5 4PR')
  const postcodeArea = postcode.substring(0, 3).toUpperCase();
  
  // Historical build patterns by postcode area
  const buildYearPatterns: { [key: string]: number } = {
    'NE1': 1985, // Newcastle city center - mix of old and new
    'NE2': 1975, // Newcastle suburbs - mostly 1970s-80s
    'NE3': 1980, // Newcastle suburbs - mix of periods
    'NE4': 1970, // Newcastle outer areas - mostly 1960s-70s
    'NE5': 1985, // Newcastle outer areas - mix of periods
    'NE6': 1975, // Newcastle outer areas - mostly 1970s-80s
    'NE7': 1980, // Newcastle outer areas - mix of periods
    'NE8': 1970, // Gateshead - mix of periods
    'NE9': 1985, // Gateshead outer areas - mix of periods
    'NE10': 1990, // Gateshead outer areas - newer developments
    'NE11': 1980, // Gateshead outer areas - mix of periods
    'NE12': 1985, // North Tyneside - mix of periods
    'NE13': 1990, // North Tyneside - newer developments
    'NE15': 1980, // Newcastle outer areas - mix of periods
    'NE16': 1985, // Newcastle outer areas - mix of periods
    'NE17': 1980, // Newcastle outer areas - mix of periods
    'NE18': 1985, // Newcastle outer areas - mix of periods
    'NE19': 1975, // Northumberland - mix of periods
    'NE20': 1980, // Northumberland - mix of periods
    'NE21': 1975, // Northumberland - mix of periods
    'NE22': 1980, // Northumberland - mix of periods
    'NE23': 1985, // Northumberland - mix of periods
    'NE24': 1980, // Northumberland - mix of periods
    'NE25': 1985, // Northumberland - mix of periods
    'NE26': 1980, // Northumberland - mix of periods
    'NE27': 1985, // Northumberland - mix of periods
    'NE28': 1980, // Northumberland - mix of periods
    'NE29': 1985, // Northumberland - mix of periods
    'NE30': 1980, // North Tyneside - mix of periods
    'NE31': 1985, // South Tyneside - mix of periods
    'NE32': 1980, // South Tyneside - mix of periods
    'NE33': 1985, // South Tyneside - mix of periods
    'NE34': 1980, // South Tyneside - mix of periods
    'NE35': 1985, // Northumberland - mix of periods
    'NE36': 1980, // Northumberland - mix of periods
    'NE37': 1985, // Northumberland - mix of periods
    'NE38': 1980, // Northumberland - mix of periods
    'NE39': 1985, // Northumberland - mix of periods
    'NE40': 1980, // Northumberland - mix of periods
    'NE41': 1985, // Northumberland - mix of periods
    'NE42': 1980, // Northumberland - mix of periods
    'NE43': 1985, // Northumberland - mix of periods
    'NE44': 1980, // Northumberland - mix of periods
    'NE45': 1985, // Northumberland - mix of periods
    'NE46': 1980, // Northumberland - mix of periods
    'NE47': 1985, // Northumberland - mix of periods
    'NE48': 1980, // Northumberland - mix of periods
    'NE49': 1985, // Northumberland - mix of periods
    'NE61': 1980, // Northumberland - mix of periods
    'NE62': 1985, // Northumberland - mix of periods
    'NE63': 1980, // Northumberland - mix of periods
    'NE64': 1985, // Northumberland - mix of periods
    'NE65': 1980, // Northumberland - mix of periods
    'NE66': 1985, // Northumberland - mix of periods
    'NE67': 1980, // Northumberland - mix of periods
    'NE68': 1985, // Northumberland - mix of periods
    'NE69': 1980, // Northumberland - mix of periods
    'NE70': 1985, // Northumberland - mix of periods
    'NE71': 1980, // Northumberland - mix of periods
  };
  
  return buildYearPatterns[postcodeArea] || 1980; // Default to 1980 if no pattern found
}

function estimateEPCFromBuildYear(buildYear: number): string {
  if (!buildYear) return 'D'; // Default to D if no year
  
  // EPC rating estimation based on build year
  if (buildYear >= 2010) return 'B'; // Newer properties tend to be more energy efficient
  if (buildYear >= 2000) return 'C';
  if (buildYear >= 1980) return 'D';
  if (buildYear >= 1960) return 'E';
  if (buildYear >= 1940) return 'F';
  return 'G'; // Pre-1940 properties
}

function estimateSquareFootageFromBedrooms(bedrooms: number, propertyType: string): number {
  if (!bedrooms || bedrooms < 1) return 80; // Default 80 sqm
  
  // Average square footage per bedroom by property type
  const sqmPerBedroom: { [key: string]: number } = {
    'Flat': 35,
    'Apartment': 35,
    'Maisonette': 40,
    'Terraced': 45,
    'Semi-Detached': 50,
    'Detached': 55,
    'House': 50, // Default for generic "House"
    'Bungalow': 50
  };
  
  const sqmPerBed = sqmPerBedroom[propertyType] || 50;
  return bedrooms * sqmPerBed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const address = searchParams.get('address');
    const bedrooms = parseInt(searchParams.get('bedrooms') || '3');
    const propertyType = searchParams.get('propertyType') || 'detached';
    
    // Get manual property inputs if provided
    const manualPropertyType = searchParams.get('manualPropertyType');
    const manualPropertyCondition = searchParams.get('manualPropertyCondition');
    const manualBuildYear = searchParams.get('manualBuildYear') ? parseInt(searchParams.get('manualBuildYear')!) : null;
    const manualEpcRating = searchParams.get('manualEpcRating');
    const manualSquareFootage = searchParams.get('manualSquareFootage') ? parseInt(searchParams.get('manualSquareFootage')!) : null;
    const manualHasGarage = searchParams.get('manualHasGarage') === 'true';
    const manualHasGarden = searchParams.get('manualHasGarden') === 'true';
    const manualHasParking = searchParams.get('manualHasParking') === 'true';

    if (!postcode && !address) {
      return NextResponse.json({ 
        error: 'Missing postcode or address parameter' 
      }, { status: 400 });
    }

    console.log('Deal calculator data request:', { postcode, address, bedrooms, propertyType });

    // 1. Validate and get postcode data from Postcodes.io
    let postcodeData = null;
    let region = null;
    
    if (postcode) {
      try {
        const postcodeResponse = await fetch(`https://postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
        if (postcodeResponse.ok) {
          const postcodeResult = await postcodeResponse.json();
          if (postcodeResult.result) {
            postcodeData = postcodeResult.result;
            region = postcodeData.region || postcodeData.admin_district;
            console.log('Postcode data from Postcodes.io:', { region, postcodeData });
          }
        }
      } catch (error) {
        console.log('Failed to fetch from Postcodes.io, using fallback');
      }
    }

    // 2. Get list of sold properties for selection
    let soldProperties = [];
    let confidence = 'low';
    
    try {
      // Try recent_sales index first
      const salesResponse = await esClient.search({
        index: 'recent_sales',
        size: 20,
        query: {
          bool: {
            must: [
              { match: { postcode: postcode || '' } },
              { range: { bedrooms: { gte: Math.max(1, bedrooms - 1), lte: bedrooms + 1 } } }
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }]
      });

      if (salesResponse.hits.hits.length > 0) {
        soldProperties = salesResponse.hits.hits.map(hit => {
          const source = hit._source as RecentSaleDocument;
          return {
            id: hit._id,
            address: source.address || 'Unknown Address',
            postcode: source.postcode,
            price: source.price,
            date: source.date,
            bedrooms: source.bedrooms,
            propertyType: source.property_type || 'Unknown',
            squareFootage: source.square_footage || 0
          };
        });
        
        // More sophisticated confidence calculation
        if (soldProperties.length >= 5) {
          confidence = 'very high';
        } else if (soldProperties.length >= 3) {
          confidence = 'high';
        } else if (soldProperties.length >= 1) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
        
        // Boost confidence if we have regional data from Postcodes.io
        if (postcodeData && region) {
          if (confidence === 'low') confidence = 'medium';
          else if (confidence === 'medium') confidence = 'high';
        }
      }
    } catch (error) {
      console.log('recent_sales index not available, trying properties-enhanced for sold properties');
      
      // Fallback: try to get some property data from properties-enhanced
      try {
        const fallbackResponse = await esClient.search({
          index: 'properties-enhanced',
          size: 10,
          query: {
            bool: {
              must: [
                { match: { postcode: postcode || '' } }
              ]
            }
          },
          sort: [{ date: { order: 'desc' } }]
        });

        if (fallbackResponse.hits.hits.length > 0) {
          // Create mock sold properties from enhanced data
          soldProperties = fallbackResponse.hits.hits.slice(0, 5).map((hit, index) => {
            const source = hit._source as PropertiesEnhancedDocument;
            return {
              id: `fallback_${index}`,
              address: `${source.paon || ''} ${source.street || ''}`.trim() || 'Unknown Address',
              postcode: source.postcode,
              price: source.price || 0,
              date: source.date,
              bedrooms: source.epc_bedrooms || bedrooms,
              propertyType: source.property_type_label || 'Unknown',
              squareFootage: source.epc_size || 0
            };
          });
          
          confidence = soldProperties.length >= 3 ? 'medium' : 'low';
          console.log('Created fallback sold properties from properties-enhanced:', soldProperties.length);
        }
      } catch (fallbackError) {
        console.log('No fallback property data available');
      }
    }

    // 2.5. Get enhanced property data (EPC, house type, condition, etc.)
    let enhancedPropertyData = null;
    try {
      // First try to find exact match with postcode and address
      let enhancedResponse = await esClient.search({
        index: 'properties-enhanced',
        size: 1,
        query: {
          bool: {
            must: [
              { match: { postcode: postcode || '' } }
            ],
            should: [
              { match: { address: address || '' } },
              { match: { street: address || '' } }
            ],
            minimum_should_match: 0
          }
        }
      });

      // If no exact match, try just postcode with any property
      if (enhancedResponse.hits.hits.length === 0) {
        enhancedResponse = await esClient.search({
          index: 'properties-enhanced',
          size: 1,
          query: {
            bool: {
              must: [
                { match: { postcode: postcode || '' } }
              ]
            }
          }
        });
      }

      if (enhancedResponse.hits.hits.length > 0) {
        const hit = enhancedResponse.hits.hits[0]._source;
        console.log('Raw enhanced property data from ES:', hit);
        
        // Extract any available data, even if sparse
        const source = hit as PropertiesEnhancedDocument;
        enhancedPropertyData = {
          epcRating: source.epc_rating || null,
          epcScore: source.epc_score || null,
          epcSize: source.epc_size || null, // in sqm
          propertyType: source.property_type_label || source.property_type || null,
          houseCondition: source.condition || source.house_condition || null,
          squareFootage: source.square_footage || source.epc_size || null,
          buildYear: source.build_year || source.year_built || null,
          tenure: source.estate_type_label || source.tenure || null,
          hasGarage: source.has_garage || false,
          hasGarden: source.has_garden || false,
          hasParking: source.has_parking || false
        };
        
        // Only include if we have at least some meaningful data
        const hasData = Object.values(enhancedPropertyData).some(value => value !== null && value !== false);
        if (hasData) {
          enhancedPropertyData.dataSource = 'elasticsearch'; // Mark as Elasticsearch data
          console.log('Processed enhanced property data:', enhancedPropertyData);
        } else {
          console.log('Enhanced property data found but all fields are empty/null');
          enhancedPropertyData = null;
        }
      } else {
        console.log('No enhanced property data found in properties-enhanced index');
      }
      
      // Generate intelligent fallback data when no real data is available
      if (!enhancedPropertyData && postcode) {
        console.log('Generating intelligent fallback property data...');
        
        // Use intelligent estimation functions
        const estimatedBuildYear = estimateBuildYearFromPostcode(postcode);
        const estimatedEPC = estimateEPCFromBuildYear(estimatedBuildYear);
        const estimatedSquareFootage = estimateSquareFootageFromBedrooms(bedrooms, propertyType);
        
        enhancedPropertyData = {
          epcRating: estimatedEPC,
          epcScore: estimatedEPC === 'A' ? 95 : estimatedEPC === 'B' ? 85 : estimatedEPC === 'C' ? 75 : estimatedEPC === 'D' ? 65 : estimatedEPC === 'E' ? 55 : estimatedEPC === 'F' ? 45 : 35,
          epcSize: estimatedSquareFootage,
          propertyType: propertyType.charAt(0).toUpperCase() + propertyType.slice(1), // Capitalize first letter
          houseCondition: estimatedBuildYear >= 2010 ? 'Excellent' : estimatedBuildYear >= 2000 ? 'Very Good' : estimatedBuildYear >= 1980 ? 'Good' : estimatedBuildYear >= 1960 ? 'Fair' : 'Poor',
          squareFootage: estimatedSquareFootage,
          buildYear: estimatedBuildYear,
          tenure: 'Freehold', // Most UK properties are freehold
          hasGarage: Math.random() > 0.4, // 60% chance
          hasGarden: Math.random() > 0.2, // 80% chance
          hasParking: Math.random() > 0.3, // 70% chance
          dataSource: 'intelligent_estimation' // Mark as intelligent estimation
        };
        
        console.log('Generated intelligent fallback property data:', enhancedPropertyData);
        console.log('Data source: Intelligent estimation based on postcode area and property characteristics');
      }
      
      // Try to get real EPC data from EPC Register API (requires authentication)
      if (postcode && !enhancedPropertyData?.epcRating) {
        try {
          console.log('Attempting to fetch real EPC data from EPC Register API...');
          
          // Note: EPC Register API requires authentication
          // You'll need to register at https://epc.opendatacommunities.org/
          // and add your API key to .env as EPC_API_KEY
          const epcApiKey = process.env.EPC_API_KEY;
          
          if (epcApiKey) {
            const epcResponse = await fetch(`https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}&size=1`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${epcApiKey}`
              }
            });
            
            if (epcResponse.ok) {
              const epcResult = await epcResponse.json();
              console.log('EPC API response:', epcResult);
              
              if (epcResult.rows && epcResult.rows.length > 0) {
                const epc = epcResult.rows[0];
                const realEpcData = {
                  epcRating: epc.current_energy_rating || epc.energy_rating,
                  epcScore: epc.current_energy_efficiency || epc.energy_efficiency,
                  epcSize: epc.total_floor_area || epc.floor_area,
                  buildYear: epc.construction_year || epc.year_built,
                  propertyType: epc.property_type || epc.building_type,
                  tenure: epc.tenure || epc.ownership
                };
                
                // Merge with existing data, prioritizing real EPC data
                enhancedPropertyData = {
                  ...enhancedPropertyData,
                  ...realEpcData,
                  dataSource: 'epc_api' // Mark as real EPC data
                };
                
                console.log('Real EPC data successfully integrated:', realEpcData);
                console.log('Combined enhanced property data:', enhancedPropertyData);
              } else {
                console.log('No EPC data found for this postcode');
              }
            } else {
              console.log('EPC API request failed:', epcResponse.status, epcResponse.statusText);
            }
          } else {
            console.log('EPC API key not configured. To get real EPC data:');
            console.log('1. Register at https://epc.opendatacommunities.org/');
            console.log('2. Add your API key to .env as EPC_API_KEY');
            console.log('3. Restart the application');
          }
        } catch (epcError) {
          console.log('EPC API request failed:', epcError instanceof Error ? epcError.message : 'Unknown error');
        }
      }
      
      // Check if we have manual property inputs from the frontend
      // These would come from the user filling in the property characteristics fields
      const manualPropertyInputs = {
        propertyType: null, // Will be passed from frontend
        propertyCondition: null, // Will be passed from frontend
        buildYear: null, // Will be passed from frontend
        epcRating: null, // Will be passed from frontend
        squareFootage: null, // Will be passed from frontend
        hasGarage: null, // Will be passed from frontend
        hasGarden: null, // Will be passed from frontend
        hasParking: null // Will be passed from frontend
      };
      
      console.log('Manual property inputs available:', manualPropertyInputs);
    } catch (error) {
      console.log('No enhanced property data available');
    }

    // 3. Get rental estimation data using Postcodes.io region data
    let monthlyRent = null;
    let annualGrowth = 3; // Default 3%
    
    if (region) {
      const regionalRates = getRegionalRates(region);
      if (regionalRates) {
        monthlyRent = regionalRates.rentalPerBedroom * bedrooms;
        annualGrowth = regionalRates.annualGrowth || 3;
      }
    } else {
      // Fallback to postcode area if region not available
      const postcodeArea = postcode?.substring(0, 2).toUpperCase();
      const regionalRates = getRegionalRates(postcodeArea);
      if (regionalRates) {
        monthlyRent = regionalRates.rentalPerBedroom * bedrooms;
        annualGrowth = regionalRates.annualGrowth || 3;
      }
    }

    // 4. Get HPI growth data for the region from Postcodes.io data
    if (region) {
      try {
        const hpiResponse = await esClient.search({
          index: 'house_price_index',
          size: 2,
          query: { term: { region: region } },
          sort: [{ date: { order: 'desc' } }]
        });

        if (hpiResponse.hits.hits.length >= 2) {
          const latest = hpiResponse.hits.hits[0]._source;
          const previous = hpiResponse.hits.hits[1]._source;
          
          const latestDoc = latest as HPIDocument;
          const previousDoc = previous as HPIDocument;
          if (latestDoc.hpi_index && previousDoc.hpi_index) {
            const growth = ((latestDoc.hpi_index - previousDoc.hpi_index) / previousDoc.hpi_index) * 100;
            annualGrowth = Math.round(growth * 100) / 100; // Round to 2 decimal places
          }
        }
      } catch (error) {
        console.log('Using default growth rate');
      }
    }

    // 5. Calculate estimated value - more dynamic based on region and property type
    let estimatedValue = null;
    if (soldProperties.length > 0) {
      // Use average of sold properties
      const avgPrice = soldProperties.reduce((sum, prop) => sum + prop.price, 0) / soldProperties.length;
      estimatedValue = Math.round(avgPrice);
      console.log('Using sold properties average:', { avgPrice, estimatedValue, soldPropertiesCount: soldProperties.length });
    } else {
      // More sophisticated fallback based on region and property characteristics
      let basePricePerBedroom = 80000; // Default fallback
      
      if (region) {
        // Use regional data to estimate property values
        const regionalRates = getRegionalRates(region);
        if (regionalRates) {
          // Estimate property value based on rental yield (typically 4-6% for BTL)
          const estimatedRentalYield = 0.05; // 5% average
          const annualRent = regionalRates.rentalPerBedroom * bedrooms * 12;
          estimatedValue = Math.round(annualRent / estimatedRentalYield);
        } else {
          // Fallback to regional averages
          switch (region) {
            case 'London':
              basePricePerBedroom = 120000;
              break;
            case 'South East':
              basePricePerBedroom = 90000;
              break;
            case 'East of England':
              basePricePerBedroom = 85000;
              break;
            case 'South West':
              basePricePerBedroom = 80000;
              break;
            case 'West Midlands':
              basePricePerBedroom = 75000;
              break;
            case 'East Midlands':
              basePricePerBedroom = 75000;
              break;
            case 'North West':
              basePricePerBedroom = 70000;
              break;
            case 'Yorkshire and The Humber':
              basePricePerBedroom = 68000;
              break;
            case 'North East':
              basePricePerBedroom = 65000;
              break;
            case 'Scotland':
              basePricePerBedroom = 70000;
              break;
            case 'Wales':
              basePricePerBedroom = 75000;
              break;
            case 'Northern Ireland':
              basePricePerBedroom = 65000;
              break;
            default:
              basePricePerBedroom = 80000;
          }
          estimatedValue = bedrooms * basePricePerBedroom;
        }
      } else {
        // Fallback to postcode area if region not available
        const postcodeArea = postcode?.substring(0, 2).toUpperCase();
        switch (postcodeArea) {
          case 'N': // London
            basePricePerBedroom = 120000;
            break;
          case 'E': // East of England
            basePricePerBedroom = 85000;
            break;
          case 'W': // Wales
            basePricePerBedroom = 75000;
            break;
          case 'G': // Glasgow
            basePricePerBedroom = 70000;
            break;
          case 'L': // Liverpool
            basePricePerBedroom = 70000;
            break;
          case 'M': // Manchester
            basePricePerBedroom = 75000;
            break;
          case 'B': // Birmingham
            basePricePerBedroom = 75000;
            break;
          case 'S': // Sheffield
            basePricePerBedroom = 68000;
            break;
          default:
            basePricePerBedroom = 80000;
        }
        estimatedValue = bedrooms * basePricePerBedroom;
      }
      
            // Adjust for property type (use manual input first, then enhanced data, then fallback)
      const finalPropertyType = manualPropertyType || enhancedPropertyData?.propertyType || propertyType;
      if (finalPropertyType && finalPropertyType !== 'Unknown') {
        switch (finalPropertyType.toLowerCase()) {
          case 'detached':
            estimatedValue = Math.round(estimatedValue * 1.2);
            break;
          case 'semi-detached':
            estimatedValue = Math.round(estimatedValue * 1.1);
            break;
          case 'terraced':
            estimatedValue = Math.round(estimatedValue * 0.95);
            break;
          case 'flat':
          case 'apartment':
            estimatedValue = Math.round(estimatedValue * 0.9);
            break;
        }
      }
      
      // Adjust for square footage using manual input first, then enhanced data
      const actualSqFt = manualSquareFootage || enhancedPropertyData?.squareFootage;
      if (actualSqFt && actualSqFt > 0) {
        const avgSqFtPerBedroom = 150; // Average UK bedroom size
        const expectedSqFt = bedrooms * avgSqFtPerBedroom;
        const sizeMultiplier = actualSqFt / expectedSqFt;
        
        if (sizeMultiplier > 1.3) {
          estimatedValue = Math.round(estimatedValue * 1.15); // Significantly larger
        } else if (sizeMultiplier > 1.1) {
          estimatedValue = Math.round(estimatedValue * 1.1); // Larger than average
        } else if (sizeMultiplier < 0.7) {
          estimatedValue = Math.round(estimatedValue * 0.85); // Significantly smaller
        } else if (sizeMultiplier < 0.9) {
          estimatedValue = Math.round(estimatedValue * 0.9); // Smaller than average
        }
        
        console.log('Square footage adjustment:', { actualSqFt, expectedSqFt, sizeMultiplier, adjustedValue: estimatedValue });
      }
      
      // Adjust for EPC rating (use manual input first, then enhanced data)
      const finalEpcRating = manualEpcRating || enhancedPropertyData?.epcRating;
      if (finalEpcRating) {
        const epcMultipliers = {
          'A': 1.08,  // +8% for excellent energy efficiency
          'B': 1.05,  // +5% for very good
          'C': 1.02,  // +2% for good
          'D': 1.0,   // No adjustment for average
          'E': 0.98,  // -2% for below average
          'F': 0.95,  // -5% for poor
          'G': 0.92   // -8% for very poor
        };
        
        const epcMultiplier = epcMultipliers[finalEpcRating as keyof typeof epcMultipliers] || 1.0;
        estimatedValue = Math.round(estimatedValue * epcMultiplier);
        
        console.log('EPC rating adjustment:', { epcRating: finalEpcRating, epcMultiplier, adjustedValue: estimatedValue });
      }
      
      // Adjust for house condition (use manual input first, then enhanced data)
      const finalHouseCondition = manualPropertyCondition || enhancedPropertyData?.houseCondition;
      if (finalHouseCondition) {
        const conditionMultipliers = {
          'excellent': 1.1,    // +10% for excellent condition
          'very good': 1.05,   // +5% for very good
          'good': 1.02,        // +2% for good
          'fair': 1.0,         // No adjustment for fair
          'poor': 0.95,        // -5% for poor
          'very poor': 0.9,    // -10% for very poor
          'needs work': 0.85   // -15% for properties needing work
        };
        
        const conditionMultiplier = conditionMultipliers[finalHouseCondition.toLowerCase() as keyof typeof conditionMultipliers] || 1.0;
        estimatedValue = Math.round(estimatedValue * conditionMultiplier);
        
        console.log('House condition adjustment:', { houseCondition: finalHouseCondition, conditionMultiplier, adjustedValue: estimatedValue });
      }
      
      // Adjust for build year (use manual input first, then enhanced data)
      const finalBuildYear = manualBuildYear || enhancedPropertyData?.buildYear;
      if (finalBuildYear) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - finalBuildYear;
        
        if (age <= 5) {
          estimatedValue = Math.round(estimatedValue * 1.05); // +5% for very new
        } else if (age <= 15) {
          estimatedValue = Math.round(estimatedValue * 1.03); // +3% for relatively new
        } else if (age >= 100) {
          estimatedValue = Math.round(estimatedValue * 1.02); // +2% for period properties
        }
        
        console.log('Build year adjustment:', { buildYear: finalBuildYear, age, adjustedValue: estimatedValue });
      }
    }
    
    console.log('Estimated value calculation:', { 
      region, 
      propertyType, 
      bedrooms, 
      estimatedValue, 
      soldPropertiesCount: soldProperties.length,
      postcodeData: !!postcodeData,
      enhancedPropertyData: enhancedPropertyData ? {
        epcRating: enhancedPropertyData.epcRating,
        propertyType: enhancedPropertyData.propertyType,
        squareFootage: enhancedPropertyData.squareFootage,
        houseCondition: enhancedPropertyData.houseCondition,
        buildYear: enhancedPropertyData.buildYear
      } : null,
      manualInputs: {
        propertyType: manualPropertyType,
        propertyCondition: manualPropertyCondition,
        buildYear: manualBuildYear,
        epcRating: manualEpcRating,
        squareFootage: manualSquareFootage
      }
    });
    
    if (!monthlyRent) {
      monthlyRent = bedrooms * 500; // £500 per bedroom as fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        soldProperties,
        estimatedValue: Math.round(estimatedValue),
        monthlyRent: Math.round(monthlyRent),
        annualGrowth: Math.round(annualGrowth * 100) / 100,
        confidence,
        source: 'API',
        lastUpdated: new Date().toISOString(),
        postcodeInfo: postcodeData ? {
          region: postcodeData.region,
          adminDistrict: postcodeData.admin_district,
          adminWard: postcodeData.admin_ward,
          parish: postcodeData.parish,
          latitude: postcodeData.latitude,
          longitude: postcodeData.longitude
        } : null,
              enhancedPropertyData: enhancedPropertyData ? {
        epcRating: enhancedPropertyData.epcRating,
        epcScore: enhancedPropertyData.epcScore,
        epcSize: enhancedPropertyData.epcSize,
        propertyType: enhancedPropertyData.propertyType,
        houseCondition: enhancedPropertyData.houseCondition,
        squareFootage: enhancedPropertyData.squareFootage,
        buildYear: enhancedPropertyData.buildYear,
        tenure: enhancedPropertyData.tenure,
        hasGarage: enhancedPropertyData.hasGarage,
        hasGarden: enhancedPropertyData.hasGarden,
        hasParking: enhancedPropertyData.hasParking,
        dataSource: enhancedPropertyData.dataSource || 'intelligent_estimation' // 'epc_api', 'elasticsearch', 'intelligent_estimation'
      } : null
      }
    });

  } catch (error) {
    console.error('Deal calculator data error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deal calculator data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Regional data helper functions - now using actual UK regions from Postcodes.io
function getRegionalRates(region: string) {
  const regionalRates: { [key: string]: { rentalPerBedroom: number; annualGrowth: number } } = {
    // England Regions
    'North East': { rentalPerBedroom: 420, annualGrowth: 2.1 },
    'North West': { rentalPerBedroom: 480, annualGrowth: 3.2 },
    'Yorkshire and The Humber': { rentalPerBedroom: 450, annualGrowth: 2.8 },
    'East Midlands': { rentalPerBedroom: 480, annualGrowth: 3.0 },
    'West Midlands': { rentalPerBedroom: 460, annualGrowth: 2.9 },
    'East of England': { rentalPerBedroom: 520, annualGrowth: 3.5 },
    'London': { rentalPerBedroom: 1200, annualGrowth: 4.2 },
    'South East': { rentalPerBedroom: 680, annualGrowth: 3.8 },
    'South West': { rentalPerBedroom: 520, annualGrowth: 3.1 },
    
    // Scotland
    'Scotland': { rentalPerBedroom: 480, annualGrowth: 2.7 },
    
    // Wales
    'Wales': { rentalPerBedroom: 520, annualGrowth: 2.9 },
    
    // Northern Ireland
    'Northern Ireland': { rentalPerBedroom: 450, annualGrowth: 2.5 },
    
    // Fallback for postcode areas if region not found
    'L': { rentalPerBedroom: 450, annualGrowth: 2.5 }, // Liverpool
    'M': { rentalPerBedroom: 500, annualGrowth: 3.2 }, // Manchester
    'B': { rentalPerBedroom: 480, annualGrowth: 2.8 }, // Birmingham
    'S': { rentalPerBedroom: 420, annualGrowth: 2.1 }, // Sheffield
    'N': { rentalPerBedroom: 1200, annualGrowth: 4.5 }, // London
    'E': { rentalPerBedroom: 700, annualGrowth: 3.8 }, // East of England
    'W': { rentalPerBedroom: 520, annualGrowth: 2.9 }, // Wales
    'G': { rentalPerBedroom: 480, annualGrowth: 2.7 }  // Glasgow
  };

  return regionalRates[region] || { rentalPerBedroom: 500, annualGrowth: 3.0 };
}
