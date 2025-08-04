export interface EnhancedPortfolioProperty {
  id: string;
  address: string;
  postcode: string;
  houseNumber: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  propertyType: string;
  bmvScore: number | null;
  notes?: string;
  status: 'active' | 'sold' | 'watching';
  
  // Financial details
  mortgageAmount: number;
  mortgageRate: number;
  monthlyRent: number;
  monthlyMortgagePayment: number;
  monthlyExpenses: number;
  deposit: number;
  
  // Calculated fields
  equity: number;
  equityPercentage: number;
  monthlyCashFlow: number;
  totalRentalIncome: number;
  totalMortgagePaid: number;
  totalExpenses: number;
  netProfit: number;
  
  // Growth tracking
  valueGrowth: number;
  valueGrowthPercentage: number;
  equityGrowth: number;
  equityGrowthPercentage: number;
  
  // Time tracking
  monthsOwned: number;
  lastRentPayment: string;
  nextRentPayment: string;
  
  // Market data
  marketTrend: 'rising' | 'stable' | 'falling';
  comparableSales: number;
  lastValuationDate: string;
  
  // Missing data flags
  missingData: {
    currentValue: boolean;
    monthlyRent: boolean;
    mortgageDetails: boolean;
    expenses: boolean;
  };
}

export interface PortfolioStats {
  totalProperties: number;
  totalValue: number;
  totalGrowth: number;
  totalGrowthPercentage: number;
  totalEquity: number;
  totalEquityPercentage: number;
  totalRentalIncome: number;
  totalMonthlyCashFlow: number;
  totalMortgagePaid: number;
  totalExpenses: number;
  netProfit: number;
  averageBMVScore: number;
  averageGrowth: number;
  averageEquity: number;
  averageMonthlyRent: number;
  averageMonthlyCashFlow: number;
}

export interface PortfolioChartData {
  month: string;
  totalValue: number;
  totalEquity: number;
  totalRentalIncome: number;
  totalCashFlow: number;
} 