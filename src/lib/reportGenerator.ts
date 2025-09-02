// Advanced PDF report generation system for property analysis and investment reports

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportConfig {
  title: string;
  subtitle?: string;
  author: string;
  date: Date;
  logo?: string;
  footer?: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

interface PropertyReportData {
  property: {
    address: string;
    postcode: string;
    price: number;
    estimatedValue: number;
    bmvScore: number;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    floorArea?: number;
    dateOfTransfer: string;
    imageUrl?: string;
  };
  marketAnalysis: {
    localAveragePrice: number;
    pricePerSqm: number;
    marketTrend: 'rising' | 'falling' | 'stable';
    trendPercentage: number;
    comparableProperties: any[];
  };
  investmentAnalysis: {
    rentalYield?: number;
    capitalGrowth?: number;
    totalReturn?: number;
    riskScore: number;
    investmentGrade: 'A' | 'B' | 'C' | 'D';
    recommendations: string[];
  };
  financialProjections: {
    year1: { value: number; growth: number };
    year3: { value: number; growth: number };
    year5: { value: number; growth: number };
    year10: { value: number; growth: number };
  };
}

interface PortfolioReportData {
  portfolio: {
    totalValue: number;
    totalInvestment: number;
    totalReturn: number;
    returnPercentage: number;
    properties: any[];
  };
  performance: {
    monthlyReturns: number[];
    annualReturns: number[];
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  diversification: {
    byLocation: Record<string, number>;
    byPropertyType: Record<string, number>;
    byInvestmentGrade: Record<string, number>;
  };
  recommendations: {
    rebalancing: string[];
    newInvestments: string[];
    riskManagement: string[];
  };
}

interface MarketReportData {
  market: {
    region: string;
    period: string;
    totalTransactions: number;
    averagePrice: number;
    priceChange: number;
    volumeChange: number;
  };
  trends: {
    priceTrend: 'rising' | 'falling' | 'stable';
    volumeTrend: 'rising' | 'falling' | 'stable';
    bmvOpportunities: number;
    marketActivity: 'high' | 'medium' | 'low';
  };
  analysis: {
    keyDrivers: string[];
    risks: string[];
    opportunities: string[];
    outlook: string;
  };
  data: {
    priceHistory: Array<{ date: string; price: number }>;
    volumeHistory: Array<{ date: string; volume: number }>;
    topAreas: Array<{ area: string; growth: number; volume: number }>;
  };
}

class ReportGenerator {
  private defaultConfig: ReportConfig = {
    title: 'Property Intelligence Report',
    author: 'Property Intelligence Platform',
    date: new Date(),
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    colors: {
      primary: '#3A7CA5',
      secondary: '#5DA271',
      accent: '#D4AF37',
      text: '#333333',
      background: '#F5F5DC'
    }
  };

  // Generate Property Analysis Report
  async generatePropertyReport(data: PropertyReportData, config?: Partial<ReportConfig>): Promise<Blob> {
    const reportConfig = { ...this.defaultConfig, ...config };
    const doc = new jsPDF({
      orientation: reportConfig.orientation,
      unit: 'mm',
      format: reportConfig.pageSize
    });

    // Set up document
    this.setupDocument(doc, reportConfig);

    // Add header
    this.addHeader(doc, reportConfig, 'Property Analysis Report');

    // Add property overview
    this.addPropertyOverview(doc, data.property, reportConfig);

    // Add market analysis
    this.addMarketAnalysis(doc, data.marketAnalysis, reportConfig);

    // Add investment analysis
    this.addInvestmentAnalysis(doc, data.investmentAnalysis, reportConfig);

    // Add financial projections
    this.addFinancialProjections(doc, data.financialProjections, reportConfig);

    // Add recommendations
    this.addRecommendations(doc, data.investmentAnalysis.recommendations, reportConfig);

    // Add footer
    this.addFooter(doc, reportConfig);

    return doc.output('blob');
  }

  // Generate Portfolio Performance Report
  async generatePortfolioReport(data: PortfolioReportData, config?: Partial<ReportConfig>): Promise<Blob> {
    const reportConfig = { ...this.defaultConfig, ...config };
    const doc = new jsPDF({
      orientation: reportConfig.orientation,
      unit: 'mm',
      format: reportConfig.pageSize
    });

    this.setupDocument(doc, reportConfig);
    this.addHeader(doc, reportConfig, 'Portfolio Performance Report');

    // Add portfolio summary
    this.addPortfolioSummary(doc, data.portfolio, reportConfig);

    // Add performance metrics
    this.addPerformanceMetrics(doc, data.performance, reportConfig);

    // Add diversification analysis
    this.addDiversificationAnalysis(doc, data.diversification, reportConfig);

    // Add property breakdown
    this.addPropertyBreakdown(doc, data.portfolio.properties, reportConfig);

    // Add recommendations
    this.addPortfolioRecommendations(doc, data.recommendations, reportConfig);

    this.addFooter(doc, reportConfig);

    return doc.output('blob');
  }

  // Generate Market Intelligence Report
  async generateMarketReport(data: MarketReportData, config?: Partial<ReportConfig>): Promise<Blob> {
    const reportConfig = { ...this.defaultConfig, ...config };
    const doc = new jsPDF({
      orientation: reportConfig.orientation,
      unit: 'mm',
      format: reportConfig.pageSize
    });

    this.setupDocument(doc, reportConfig);
    this.addHeader(doc, reportConfig, 'Market Intelligence Report');

    // Add market overview
    this.addMarketOverview(doc, data.market, reportConfig);

    // Add trend analysis
    this.addTrendAnalysis(doc, data.trends, reportConfig);

    // Add market analysis
    this.addMarketAnalysisSection(doc, data.analysis, reportConfig);

    // Add data visualizations
    this.addDataVisualizations(doc, data.data, reportConfig);

    this.addFooter(doc, reportConfig);

    return doc.output('blob');
  }

  // Setup document with fonts and colors
  private setupDocument(doc: jsPDF, config: ReportConfig) {
    // Set default font
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    // Set text color
    doc.setTextColor(config.colors.text);
  }

  // Add document header
  private addHeader(doc: jsPDF, config: ReportConfig, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add logo if provided
    if (config.logo) {
      // In a real implementation, you would add the logo image here
      // doc.addImage(config.logo, 'PNG', config.margins.left, config.margins.top, 30, 10);
    }

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(config.colors.primary);
    doc.text(title, config.margins.left, config.margins.top + 15);

    // Add subtitle
    if (config.subtitle) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(config.colors.text);
      doc.text(config.subtitle, config.margins.left, config.margins.top + 25);
    }

    // Add date and author
    doc.setFontSize(10);
    doc.setTextColor(config.colors.secondary);
    doc.text(`Generated on: ${config.date.toLocaleDateString()}`, pageWidth - config.margins.right - 50, config.margins.top + 15);
    doc.text(`By: ${config.author}`, pageWidth - config.margins.right - 50, config.margins.top + 25);

    // Add horizontal line
    doc.setDrawColor(config.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(config.margins.left, config.margins.top + 35, pageWidth - config.margins.right, config.margins.top + 35);
  }

  // Add property overview section
  private addPropertyOverview(doc: jsPDF, property: PropertyReportData['property'], config: ReportConfig) {
    let yPosition = config.margins.top + 50;

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(config.colors.primary);
    doc.text('Property Overview', config.margins.left, yPosition);
    yPosition += 10;

    // Property details table
    const propertyData = [
      ['Address', property.address],
      ['Postcode', property.postcode],
      ['Property Type', property.propertyType],
      ['Bedrooms', property.bedrooms?.toString() || 'N/A'],
      ['Bathrooms', property.bathrooms?.toString() || 'N/A'],
      ['Floor Area', property.floorArea ? `${property.floorArea} sqm` : 'N/A'],
      ['Sale Price', this.formatCurrency(property.price)],
      ['Estimated Value', this.formatCurrency(property.estimatedValue)],
      ['BMV Score', `${property.bmvScore}%`],
      ['Date of Transfer', new Date(property.dateOfTransfer).toLocaleDateString()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Property Detail', 'Value']],
      body: propertyData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // BMV Score visualization
    this.addBMVScoreVisualization(doc, property.bmvScore, yPosition, config);
  }

  // Add market analysis section
  private addMarketAnalysis(doc: jsPDF, analysis: PropertyReportData['marketAnalysis'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Market Analysis', config);

    const marketData = [
      ['Local Average Price', this.formatCurrency(analysis.localAveragePrice)],
      ['Price per sqm', this.formatCurrency(analysis.pricePerSqm)],
      ['Market Trend', analysis.marketTrend.toUpperCase()],
      ['Trend Percentage', `${analysis.trendPercentage}%`],
      ['Comparable Properties', analysis.comparableProperties.length.toString()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Market Metric', 'Value']],
      body: marketData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.secondary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add investment analysis section
  private addInvestmentAnalysis(doc: jsPDF, analysis: PropertyReportData['investmentAnalysis'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Investment Analysis', config);

    const investmentData = [
      ['Rental Yield', analysis.rentalYield ? `${analysis.rentalYield}%` : 'N/A'],
      ['Capital Growth', analysis.capitalGrowth ? `${analysis.capitalGrowth}%` : 'N/A'],
      ['Total Return', analysis.totalReturn ? `${analysis.totalReturn}%` : 'N/A'],
      ['Risk Score', `${analysis.riskScore}/10`],
      ['Investment Grade', analysis.investmentGrade]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Investment Metric', 'Value']],
      body: investmentData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.accent,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add financial projections section
  private addFinancialProjections(doc: jsPDF, projections: PropertyReportData['financialProjections'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Financial Projections', config);

    const projectionData = [
      ['Year 1', this.formatCurrency(projections.year1.value), `${projections.year1.growth}%`],
      ['Year 3', this.formatCurrency(projections.year3.value), `${projections.year3.growth}%`],
      ['Year 5', this.formatCurrency(projections.year5.value), `${projections.year5.growth}%`],
      ['Year 10', this.formatCurrency(projections.year10.value), `${projections.year10.growth}%`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Period', 'Projected Value', 'Growth']],
      body: projectionData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add recommendations section
  private addRecommendations(doc: jsPDF, recommendations: string[], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Recommendations', config);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(config.colors.text);

    recommendations.forEach((recommendation, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }

      doc.text(`• ${recommendation}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });
  }

  // Add portfolio summary section
  private addPortfolioSummary(doc: jsPDF, portfolio: PortfolioReportData['portfolio'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Portfolio Summary', config);

    const summaryData = [
      ['Total Portfolio Value', this.formatCurrency(portfolio.totalValue)],
      ['Total Investment', this.formatCurrency(portfolio.totalInvestment)],
      ['Total Return', this.formatCurrency(portfolio.totalReturn)],
      ['Return Percentage', `${portfolio.returnPercentage}%`],
      ['Number of Properties', portfolio.properties.length.toString()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Portfolio Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add performance metrics section
  private addPerformanceMetrics(doc: jsPDF, performance: PortfolioReportData['performance'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Performance Metrics', config);

    const performanceData = [
      ['Volatility', `${performance.volatility}%`],
      ['Sharpe Ratio', performance.sharpeRatio.toFixed(2)],
      ['Maximum Drawdown', `${performance.maxDrawdown}%`],
      ['Average Monthly Return', `${(performance.monthlyReturns.reduce((a, b) => a + b, 0) / performance.monthlyReturns.length).toFixed(2)}%`],
      ['Average Annual Return', `${(performance.annualReturns.reduce((a, b) => a + b, 0) / performance.annualReturns.length).toFixed(2)}%`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Performance Metric', 'Value']],
      body: performanceData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.secondary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add diversification analysis section
  private addDiversificationAnalysis(doc: jsPDF, diversification: PortfolioReportData['diversification'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Diversification Analysis', config);

    // Location diversification
    const locationData = Object.entries(diversification.byLocation).map(([location, percentage]) => [
      location, `${percentage}%`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Location', 'Percentage']],
      body: locationData,
      title: 'By Location',
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.accent,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Property type diversification
    const typeData = Object.entries(diversification.byPropertyType).map(([type, percentage]) => [
      type, `${percentage}%`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Property Type', 'Percentage']],
      body: typeData,
      title: 'By Property Type',
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.accent,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add property breakdown section
  private addPropertyBreakdown(doc: jsPDF, properties: any[], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Property Breakdown', config);

    const propertyData = properties.map(property => [
      property.address,
      property.postcode,
      this.formatCurrency(property.price),
      `${property.bmvScore}%`,
      property.investmentGrade || 'N/A'
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Address', 'Postcode', 'Price', 'BMV Score', 'Grade']],
      body: propertyData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text,
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add portfolio recommendations section
  private addPortfolioRecommendations(doc: jsPDF, recommendations: PortfolioReportData['recommendations'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Portfolio Recommendations', config);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(config.colors.text);

    // Rebalancing recommendations
    doc.setFont('helvetica', 'bold');
    doc.text('Rebalancing:', config.margins.left, yPosition);
    yPosition += 6;

    recommendations.rebalancing.forEach((rec, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${rec}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // New investment recommendations
    doc.setFont('helvetica', 'bold');
    doc.text('New Investments:', config.margins.left, yPosition);
    yPosition += 6;

    recommendations.newInvestments.forEach((rec, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${rec}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });
  }

  // Add market overview section
  private addMarketOverview(doc: jsPDF, market: MarketReportData['market'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Market Overview', config);

    const marketData = [
      ['Region', market.region],
      ['Period', market.period],
      ['Total Transactions', market.totalTransactions.toString()],
      ['Average Price', this.formatCurrency(market.averagePrice)],
      ['Price Change', `${market.priceChange}%`],
      ['Volume Change', `${market.volumeChange}%`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Market Metric', 'Value']],
      body: marketData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add trend analysis section
  private addTrendAnalysis(doc: jsPDF, trends: MarketReportData['trends'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Trend Analysis', config);

    const trendData = [
      ['Price Trend', trends.priceTrend.toUpperCase()],
      ['Volume Trend', trends.volumeTrend.toUpperCase()],
      ['BMV Opportunities', trends.bmvOpportunities.toString()],
      ['Market Activity', trends.marketActivity.toUpperCase()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Trend Metric', 'Value']],
      body: trendData,
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.secondary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add market analysis section
  private addMarketAnalysisSection(doc: jsPDF, analysis: MarketReportData['analysis'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Market Analysis', config);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(config.colors.text);

    // Key drivers
    doc.setFont('helvetica', 'bold');
    doc.text('Key Market Drivers:', config.margins.left, yPosition);
    yPosition += 6;

    analysis.keyDrivers.forEach((driver, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${driver}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Risks
    doc.setFont('helvetica', 'bold');
    doc.text('Market Risks:', config.margins.left, yPosition);
    yPosition += 6;

    analysis.risks.forEach((risk, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${risk}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Opportunities
    doc.setFont('helvetica', 'bold');
    doc.text('Investment Opportunities:', config.margins.left, yPosition);
    yPosition += 6;

    analysis.opportunities.forEach((opportunity, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = config.margins.top + 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${opportunity}`, config.margins.left + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Outlook
    doc.setFont('helvetica', 'bold');
    doc.text('Market Outlook:', config.margins.left, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const outlookLines = doc.splitTextToSize(analysis.outlook, doc.internal.pageSize.getWidth() - config.margins.left - config.margins.right - 10);
    doc.text(outlookLines, config.margins.left, yPosition);
  }

  // Add data visualizations section
  private addDataVisualizations(doc: jsPDF, data: MarketReportData['data'], config: ReportConfig) {
    let yPosition = this.addSectionHeader(doc, 'Market Data', config);

    // Top areas table
    const topAreasData = data.topAreas.map(area => [
      area.area,
      `${area.growth}%`,
      area.volume.toString()
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Area', 'Growth', 'Volume']],
      body: topAreasData,
      title: 'Top Performing Areas',
      theme: 'grid',
      headStyles: {
        fillColor: config.colors.accent,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: config.colors.text
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: config.margins.left, right: config.margins.right }
    });
  }

  // Add BMV score visualization
  private addBMVScoreVisualization(doc: jsPDF, score: number, yPosition: number, config: ReportConfig) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const barWidth = pageWidth - config.margins.left - config.margins.right - 20;
    const barHeight = 8;
    const barX = config.margins.left + 10;
    const barY = yPosition + 5;

    // Background bar
    doc.setFillColor('#E0E0E0');
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    // Score bar
    const scoreWidth = (score / 100) * barWidth;
    const barColor = score >= 80 ? config.colors.secondary : score >= 60 ? config.colors.accent : config.colors.primary;
    doc.setFillColor(barColor);
    doc.rect(barX, barY, scoreWidth, barHeight, 'F');

    // Score text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(config.colors.text);
    doc.text(`${score}% BMV Score`, barX + barWidth + 5, barY + 6);
  }

  // Add section header
  private addSectionHeader(doc: jsPDF, title: string, config: ReportConfig): number {
    let yPosition = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : config.margins.top + 50;

    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      yPosition = config.margins.top + 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(config.colors.primary);
    doc.text(title, config.margins.left, yPosition);

    return yPosition + 10;
  }

  // Add document footer
  private addFooter(doc: jsPDF, config: ReportConfig) {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Footer line
      doc.setDrawColor(config.colors.primary);
      doc.setLineWidth(0.5);
      doc.line(config.margins.left, pageHeight - 15, pageWidth - config.margins.right, pageHeight - 15);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(config.colors.secondary);
      
      const footerText = config.footer || 'Property Intelligence Platform - Confidential Report';
      doc.text(footerText, config.margins.left, pageHeight - 10);
      
      // Page number
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - config.margins.right - 20, pageHeight - 10);
    }
  }

  // Format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

// Singleton instance
export const reportGenerator = new ReportGenerator();

// Export types
export type { 
  ReportConfig, 
  PropertyReportData, 
  PortfolioReportData, 
  MarketReportData 
};
