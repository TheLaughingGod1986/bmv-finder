import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    // Get the base URL for server-side fetch calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3001';
    const baseUrl = `${protocol}://${host}`;

    // Helper functions defined inside the main function
    function calculateRecommendedRent(property: any, currentValuation: number): number {
      if (!property.bedrooms || !currentValuation) return 0;
      
      // Base rental rates by region and bedrooms
      const baseRates: { [key: string]: { [key: number]: number } } = {
        'NE5': { 1: 550, 2: 750, 3: 950, 4: 1200, 5: 1450 },
        'SE3': { 1: 1200, 2: 1600, 3: 2000, 4: 2500, 5: 3000 }
      };
      
      const region = property.postcode?.substring(0, 4) || 'NE5';
      const baseRate = baseRates[region]?.[property.bedrooms] || 800;
      
      // Adjust for EPC rating
      const epcMultiplier = {
        'A': 1.15, 'B': 1.10, 'C': 1.05, 'D': 1.00,
        'E': 0.95, 'F': 0.90, 'G': 0.85
      }[property.epcRating] || 1.00;
      
      return Math.round(baseRate * epcMultiplier);
    }

    function generateEPCRecommendations(currentRating: string, potentialRating: string): any {
      if (!currentRating || !potentialRating) return null;
      
      const ratingScores = { 'A': 100, 'B': 87, 'C': 69, 'D': 55, 'E': 39, 'F': 21, 'G': 0 };
      const currentScore = ratingScores[currentRating] || 0;
      const potentialScore = ratingScores[potentialRating] || 0;
      
      const improvement = potentialScore - currentScore;
      
      if (improvement <= 0) return null;
      
      return {
        currentRating,
        potentialRating,
        improvement: improvement,
        upgradeCost: {
          min: Math.round(improvement * 100),
          max: Math.round(improvement * 300),
          average: Math.round(improvement * 200)
        },
        valueIncrease: {
          min: Math.round(improvement * 0.5),
          max: Math.round(improvement * 0.8),
          average: Math.round(improvement * 0.65)
        },
        paybackPeriod: {
          years: Math.ceil(improvement * 0.2),
          months: Math.ceil(improvement * 2.4)
        },
        priority: improvement >= 30 ? 'HIGH' : improvement >= 15 ? 'MEDIUM' : 'LOW'
      };
    }

    function calculateDiversificationScore(property: any): number {
      let score = 50; // Baseline
      
      // Property type diversification
      if (property.propertyType === 'Detached') score += 20;
      else if (property.propertyType === 'Semi-Detached') score += 15;
      else if (property.propertyType === 'Terraced') score += 10;
      else if (property.propertyType === 'Flat') score += 5;
      
      // Location diversification
      if (property.postcode?.startsWith('SE') || property.postcode?.startsWith('SW')) {
        score += 15; // London premium
      } else if (property.postcode?.startsWith('NE') || property.postcode?.startsWith('NW')) {
        score += 10; // Regional diversity
      }
      
      return Math.min(score, 100);
    }

    function calculateRiskLevel(property: any, marketPhase: string): 'LOW' | 'MEDIUM' | 'HIGH' {
      let riskScore = 0;
      
      // EPC risk
      if (property.epcRating === 'F' || property.epcRating === 'G') riskScore += 3;
      else if (property.epcRating === 'A' || property.epcRating === 'B') riskScore -= 2;
      
      // Market phase risk
      if (marketPhase === 'PEAK') riskScore += 2;
      else if (marketPhase === 'TROUGH') riskScore -= 2;
      else if (marketPhase === 'DECLINE') riskScore += 1;
      
      // Property type risk
      if (property.propertyType === 'Flat') riskScore += 1;
      else if (property.propertyType === 'Detached') riskScore -= 1;
      
      if (riskScore <= -2) return 'LOW';
      if (riskScore >= 2) return 'HIGH';
      return 'MEDIUM';
    }

    function calculateInvestmentPotential(property: any, capitalGrowth: number, grossYield: number): 'HIGH' | 'MEDIUM' | 'LOW' {
      let potentialScore = 0;
      
      // Capital growth potential
      if (capitalGrowth > 10) potentialScore += 2;
      else if (capitalGrowth > 5) potentialScore += 1;
      else if (capitalGrowth < -5) potentialScore -= 1;
      
      // Rental yield potential
      if (grossYield > 8) potentialScore += 2;
      else if (grossYield > 6) potentialScore += 1;
      else if (grossYield < 4) potentialScore -= 1;
      
      // EPC upgrade potential
      if (property.epcRating === 'F' || property.epcRating === 'G') potentialScore += 1;
      
      if (potentialScore >= 2) return 'HIGH';
      if (potentialScore <= -2) return 'LOW';
      return 'MEDIUM';
    }

    // Fetch comprehensive property data using our existing APIs
    const [propertyResponse, valuationResponse, marketTrendsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true&limit=${limit}`),
      fetch(`${baseUrl}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}`),
      fetch(`${baseUrl}/api/market-trends?postcode=${encodeURIComponent(postcode)}`)
    ]);

    if (!propertyResponse.ok || !valuationResponse.ok || !marketTrendsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch property data for discovery' },
        { status: 500 }
      );
    }

    const [propertyData, valuationData, marketTrends] = await Promise.all([
      propertyResponse.json(),
      valuationResponse.json(),
      marketTrendsResponse.json()
    ]);

    // Check if property search was successful
    if (!propertyData.success || !propertyData.data?.properties) {
      return NextResponse.json({
        success: false,
        error: 'No properties found for this postcode',
        postcode,
        suggestions: propertyData.suggestions || []
      });
    }

    // Transform properties into portfolio-ready format and deduplicate by address
    const propertyMap = new Map();
    
    // Get current market phase once for all properties
    const currentMarketPhase = marketTrends.data?.cycles?.[marketTrends.data.cycles.length - 1]?.phase || 'UNKNOWN';
    
    propertyData.data.properties.forEach((prop: any) => {
      // Find matching valuation data
      const matchingValuation = valuationData.data?.comparables?.find((comp: any) => 
        comp.address === prop.address.split(',')[0] || 
        comp.address === prop.address.split(' ')[0]
      );

      // Find matching market trend
      // const currentMarketPhase = marketTrends.data?.cycles?.[marketTrends.data.cycles.length - 1]?.phase || 'UNKNOWN';

      // Get all sales history for this property from comparables
      const propertySalesHistory = valuationData.data?.comparables?.filter((comp: any) => 
        comp.address === prop.address.split(',')[0] || 
        comp.address === prop.address.split(' ')[0]
      ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

      // Create a unique key for the property (normalized address + postcode)
      const normalizedAddress = prop.address
        .toLowerCase()
        .replace(/[,\s]+/g, ' ') // Replace commas and multiple spaces with single space
        .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
        .replace(/\s+/g, ''); // Remove all remaining spaces
      
      const propertyKey = `${normalizedAddress}_${prop.postcode.toLowerCase().replace(/\s+/g, '')}`;
      
      // Process all properties to ensure they get portfolioFit values
      if (!propertyMap.has(propertyKey)) {
        
        // Calculate investment metrics
        // Calculate investment metrics
        // For Property Discovery, use latest sale price as current valuation
        // This gives users a realistic view of what the property last sold for
        const lastSalePrice = propertySalesHistory.length > 0 ? propertySalesHistory[0].price : 0;
        const currentValuation = lastSalePrice; // Use latest sale price for discovery cards
        
        // Calculate growth based on previous sale (not most recent) for meaningful comparison
        const previousSalePrice = propertySalesHistory.length > 1 ? propertySalesHistory[1].price : lastSalePrice;
        const capitalGrowth = previousSalePrice > 0 ? ((currentValuation - previousSalePrice) / previousSalePrice) * 100 : 0;
        
        // Calculate growth from first recorded sale for long-term perspective
        const firstSalePrice = propertySalesHistory.length > 0 ? propertySalesHistory[propertySalesHistory.length - 1].price : 0;
        const longTermGrowth = firstSalePrice > 0 ? ((currentValuation - firstSalePrice) / firstSalePrice) * 100 : 0;
        
        const recommendedRent = calculateRecommendedRent(prop, currentValuation);
        const grossYield = recommendedRent > 0 ? (recommendedRent * 12 / currentValuation) * 100 : 0;

        // Calculate portfolio fit indicators with direct implementation
        let diversificationScore = 50; // Baseline
        
        // Property type diversification
        if (prop.propertyType === 'Detached') diversificationScore += 20;
        else if (prop.propertyType === 'Semi-Detached') diversificationScore += 15;
        else if (prop.propertyType === 'Terraced') diversificationScore += 10;
        else if (prop.propertyType === 'Flat') diversificationScore += 5;
        
        // Location diversification
        if (prop.postcode?.startsWith('SE') || prop.postcode?.startsWith('SW')) {
          diversificationScore += 15; // London premium
        } else if (prop.postcode?.startsWith('NE') || prop.postcode?.startsWith('NW')) {
          diversificationScore += 10; // Regional diversity
        }
        diversificationScore = Math.min(diversificationScore, 100);
        
        // Calculate risk level
        let riskScore = 0;
        if (prop.epcRating === 'F' || prop.epcRating === 'G') riskScore += 3;
        else if (prop.epcRating === 'A' || prop.epcRating === 'B') riskScore -= 2;
        
        if (currentMarketPhase === 'PEAK') riskScore += 2;
        else if (currentMarketPhase === 'TROUGH') riskScore -= 2;
        else if (currentMarketPhase === 'DECLINE') riskScore += 1;
        
        if (prop.propertyType === 'Flat') riskScore += 1;
        else if (prop.propertyType === 'Detached') riskScore -= 1;
        
        const riskLevel = riskScore <= -2 ? 'LOW' : riskScore >= 2 ? 'HIGH' : 'MEDIUM';
        
        // Calculate investment potential
        let potentialScore = 0;
        if (capitalGrowth > 10) potentialScore += 2;
        else if (capitalGrowth > 5) potentialScore += 1;
        else if (capitalGrowth < -5) potentialScore -= 1;
        
        if (grossYield > 8) potentialScore += 2;
        else if (grossYield > 6) potentialScore += 1;
        else if (grossYield < 4) potentialScore -= 1;
        
        if (prop.epcRating === 'F' || prop.epcRating === 'G') potentialScore += 1;
        
        const investmentPotential = potentialScore >= 2 ? 'HIGH' : potentialScore <= -2 ? 'LOW' : 'MEDIUM';
        
        // Debug: Log the final calculated values
        console.log('Final calculated values for', prop.address);
        console.log('diversificationScore:', diversificationScore);
        console.log('riskLevel:', riskLevel);
        console.log('investmentPotential:', investmentPotential);
        

        


        // Generate EPC recommendations
        const epcUpgrade = generateEPCRecommendations(prop.epcRating, prop.potentialEnergyRating);

        // Calculate price range from sales history
        const prices = propertySalesHistory.map((sale: any) => sale.price);
        const priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
        };

        const portfolioProperty = {
          // Basic property info
          address: prop.address,
          postcode: prop.postcode,
          propertyType: prop.propertyType || 'Unknown',
          bedrooms: prop.bedrooms || 0,
          floorArea: prop.floorArea || 0,
          epcRating: prop.epcRating || 'Unknown',
          
          // Latest sale info
          lastSalePrice,
          lastSaleDate: propertySalesHistory.length > 0 ? propertySalesHistory[0].date : null,
          totalSales: propertySalesHistory.length,
          
          // Sales history (all sales for transparency)
          salesHistory: propertySalesHistory.map((sale: any) => ({
            date: sale.date,
            price: sale.price
          })),
          
          // Price analysis
          priceRange,
          currentValuation,
          
          // Investment metrics
          capitalGrowth: Math.round(capitalGrowth * 100) / 100,
          longTermGrowth: Math.round(longTermGrowth * 100) / 100,
          growthPeriod: propertySalesHistory.length > 1 ? 
            `${new Date(propertySalesHistory[propertySalesHistory.length - 1].date).getFullYear()}-${new Date(propertySalesHistory[0].date).getFullYear()}` : 
            'N/A',
          longTermPeriod: propertySalesHistory.length > 0 ? 
            `${new Date(propertySalesHistory[propertySalesHistory.length - 1].date).getFullYear()}-${new Date(propertySalesHistory[0].date).getFullYear()}` : 
            'N/A',
          
          // Rental and yield
          recommendedRent: Math.round(recommendedRent),
          grossYield: Math.round(grossYield * 100) / 100,
          
          // Portfolio fit
          portfolioFit: {
            diversification: 60,
            riskLevel: 'MEDIUM',
            potential: 'MEDIUM'
          },
          
          // EPC insights
          epcUpgrade,
          
          // Market context
          marketPhase: currentMarketPhase
        };

        propertyMap.set(propertyKey, portfolioProperty);
      }
    });

    // Convert map back to array
    const portfolioProperties = Array.from(propertyMap.values());

    // Sort by most recent sales first
    portfolioProperties.sort((a: any, b: any) => {
      if (!a.lastSaleDate && !b.lastSaleDate) return 0;
      if (!a.lastSaleDate) return 1;
      if (!b.lastSaleDate) return 1;
      return new Date(b.lastSaleDate).getTime() - new Date(a.lastSaleDate).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        postcode,
        totalProperties: portfolioProperties.length,
        properties: portfolioProperties,
        marketSummary: {
          averagePrice: valuationData.data?.marketAnalysis?.averagePrice || 0,
          totalSales: valuationData.data?.marketAnalysis?.totalSales || 0,
          currentMarketPhase
        }
      }
    });

  } catch (error) {
    console.error('Property discovery error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { success: false, error: 'Failed to discover properties' },
      { status: 500 }
    );
  }
}
