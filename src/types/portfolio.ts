export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioProperty {
  id: string;
  portfolioId: string;
  address: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  purchasePrice?: number;
  currentValue?: number;
  purchaseDate?: string;
  monthlyRent?: number;
  bmvScore?: number;
  addedAt: string;
  updatedAt: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface PortfolioPerformance {
  totalValue: number;
  totalInvestment: number;
  totalGain: number;
  totalGainPercentage: number;
  annualizedReturn: number;
  currentYield: number;
  propertiesCount: number;
  averageHoldingPeriod: number;
}

export interface PropertyPerformance {
  propertyId: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  gain: number;
  gainPercentage: number;
  holdingPeriod: number;
  annualizedReturn: number;
  rentalYield?: number;
  bmvScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PortfolioInsights {
  topPerformers: PropertyPerformance[];
  underPerformers: PropertyPerformance[];
  riskAnalysis: {
    concentrationRisk: number;
    locationRisk: number;
    marketRisk: number;
    overallRisk: 'low' | 'medium' | 'high';
  };
  marketComparison: {
    benchmarkReturn: number;
    portfolioReturn: number;
    outperformance: number;
    marketCorrelation: number;
  };
  recommendations: {
    type: 'buy' | 'sell' | 'hold' | 'diversify';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  trends: {
    valueGrowth: number[];
    incomeGrowth: number[];
    timePeriod: string[];
  };
}
