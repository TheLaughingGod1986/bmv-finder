import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

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

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode parameter is required' },
        { status: 400 }
      );
    }

    // Extract postcode area (first part before space)
    const postcodeArea = postcode.split(' ')[0];

    console.log(`Fetching planning authority data for postcode area: ${postcodeArea}`);

    // Search for planning authority data
    const response = await esClient.search({
      index: 'planning-authority-data',
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  postcode_area: postcodeArea
                }
              }
            ]
          }
        },
        size: 1
      }
    });

    if (response.hits.hits.length === 0) {
      // Return mock data if no planning authority data found
      const mockData = {
        postcode_area: postcodeArea,
        local_authority: {
          council_tax_band: 'D',
          planning_zone: 'Residential',
          conservation_area: false,
          listed_building: false,
          flood_risk: 'Very Low',
          transport_score: 7,
          school_score: 6,
          amenity_score: 8
        },
        transport: {
          nearest_tube: {
            station: 'Nearest Tube Station',
            distance_meters: 800,
            lines: ['Central', 'Piccadilly'],
            frequency_minutes: 5
          },
          nearest_train: {
            station: 'Nearest Train Station',
            distance_meters: 1200,
            lines: ['Main Line'],
            frequency_minutes: 15
          },
          nearest_bus: {
            stops: ['Bus Stop 1', 'Bus Stop 2'],
            distance_meters: 200,
            routes: ['Route 1', 'Route 2'],
            frequency_minutes: 10
          }
        },
        schools: [
          {
            name: 'Local Primary School',
            distance_meters: 500,
            ofsted_rating: 'Good',
            type: 'Primary',
            age_range: '4-11'
          },
          {
            name: 'Local Secondary School',
            distance_meters: 1200,
            ofsted_rating: 'Outstanding',
            type: 'Secondary',
            age_range: '11-18'
          }
        ],
        amenities: {
          supermarkets: [
            {
              name: 'Local Supermarket',
              distance_meters: 300
            }
          ],
          restaurants: [
            {
              name: 'Local Restaurant',
              distance_meters: 400,
              rating: 4.2
            }
          ],
          parks: [
            {
              name: 'Local Park',
              distance_meters: 600
            }
          ]
        },
        market_metrics: {
          avg_days_on_market: 45,
          price_reduction_rate: 0.15,
          market_sentiment: 'positive',
          demand_score: 7,
          supply_score: 6,
          price_trend: 'increasing',
          rental_yield: 4.2,
          capital_growth_rate: 3.5
        },
        recent_activity: {
          properties_sold_last_month: 12,
          properties_listed_last_month: 8,
          avg_price_per_sqm: getRegionalPricePerSqm(postcodeArea),
          price_volatility: 'low'
        }
      };

      return NextResponse.json({
        success: true,
        data: mockData,
        message: 'Mock planning authority data returned'
      });
    }

    const planningData = response.hits.hits[0]._source;

    return NextResponse.json({
      success: true,
      data: planningData,
      message: 'Planning authority data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching planning authority data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch planning authority data' },
      { status: 500 }
    );
  }
} 