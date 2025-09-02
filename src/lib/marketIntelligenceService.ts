// Market intelligence service for monitoring market trends and generating notifications

import { notificationService } from './notificationService';

interface MarketTrend {
  id: string;
  area: string;
  postcode: string;
  trendType: 'price_increase' | 'price_decrease' | 'volume_increase' | 'volume_decrease' | 'bmv_opportunity';
  percentage: number;
  period: string;
  confidence: number;
  dataPoints: number;
  timestamp: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
}

interface MarketAlert {
  id: string;
  userId: string;
  name: string;
  areas: string[];
  alertTypes: string[];
  thresholds: {
    priceChange: number;
    volumeChange: number;
    bmvThreshold: number;
  };
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

interface MarketData {
  postcode: string;
  averagePrice: number;
  priceChange: number;
  volume: number;
  volumeChange: number;
  bmvProperties: number;
  bmvPercentage: number;
  timestamp: number;
}

class MarketIntelligenceService {
  private trends: Map<string, MarketTrend> = new Map();
  private alerts: Map<string, MarketAlert> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.loadAlerts();
    this.startMonitoring();
  }

  // Start market monitoring
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.analyzeMarketTrends();
    }, 15 * 60 * 1000); // Check every 15 minutes

    console.log('Market intelligence monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Market intelligence monitoring stopped');
  }

  // Analyze market trends
  private async analyzeMarketTrends() {
    console.log('Analyzing market trends...');

    try {
      // Get market data for key areas
      const keyAreas = ['SW1A1AA', 'M1 1AA', 'B1 1AA', 'LS1 1AA', 'S1 1AA'];
      
      for (const postcode of keyAreas) {
        await this.analyzeArea(postcode);
      }

      // Check for alert triggers
      await this.checkMarketAlerts();

    } catch (error) {
      console.error('Error analyzing market trends:', error);
    }
  }

  // Analyze specific area
  private async analyzeArea(postcode: string) {
    try {
      // Get recent sales data
      const response = await fetch(`/api/recent-sales?postcode=${encodeURIComponent(postcode)}&limit=100`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data.success || !data.sales) return;

      const sales = data.sales;
      const currentData = this.calculateMarketMetrics(sales, postcode);
      const previousData = this.marketData.get(postcode);

      // Store current data
      this.marketData.set(postcode, currentData);

      // Detect trends if we have previous data
      if (previousData) {
        const trends = this.detectTrends(previousData, currentData, postcode);
        for (const trend of trends) {
          this.trends.set(trend.id, trend);
          await this.handleMarketTrend(trend);
        }
      }

    } catch (error) {
      console.error(`Error analyzing area ${postcode}:`, error);
    }
  }

  // Calculate market metrics
  private calculateMarketMetrics(sales: any[], postcode: string): MarketData {
    const prices = sales.map(sale => sale.price).filter(price => price > 0);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const bmvProperties = sales.filter(sale => sale.bmvScore && sale.bmvScore >= 70);
    const bmvPercentage = (bmvProperties.length / sales.length) * 100;

    return {
      postcode,
      averagePrice,
      priceChange: 0, // Will be calculated when comparing with previous data
      volume: sales.length,
      volumeChange: 0, // Will be calculated when comparing with previous data
      bmvProperties: bmvProperties.length,
      bmvPercentage,
      timestamp: Date.now()
    };
  }

  // Detect trends between two data points
  private detectTrends(previous: MarketData, current: MarketData, postcode: string): MarketTrend[] {
    const trends: MarketTrend[] = [];
    const timeDiff = current.timestamp - previous.timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Price trend
    const priceChange = ((current.averagePrice - previous.averagePrice) / previous.averagePrice) * 100;
    if (Math.abs(priceChange) > 5) { // 5% threshold
      trends.push({
        id: this.generateId(),
        area: this.getAreaName(postcode),
        postcode,
        trendType: priceChange > 0 ? 'price_increase' : 'price_decrease',
        percentage: Math.abs(priceChange),
        period: `${hoursDiff.toFixed(1)}h`,
        confidence: this.calculateConfidence(current, previous),
        dataPoints: current.volume,
        timestamp: Date.now(),
        significance: this.calculateSignificance(Math.abs(priceChange), current.volume)
      });
    }

    // Volume trend
    const volumeChange = ((current.volume - previous.volume) / previous.volume) * 100;
    if (Math.abs(volumeChange) > 20) { // 20% threshold
      trends.push({
        id: this.generateId(),
        area: this.getAreaName(postcode),
        postcode,
        trendType: volumeChange > 0 ? 'volume_increase' : 'volume_decrease',
        percentage: Math.abs(volumeChange),
        period: `${hoursDiff.toFixed(1)}h`,
        confidence: this.calculateConfidence(current, previous),
        dataPoints: current.volume,
        timestamp: Date.now(),
        significance: this.calculateSignificance(Math.abs(volumeChange), current.volume)
      });
    }

    // BMV opportunity trend
    if (current.bmvPercentage > 15) { // 15% BMV threshold
      trends.push({
        id: this.generateId(),
        area: this.getAreaName(postcode),
        postcode,
        trendType: 'bmv_opportunity',
        percentage: current.bmvPercentage,
        period: `${hoursDiff.toFixed(1)}h`,
        confidence: this.calculateConfidence(current, previous),
        dataPoints: current.bmvProperties,
        timestamp: Date.now(),
        significance: this.calculateSignificance(current.bmvPercentage, current.volume)
      });
    }

    return trends;
  }

  // Calculate confidence score
  private calculateConfidence(current: MarketData, previous: MarketData): number {
    const dataQuality = Math.min(current.volume / 50, 1); // More data = higher confidence
    const timeConsistency = 1; // Could be improved with more sophisticated time analysis
    return Math.round((dataQuality * timeConsistency) * 100);
  }

  // Calculate significance level
  private calculateSignificance(percentage: number, volume: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage > 20 && volume > 20) return 'critical';
    if (percentage > 15 && volume > 15) return 'high';
    if (percentage > 10 && volume > 10) return 'medium';
    return 'low';
  }

  // Handle market trend
  private async handleMarketTrend(trend: MarketTrend) {
    console.log(`📈 Market trend detected: ${trend.trendType} in ${trend.area} (${trend.percentage}%)`);

    // Send notification for significant trends
    if (trend.significance === 'high' || trend.significance === 'critical') {
      await this.sendMarketTrendNotification(trend);
    }
  }

  // Send market trend notification
  private async sendMarketTrendNotification(trend: MarketTrend) {
    const trendTypeLabel = {
      'price_increase': 'Price Increase',
      'price_decrease': 'Price Decrease',
      'volume_increase': 'Volume Increase',
      'volume_decrease': 'Volume Decrease',
      'bmv_opportunity': 'BMV Opportunity'
    }[trend.trendType];

    await notificationService.sendTemplatedNotification(
      'market_trend_alert',
      'global', // Send to all users
      {
        area: trend.area,
        trend_type: trendTypeLabel,
        percentage: trend.percentage.toFixed(1),
        period: trend.period
      },
      {
        trend,
        confidence: trend.confidence,
        significance: trend.significance
      }
    );
  }

  // Create market alert
  createMarketAlert(alert: Omit<MarketAlert, 'id' | 'createdAt' | 'triggerCount'>): string {
    const id = this.generateId();
    const newAlert: MarketAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
      triggerCount: 0
    };

    this.alerts.set(id, newAlert);
    this.saveAlerts();
    return id;
  }

  // Update market alert
  updateMarketAlert(id: string, updates: Partial<MarketAlert>): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    this.alerts.set(id, { ...alert, ...updates });
    this.saveAlerts();
    return true;
  }

  // Delete market alert
  deleteMarketAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveAlerts();
    }
    return deleted;
  }

  // Get user's market alerts
  getUserMarketAlerts(userId: string): MarketAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Check market alerts
  private async checkMarketAlerts() {
    const enabledAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled);
    
    for (const alert of enabledAlerts) {
      try {
        await this.checkMarketAlert(alert);
      } catch (error) {
        console.error(`Error checking market alert ${alert.id}:`, error);
      }
    }
  }

  // Check specific market alert
  private async checkMarketAlert(alert: MarketAlert) {
    const relevantTrends = Array.from(this.trends.values())
      .filter(trend => 
        alert.areas.includes(trend.postcode) &&
        alert.alertTypes.includes(trend.trendType) &&
        this.isTrendSignificant(trend, alert)
      );

    if (relevantTrends.length > 0) {
      await this.handleMarketAlertTrigger(alert, relevantTrends);
    }
  }

  // Check if trend is significant for alert
  private isTrendSignificant(trend: MarketTrend, alert: MarketAlert): boolean {
    switch (trend.trendType) {
      case 'price_increase':
      case 'price_decrease':
        return trend.percentage >= alert.thresholds.priceChange;
      case 'volume_increase':
      case 'volume_decrease':
        return trend.percentage >= alert.thresholds.volumeChange;
      case 'bmv_opportunity':
        return trend.percentage >= alert.thresholds.bmvThreshold;
      default:
        return false;
    }
  }

  // Handle market alert trigger
  private async handleMarketAlertTrigger(alert: MarketAlert, trends: MarketTrend[]) {
    alert.triggerCount += trends.length;
    alert.lastTriggered = Date.now();
    this.alerts.set(alert.id, alert);
    this.saveAlerts();

    // Send notification
    await notificationService.sendNotification({
      type: 'market_update',
      title: `Market Alert: ${alert.name}`,
      message: `${trends.length} significant market trend(s) detected in your monitored areas.`,
      data: { alert, trends },
      priority: 'medium',
      userId: alert.userId,
      channels: [
        { type: 'push', enabled: true },
        { type: 'email', enabled: true },
        { type: 'in_app', enabled: true }
      ]
    });
  }

  // Get area name from postcode
  private getAreaName(postcode: string): string {
    const areaMap: Record<string, string> = {
      'SW1A1AA': 'Westminster',
      'M1 1AA': 'Manchester',
      'B1 1AA': 'Birmingham',
      'LS1 1AA': 'Leeds',
      'S1 1AA': 'Sheffield'
    };
    return areaMap[postcode] || postcode;
  }

  // Load alerts from storage
  private loadAlerts() {
    try {
      const stored = localStorage.getItem('market_alerts');
      if (stored) {
        const alerts = JSON.parse(stored);
        alerts.forEach((alert: MarketAlert) => {
          this.alerts.set(alert.id, alert);
        });
        console.log(`Loaded ${alerts.length} market alerts`);
      }
    } catch (error) {
      console.error('Failed to load market alerts:', error);
    }
  }

  // Save alerts to storage
  private saveAlerts() {
    try {
      const alerts = Array.from(this.alerts.values());
      localStorage.setItem('market_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save market alerts:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get market intelligence statistics
  getStats(): { trends: number; alerts: number; activeAlerts: number } {
    return {
      trends: this.trends.size,
      alerts: this.alerts.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length
    };
  }

  // Get recent trends
  getRecentTrends(limit: number = 20): MarketTrend[] {
    return Array.from(this.trends.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get market data for area
  getMarketData(postcode: string): MarketData | null {
    return this.marketData.get(postcode) || null;
  }

  // Cleanup
  destroy() {
    this.stopMonitoring();
    this.trends.clear();
    this.alerts.clear();
    this.marketData.clear();
  }
}

// Singleton instance
export const marketIntelligenceService = new MarketIntelligenceService();

// Export types
export type { MarketTrend, MarketAlert, MarketData };
