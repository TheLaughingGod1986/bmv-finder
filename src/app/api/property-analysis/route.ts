import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

// Function to get realistic price per m² based on postcode area
function getRegionalPricePerSqm(postcodeArea: string): number {
  const area = postcodeArea.toUpperCase();
  
  // London areas (high prices)
  if (['SW1', 'SW2', 'SW3', 'SW4', 'SW5', 'SW6', 'SW7', 'SW8', 'SW9', 'SW10', 'SW11', 'SW12', 'SW13', 'SW14', 'SW15', 'SW16', 'SW17', 'SW18', 'SW19', 'SW20',
       'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14',
       'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18', 'E19', 'E20',
       'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20', 'N21', 'N22',
       'SE1', 'SE2', 'SE3', 'SE4', 'SE5', 'SE6', 'SE7', 'SE8', 'SE9', 'SE10', 'SE11', 'SE12', 'SE13', 'SE14', 'SE15', 'SE16', 'SE17', 'SE18', 'SE19', 'SE20', 'SE21', 'SE22', 'SE23', 'SE24', 'SE25', 'SE26', 'SE27', 'SE28',
       'EC1', 'EC2', 'EC3', 'EC4',
       'WC1', 'WC2'].includes(area)) {
    return 8500; // London average
  }
  
  // Major cities (medium-high prices)
  if (['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27', 'M28', 'M29', 'M30', 'M31', 'M32', 'M33', 'M34', 'M35', 'M36', 'M37', 'M38', 'M39', 'M40', 'M41', 'M42', 'M43', 'M44', 'M45', 'M46', 'M47', 'M48', 'M49', 'M50', 'M51', 'M52', 'M53', 'M54', 'M55', 'M56', 'M57', 'M58', 'M59', 'M60', 'M61', 'M62', 'M63', 'M64', 'M65', 'M66', 'M67', 'M68', 'M69', 'M70', 'M71', 'M72', 'M73', 'M74', 'M75', 'M76', 'M77', 'M78', 'M79', 'M80', 'M81', 'M82', 'M83', 'M84', 'M85', 'M86', 'M87', 'M88', 'M89', 'M90', 'M91', 'M92', 'M93', 'M94', 'M95', 'M96', 'M97', 'M98', 'M99'].includes(area)) {
    return 3200; // Manchester average
  }
  
  if (['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36', 'B37', 'B38', 'B39', 'B40', 'B41', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B50', 'B51', 'B52', 'B53', 'B54', 'B55', 'B56', 'B57', 'B58', 'B59', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B72', 'B73', 'B74', 'B75', 'B76', 'B77', 'B78', 'B79', 'B80', 'B81', 'B82', 'B83', 'B84', 'B85', 'B86', 'B87', 'B88', 'B89', 'B90', 'B91', 'B92', 'B93', 'B94', 'B95', 'B96', 'B97', 'B98', 'B99'].includes(area)) {
    return 2800; // Birmingham average
  }
  
  if (['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L25', 'L26', 'L27', 'L28', 'L29', 'L30', 'L31', 'L32', 'L33', 'L34', 'L35', 'L36', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42', 'L43', 'L44', 'L45', 'L46', 'L47', 'L48', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60', 'L61', 'L62', 'L63', 'L64', 'L65', 'L66', 'L67', 'L68', 'L69', 'L70', 'L71', 'L72', 'L73', 'L74', 'L75', 'L76', 'L77', 'L78', 'L79', 'L80', 'L81', 'L82', 'L83', 'L84', 'L85', 'L86', 'L87', 'L88', 'L89', 'L90', 'L91', 'L92', 'L93', 'L94', 'L95', 'L96', 'L97', 'L98', 'L99'].includes(area)) {
    return 2500; // Liverpool average
  }
  
  if (['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'LS10', 'LS11', 'LS12', 'LS13', 'LS14', 'LS15', 'LS16', 'LS17', 'LS18', 'LS19', 'LS20', 'LS21', 'LS22', 'LS23', 'LS24', 'LS25', 'LS26', 'LS27', 'LS28', 'LS29'].includes(area)) {
    return 2600; // Leeds average
  }
  
  // North East (Newcastle, Sunderland, etc.) - much lower prices
  if (['NE1', 'NE2', 'NE3', 'NE4', 'NE5', 'NE6', 'NE7', 'NE8', 'NE9', 'NE10', 'NE11', 'NE12', 'NE13', 'NE14', 'NE15', 'NE16', 'NE17', 'NE18', 'NE19', 'NE20', 'NE21', 'NE22', 'NE23', 'NE24', 'NE25', 'NE26', 'NE27', 'NE28', 'NE29', 'NE30', 'NE31', 'NE32', 'NE33', 'NE34', 'NE35', 'NE36', 'NE37', 'NE38', 'NE39', 'NE40', 'NE41', 'NE42', 'NE43', 'NE44', 'NE45', 'NE46', 'NE47', 'NE48', 'NE49', 'NE50', 'NE51', 'NE52', 'NE53', 'NE54', 'NE55', 'NE56', 'NE57', 'NE58', 'NE59', 'NE60', 'NE61', 'NE62', 'NE63', 'NE64', 'NE65', 'NE66', 'NE67', 'NE68', 'NE69', 'NE70', 'NE71', 'NE72', 'NE73', 'NE74', 'NE75', 'NE76', 'NE77', 'NE78', 'NE79', 'NE80', 'NE81', 'NE82', 'NE83', 'NE84', 'NE85', 'NE86', 'NE87', 'NE88', 'NE89', 'NE90', 'NE91', 'NE92', 'NE93', 'NE94', 'NE95', 'NE96', 'NE97', 'NE98', 'NE99'].includes(area)) {
    return 1800; // Newcastle/North East average
  }
  
  if (['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'SR8', 'SR9'].includes(area)) {
    return 1600; // Sunderland average
  }
  
  if (['DH1', 'DH2', 'DH3', 'DH4', 'DH5', 'DH6', 'DH7', 'DH8', 'DH9'].includes(area)) {
    return 1700; // Durham average
  }
  
  // Scotland
  if (['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21', 'G22', 'G23', 'G24', 'G25', 'G26', 'G27', 'G28', 'G29', 'G30', 'G31', 'G32', 'G33', 'G34', 'G35', 'G36', 'G37', 'G38', 'G39', 'G40', 'G41', 'G42', 'G43', 'G44', 'G45', 'G46', 'G47', 'G48', 'G49', 'G50', 'G51', 'G52', 'G53', 'G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'G60', 'G61', 'G62', 'G63', 'G64', 'G65', 'G66', 'G67', 'G68', 'G69', 'G70', 'G71', 'G72', 'G73', 'G74', 'G75', 'G76', 'G77', 'G78', 'G79', 'G80', 'G81', 'G82', 'G83', 'G84', 'G85', 'G86', 'G87', 'G88', 'G89', 'G90', 'G91', 'G92', 'G93', 'G94', 'G95', 'G96', 'G97', 'G98', 'G99'].includes(area)) {
    return 2200; // Glasgow average
  }
  
  if (['EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16', 'EH17', 'EH18', 'EH19', 'EH20', 'EH21', 'EH22', 'EH23', 'EH24', 'EH25', 'EH26', 'EH27', 'EH28', 'EH29', 'EH30', 'EH31', 'EH32', 'EH33', 'EH34', 'EH35', 'EH36', 'EH37', 'EH38', 'EH39', 'EH40', 'EH41', 'EH42', 'EH43', 'EH44', 'EH45', 'EH46', 'EH47', 'EH48', 'EH49', 'EH50', 'EH51', 'EH52', 'EH53', 'EH54', 'EH55', 'EH56', 'EH57', 'EH58', 'EH59', 'EH60', 'EH61', 'EH62', 'EH63', 'EH64', 'EH65', 'EH66', 'EH67', 'EH68', 'EH69', 'EH70', 'EH71', 'EH72', 'EH73', 'EH74', 'EH75', 'EH76', 'EH77', 'EH78', 'EH79', 'EH80', 'EH81', 'EH82', 'EH83', 'EH84', 'EH85', 'EH86', 'EH87', 'EH88', 'EH89', 'EH90', 'EH91', 'EH92', 'EH93', 'EH94', 'EH95', 'EH96', 'EH97', 'EH98', 'EH99'].includes(area)) {
    return 2800; // Edinburgh average
  }
  
  // Wales
  if (['CF1', 'CF2', 'CF3', 'CF4', 'CF5', 'CF6', 'CF7', 'CF8', 'CF9', 'CF10', 'CF11', 'CF12', 'CF13', 'CF14', 'CF15', 'CF16', 'CF17', 'CF18', 'CF19', 'CF20', 'CF21', 'CF22', 'CF23', 'CF24', 'CF25', 'CF26', 'CF27', 'CF28', 'CF29', 'CF30', 'CF31', 'CF32', 'CF33', 'CF34', 'CF35', 'CF36', 'CF37', 'CF38', 'CF39', 'CF40', 'CF41', 'CF42', 'CF43', 'CF44', 'CF45', 'CF46', 'CF47', 'CF48', 'CF49', 'CF50', 'CF51', 'CF52', 'CF53', 'CF54', 'CF55', 'CF56', 'CF57', 'CF58', 'CF59', 'CF60', 'CF61', 'CF62', 'CF63', 'CF64', 'CF65', 'CF66', 'CF67', 'CF68', 'CF69', 'CF70', 'CF71', 'CF72', 'CF73', 'CF74', 'CF75', 'CF76', 'CF77', 'CF78', 'CF79', 'CF80', 'CF81', 'CF82', 'CF83', 'CF84', 'CF85', 'CF86', 'CF87', 'CF88', 'CF89', 'CF90', 'CF91', 'CF92', 'CF93', 'CF94', 'CF95', 'CF96', 'CF97', 'CF98', 'CF99'].includes(area)) {
    return 2400; // Cardiff average
  }
  
  // Default fallback for other areas
  return 2200;
}

interface PropertyEnrichmentData {
  address: string;
  bedrooms: number | null;
  epc_rating: string | null;
  floor_area_m2: number | null;
  property_type: string | null;
  construction_year?: string;
  current_energy_rating?: string;
  potential_energy_rating?: string;
  epc_date?: string;
  certificate_id?: string;
}

interface SoldPriceData {
  price: number;
  date: string;
  property_type: string;
  new_build: boolean;
  estate_type: string;
  transaction_type: string;
}

interface HPIData {
  date: string;
  hpi_value: number;
  hpi_change: number;
  region: string;
}

interface DealAnalysis {
  property_info: PropertyEnrichmentData | null;
  sold_prices: SoldPriceData[];
  hpi_data: HPIData[];
  deal_metrics: {
    last_sold_price: number | null;
    hpi_adjusted_value: number | null;
    current_value_estimate: number | null;
    price_per_sqm: number | null;
    price_per_bedroom: number | null;
    deal_score: number; // 0-100, higher = better deal
    deal_rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Overpriced';
    analysis: string[];
  };
  market_insights: {
    average_price_per_sqm: number | null;
    average_price_per_bedroom: number | null;
    price_trend: 'rising' | 'falling' | 'stable';
    market_volatility: 'low' | 'medium' | 'high';
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode || !number) {
      return NextResponse.json(
        { error: 'Postcode and house number are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting comprehensive property analysis:', { postcode, number });

    // 1. Get property enrichment data
    const propertyData = await getPropertyEnrichmentData(postcode, number);
    console.log('✅ Property enrichment data:', propertyData ? 'Found' : 'Not found');

    // 2. Get sold prices for the property
    const soldPrices = await getSoldPrices(postcode, number);
    console.log('✅ Sold prices found:', soldPrices.length);

    // 3. Get HPI data for the area
    const hpiData = await getHPIData(postcode);
    console.log('✅ HPI data found:', hpiData.length);

    // 4. Get market insights for comparison
    const marketInsights = await getMarketInsights(postcode, propertyData);

    // 5. Calculate deal analysis
    const dealAnalysis = calculateDealAnalysis(
      propertyData,
      soldPrices,
      hpiData,
      marketInsights
    );

    const response: DealAnalysis = {
      property_info: propertyData,
      sold_prices: soldPrices,
      hpi_data: hpiData,
      deal_metrics: dealAnalysis.deal_metrics,
      market_insights: dealAnalysis.market_insights
    };

    console.log('🎯 Deal analysis completed:', {
      deal_score: dealAnalysis.deal_metrics.deal_score,
      deal_rating: dealAnalysis.deal_metrics.deal_rating
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Property analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze property', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get property enrichment data from the enrichment service
 */
async function getPropertyEnrichmentData(postcode: string, number: string): Promise<PropertyEnrichmentData | null> {
  try {
    const enrichmentServiceUrl = process.env.PROPERTY_ENRICHMENT_SERVICE_URL || 'http://localhost:3002';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(
      `${enrichmentServiceUrl}/api/property-info?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('Property enrichment service returned:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Property enrichment service error:', error);
    return null;
  }
}

/**
 * Get sold prices for the specific property
 */
async function getSoldPrices(postcode: string, number: string): Promise<SoldPriceData[]> {
  try {
    // Keep the original postcode format (with spaces) as that's how it's stored
    const normalizedPostcode = postcode.toUpperCase();
    const normalizedNumber = number.trim().toLowerCase();

    console.log(`🔍 Searching for sold prices: postcode="${normalizedPostcode}", number="${normalizedNumber}"`);

    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { term: { postcode: normalizedPostcode } },
              { term: { paon: normalizedNumber } }
            ]
          }
        },
        sort: [{ dateOfTransfer: { order: 'desc' } }],
        size: 10
      }
    });

    console.log(`✅ Found ${response.hits.hits.length} sold prices for ${normalizedNumber} ${normalizedPostcode}`);

    return response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        price: source.price,
        date: source.dateOfTransfer,
        property_type: source.propertyType,
        new_build: source.old_new === 'Y',
        estate_type: source.transactionCategory,
        transaction_type: source.transactionCategory
      };
    });
  } catch (error) {
    console.error('Error fetching sold prices:', error);
    return [];
  }
}

/**
 * Get HPI data for the area
 */
async function getHPIData(postcode: string): Promise<HPIData[]> {
  try {
    // Try to get region from properties index first
    const propertyResponse = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: postcode.substring(0, 4) } }
            ]
          }
        },
        size: 1
      }
    });

    let region = 'England'; // Default
    if (propertyResponse.hits.hits.length > 0) {
      const property = propertyResponse.hits.hits[0]._source as any;
      region = property.county || 'England';
    }
    
    // Map English county names to Welsh HPI region names
    const countyToHpiRegionMap: { [key: string]: string } = {
      'TYNE AND WEAR': 'north-east',
      'NORTHUMBERLAND': 'north-east',
      'DURHAM': 'north-east',
      'CLEVELAND': 'north-east',
      'GREATER LONDON': 'london',
      'GREATER MANCHESTER': 'gorllewin-canolbarth-lloegr',
      'WEST MIDLANDS': 'gorllewin-canolbarth-lloegr',
      'WEST YORKSHIRE': 'yorkshire-and-the-humber',
      'KENT': 'de-orllewin-lloegr',
      'ESSEX': 'de-orllewin-lloegr',
      'HAMPSHIRE': 'de-orllewin-lloegr',
      'LANCASHIRE': 'gorllewin-canolbarth-lloegr',
      'SURREY': 'de-orllewin-lloegr',
      'MERSEYSIDE': 'gorllewin-canolbarth-lloegr',
      'NORTH YORKSHIRE': 'yorkshire-and-the-humber',
      'SOUTH YORKSHIRE': 'yorkshire-and-the-humber',
      'EAST YORKSHIRE': 'yorkshire-and-the-humber',
      'LINCOLNSHIRE': 'east-midlands',
      'NOTTINGHAMSHIRE': 'east-midlands',
      'DERBYSHIRE': 'east-midlands',
      'LEICESTERSHIRE': 'east-midlands',
      'NORTHAMPTONSHIRE': 'east-midlands',
      'CAMBRIDGESHIRE': 'east-of-england',
      'BEDFORDSHIRE': 'east-of-england'
    };

    // Get the correct HPI region name
    const hpiRegion = countyToHpiRegionMap[region] || region.toLowerCase().replace(/\s+/g, '-');
    
    console.log(`📊 Fetching HPI data for region: ${region} -> ${hpiRegion}`);
    
    const response = await esClient.search({
      index: 'house_price_index',
      body: {
        query: {
          bool: {
            should: [
              { term: { region: hpiRegion } },
              { term: { regionLabel: region } },
              { term: { region: 'england' } } // Fallback to England
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }],
        size: 600 // Last 50 years of monthly data to cover historical sales
      }
    });

    console.log(`✅ Found ${response.hits.hits.length} HPI data points`);

    return response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        date: source.date,
        hpi_value: source.hpiIndex,
        hpi_change: source.percentageChangeMonthly || 0,
        region: source.regionLabel
      };
    });
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

/**
 * Get market insights for comparison
 */
async function getMarketInsights(postcode: string, propertyData: PropertyEnrichmentData | null) {
  try {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const postcodePrefix = normalizedPostcode.substring(0, 4);

    // Get recent sales in the same postcode area
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: postcodePrefix } },
              { range: { dateOfTransfer: { gte: 'now-1y' } } }
            ],
            filter: propertyData?.property_type ? [
              { term: { propertyType: propertyData.property_type } }
            ] : []
          }
        },
        size: 100
      }
    });

    const sales = response.hits.hits.map(hit => hit._source as any);
    
    // Calculate averages
    const prices = sales.map(sale => sale.price);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

    // Calculate price per sqm if we have floor area data
    let averagePricePerSqm = null;
    if (propertyData?.floor_area_m2) {
      const pricesPerSqm = sales
        .filter(sale => sale.floor_area_m2)
        .map(sale => sale.price / sale.floor_area_m2);
      
      if (pricesPerSqm.length > 0) {
        averagePricePerSqm = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
      }
    }
    
    // Fallback to regional pricing if no sales data available
    if (!averagePricePerSqm) {
      const postcodeArea = postcode.split(' ')[0];
      averagePricePerSqm = getRegionalPricePerSqm(postcodeArea);
    }

    // Calculate price per bedroom if we have bedroom data
    let averagePricePerBedroom = null;
    if (propertyData?.bedrooms) {
      const pricesPerBedroom = sales
        .filter(sale => sale.bedrooms)
        .map(sale => sale.price / sale.bedrooms);
      
      if (pricesPerBedroom.length > 0) {
        averagePricePerBedroom = pricesPerBedroom.reduce((a, b) => a + b, 0) / pricesPerBedroom.length;
      }
    }

    return {
      averagePrice,
      averagePricePerSqm,
      averagePricePerBedroom,
      salesCount: sales.length
    };
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return {
      averagePrice: null,
      averagePricePerSqm: null,
      averagePricePerBedroom: null,
      salesCount: 0
    };
  }
}

/**
 * Calculate current value estimate using multiple methods
 */
function calculateCurrentValueEstimate(
  propertyData: PropertyEnrichmentData | null,
  soldPrices: SoldPriceData[],
  hpiData: HPIData[],
  marketInsights: any
): number | null {
  const estimates: number[] = [];
  const weights: number[] = [];

  // Method 1: HPI-adjusted value (if we have sold price and HPI data)
  if (soldPrices.length > 0 && hpiData.length > 0) {
    const lastSoldPrice = soldPrices[0].price;
    const lastSoldDate = soldPrices[0].date;
    
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    
    // Find HPI data closest to sold date and current date
    const soldHPI = hpiData.find(hpi => new Date(hpi.date) >= soldDate) || hpiData[hpiData.length - 1];
    const currentHPI = hpiData[0];
    
    if (soldHPI && currentHPI) {
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      const hpiAdjustedValue = lastSoldPrice * hpiMultiplier;
      estimates.push(hpiAdjustedValue);
      weights.push(0.4); // 40% weight for HPI method
    }
  }

  // Method 2: Market average price per sqm (if we have floor area)
  if (propertyData?.floor_area_m2 && marketInsights.averagePricePerSqm) {
    const sqmEstimate = propertyData.floor_area_m2 * marketInsights.averagePricePerSqm;
    estimates.push(sqmEstimate);
    weights.push(0.3); // 30% weight for sqm method
  }

  // Method 3: Market average price per bedroom (if we have bedrooms)
  if (propertyData?.bedrooms && marketInsights.averagePricePerBedroom) {
    const bedroomEstimate = propertyData.bedrooms * marketInsights.averagePricePerBedroom;
    estimates.push(bedroomEstimate);
    weights.push(0.2); // 20% weight for bedroom method
  }

  // Method 4: Market average price (fallback)
  if (marketInsights.averagePrice) {
    estimates.push(marketInsights.averagePrice);
    weights.push(0.1); // 10% weight for market average
  }

  // Calculate weighted average
  if (estimates.length === 0) {
    return null;
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedSum = estimates.reduce((sum, estimate, index) => sum + (estimate * weights[index]), 0);
  
  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate comprehensive deal analysis
 */
function calculateDealAnalysis(
  propertyData: PropertyEnrichmentData | null,
  soldPrices: SoldPriceData[],
  hpiData: HPIData[],
  marketInsights: any
): { deal_metrics: any; market_insights: any } {
  const lastSoldPrice = soldPrices.length > 0 ? soldPrices[0].price : null;
  const lastSoldDate = soldPrices.length > 0 ? soldPrices[0].date : null;

  // Calculate HPI-adjusted value
  let hpiAdjustedValue = null;
  if (lastSoldPrice && lastSoldDate && hpiData.length > 0) {
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    
    // Filter for the specific region (prefer regional data over England)
    const regionalHPIData = hpiData.filter(hpi => hpi.region !== 'England');
    const hpiDataToUse = regionalHPIData.length > 0 ? regionalHPIData : hpiData;
    
    // Find HPI data for the exact month of sale
    const soldYearMonth = lastSoldDate.substring(0, 7); // "2024-02"
    const soldHPI = hpiDataToUse.find(hpi => hpi.date === soldYearMonth) || 
                   hpiDataToUse.find(hpi => hpi.date >= soldYearMonth) || 
                   hpiDataToUse[hpiDataToUse.length - 1];
    
    // Find current HPI data (most recent)
    const currentHPI = hpiDataToUse[0];
    
    console.log(`🔍 HPI Calculation Debug:`);
    console.log(`   Sold date: ${lastSoldDate} (${soldYearMonth})`);
    console.log(`   Sold HPI: ${soldHPI?.hpi_value} (${soldHPI?.date})`);
    console.log(`   Current HPI: ${currentHPI?.hpi_value} (${currentHPI?.date})`);
    console.log(`   Region: ${currentHPI?.region}`);
    
    if (soldHPI && currentHPI && soldHPI.date !== currentHPI.date) {
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      hpiAdjustedValue = lastSoldPrice * hpiMultiplier;
      console.log(`   HPI Multiplier: ${hpiMultiplier.toFixed(4)}`);
      console.log(`   Original Price: £${lastSoldPrice.toLocaleString()}`);
      console.log(`   HPI Adjusted Value: £${hpiAdjustedValue.toLocaleString()}`);
      console.log(`   Growth: ${((hpiMultiplier - 1) * 100).toFixed(2)}%`);
    } else {
      console.log(`   ⚠️  No HPI growth detected (same date or missing data)`);
      hpiAdjustedValue = lastSoldPrice;
    }
  }

  // Calculate current value estimate - prioritize HPI-adjusted value
  let currentValueEstimate = hpiAdjustedValue; // Use HPI-adjusted value as primary estimate
  
  // If no HPI data, fall back to other methods
  if (!currentValueEstimate) {
    currentValueEstimate = calculateCurrentValueEstimate(propertyData, soldPrices, hpiData, marketInsights);
  }

  // Calculate price per sqm and per bedroom
  const pricePerSqm = propertyData?.floor_area_m2 && lastSoldPrice 
    ? lastSoldPrice / propertyData.floor_area_m2 
    : null;
  
  const pricePerBedroom = propertyData?.bedrooms && lastSoldPrice 
    ? lastSoldPrice / propertyData.bedrooms 
    : null;

  // Calculate deal score (0-100)
  let dealScore = 50; // Start with neutral score
  const analysis: string[] = [];

  if (hpiAdjustedValue && lastSoldPrice) {
    const priceDifference = ((hpiAdjustedValue - lastSoldPrice) / hpiAdjustedValue) * 100;
    
    if (priceDifference > 20) {
      dealScore += 30;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value - excellent deal!`);
    } else if (priceDifference > 10) {
      dealScore += 20;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value - good deal`);
    } else if (priceDifference > 0) {
      dealScore += 10;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value`);
    } else if (priceDifference < -20) {
      dealScore -= 30;
      analysis.push(`Property sold ${Math.abs(priceDifference).toFixed(1)}% above HPI-adjusted value - overpaid`);
    } else if (priceDifference < -10) {
      dealScore -= 20;
      analysis.push(`Property sold ${Math.abs(priceDifference).toFixed(1)}% above HPI-adjusted value`);
    }
  }

  // Compare with market averages
  if (pricePerSqm && marketInsights.averagePricePerSqm) {
    const sqmDifference = ((marketInsights.averagePricePerSqm - pricePerSqm) / marketInsights.averagePricePerSqm) * 100;
    
    if (sqmDifference > 15) {
      dealScore += 20;
      analysis.push(`Price per sqm is ${sqmDifference.toFixed(1)}% below market average`);
    } else if (sqmDifference < -15) {
      dealScore -= 20;
      analysis.push(`Price per sqm is ${Math.abs(sqmDifference).toFixed(1)}% above market average`);
    }
  }

  if (pricePerBedroom && marketInsights.averagePricePerBedroom) {
    const bedroomDifference = ((marketInsights.averagePricePerBedroom - pricePerBedroom) / marketInsights.averagePricePerBedroom) * 100;
    
    if (bedroomDifference > 15) {
      dealScore += 15;
      analysis.push(`Price per bedroom is ${bedroomDifference.toFixed(1)}% below market average`);
    } else if (bedroomDifference < -15) {
      dealScore -= 15;
      analysis.push(`Price per bedroom is ${Math.abs(bedroomDifference).toFixed(1)}% above market average`);
    }
  }

  // Property type analysis
  if (propertyData?.property_type) {
    analysis.push(`Property type: ${propertyData.property_type}`);
  }

  // EPC rating analysis
  if (propertyData?.epc_rating) {
    const epcScore = propertyData.epc_rating.charCodeAt(0) - 65; // A=0, B=1, etc.
    if (epcScore <= 2) { // A or B rating
      dealScore += 10;
      analysis.push(`Excellent EPC rating (${propertyData.epc_rating}) - energy efficient`);
    } else if (epcScore >= 4) { // E, F, or G rating
      dealScore -= 10;
      analysis.push(`Poor EPC rating (${propertyData.epc_rating}) - may need energy improvements`);
    }
  }

  // Clamp score to 0-100
  dealScore = Math.max(0, Math.min(100, dealScore));

  // Determine deal rating
  let dealRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Overpriced';
  if (dealScore >= 80) dealRating = 'Excellent';
  else if (dealScore >= 60) dealRating = 'Good';
  else if (dealScore >= 40) dealRating = 'Fair';
  else if (dealScore >= 20) dealRating = 'Poor';
  else dealRating = 'Overpriced';

  // Market insights
  const priceTrend = hpiData.length >= 2 
    ? hpiData[0].hpi_change > 0.5 ? 'rising' 
    : hpiData[0].hpi_change < -0.5 ? 'falling' 
    : 'stable'
    : 'stable';

  const marketVolatility = hpiData.length >= 6
    ? Math.abs(hpiData.slice(0, 6).reduce((sum, hpi) => sum + hpi.hpi_change, 0)) > 5
      ? 'high'
      : Math.abs(hpiData.slice(0, 6).reduce((sum, hpi) => sum + hpi.hpi_change, 0)) > 2
        ? 'medium'
        : 'low'
    : 'medium';

  return {
    deal_metrics: {
      last_sold_price: lastSoldPrice,
      hpi_adjusted_value: hpiAdjustedValue,
      current_value_estimate: currentValueEstimate,
      price_per_sqm: pricePerSqm,
      price_per_bedroom: pricePerBedroom,
      deal_score: Math.round(dealScore),
      deal_rating: dealRating,
      analysis
    },
    market_insights: {
      average_price_per_sqm: marketInsights.averagePricePerSqm,
      average_price_per_bedroom: marketInsights.averagePricePerBedroom,
      price_trend: priceTrend,
      market_volatility: marketVolatility
    }
  };
} 