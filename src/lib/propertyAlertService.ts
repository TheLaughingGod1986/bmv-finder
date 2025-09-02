// Property alert service for monitoring price changes and new listings

import { notificationService } from './notificationService';

interface PropertyAlert {
  id: string;
  userId: string;
  name: string;
  type: 'price_drop' | 'price_increase' | 'new_listing' | 'bmv_opportunity' | 'market_change';
  conditions: PropertyAlertCondition[];
  postcodes: string[];
  propertyTypes: string[];
  priceRange: {
    min?: number;
    max?: number;
  };
  bmvThreshold: number;
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

interface PropertyAlertCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  value2?: any;
}

interface PropertyMatch {
  property: any;
  alert: PropertyAlert;
  matchedConditions: string[];
  score: number;
}

class PropertyAlertService {
  private alerts: Map<string, PropertyAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.loadAlerts();
    this.startMonitoring();
  }

  // Create a new property alert
  createAlert(alert: Omit<PropertyAlert, 'id' | 'createdAt' | 'triggerCount'>): string {
    const id = this.generateId();
    const newAlert: PropertyAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
      triggerCount: 0
    };

    this.alerts.set(id, newAlert);
    this.saveAlerts();
    return id;
  }

  // Update an existing alert
  updateAlert(id: string, updates: Partial<PropertyAlert>): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    this.alerts.set(id, { ...alert, ...updates });
    this.saveAlerts();
    return true;
  }

  // Delete an alert
  deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveAlerts();
    }
    return deleted;
  }

  // Get user's alerts
  getUserAlerts(userId: string): PropertyAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get alert by ID
  getAlert(id: string): PropertyAlert | null {
    return this.alerts.get(id) || null;
  }

  // Start monitoring for property changes
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAlerts();
    }, 5 * 60 * 1000); // Check every 5 minutes

    console.log('Property alert monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Property alert monitoring stopped');
  }

  // Check all alerts for matches
  private async checkAlerts() {
    const enabledAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled);
    
    if (enabledAlerts.length === 0) return;

    console.log(`Checking ${enabledAlerts.length} property alerts...`);

    for (const alert of enabledAlerts) {
      try {
        await this.checkAlert(alert);
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  }

  // Check a specific alert
  private async checkAlert(alert: PropertyAlert) {
    // Get recent properties for the alert's postcodes
    const properties = await this.getRecentProperties(alert.postcodes, alert.propertyTypes);
    
    // Check each property against alert conditions
    const matches: PropertyMatch[] = [];
    
    for (const property of properties) {
      const match = this.evaluateProperty(property, alert);
      if (match) {
        matches.push(match);
      }
    }

    // Send notifications for matches
    if (matches.length > 0) {
      await this.handleMatches(matches, alert);
    }
  }

  // Get recent properties for postcodes
  private async getRecentProperties(postcodes: string[], propertyTypes: string[]): Promise<any[]> {
    const properties: any[] = [];

    for (const postcode of postcodes) {
      try {
        const response = await fetch(`/api/property-search?postcode=${encodeURIComponent(postcode)}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.properties) {
            // Filter by property types if specified
            const filtered = propertyTypes.length > 0 
              ? data.properties.filter((p: any) => propertyTypes.includes(p.propertyType))
              : data.properties;
            
            properties.push(...filtered);
          }
        }
      } catch (error) {
        console.error(`Error fetching properties for ${postcode}:`, error);
      }
    }

    return properties;
  }

  // Evaluate if a property matches alert conditions
  private evaluateProperty(property: any, alert: PropertyAlert): PropertyMatch | null {
    const matchedConditions: string[] = [];
    let score = 0;

    // Check price range
    if (alert.priceRange.min !== undefined && property.price < alert.priceRange.min) {
      return null;
    }
    if (alert.priceRange.max !== undefined && property.price > alert.priceRange.max) {
      return null;
    }

    // Check BMV threshold
    if (property.bmvScore && property.bmvScore >= alert.bmvThreshold) {
      matchedConditions.push('bmv_threshold');
      score += property.bmvScore;
    }

    // Check custom conditions
    for (const condition of alert.conditions) {
      if (this.evaluateCondition(property, condition)) {
        matchedConditions.push(condition.field);
        score += 10;
      }
    }

    // Must match at least one condition
    if (matchedConditions.length === 0) {
      return null;
    }

    return {
      property,
      alert,
      matchedConditions,
      score
    };
  }

  // Evaluate a single condition
  private evaluateCondition(property: any, condition: PropertyAlertCondition): boolean {
    const value = this.getPropertyValue(property, condition.field);
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'between':
        return Number(value) >= Number(condition.value) && 
               Number(value) <= Number(condition.value2);
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }

  // Get property value by field path
  private getPropertyValue(property: any, field: string): any {
    const fields = field.split('.');
    let value = property;
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Handle alert matches
  private async handleMatches(matches: PropertyMatch[], alert: PropertyAlert) {
    // Sort matches by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    // Update alert trigger count and timestamp
    alert.triggerCount += matches.length;
    alert.lastTriggered = Date.now();
    this.alerts.set(alert.id, alert);
    this.saveAlerts();

    // Send notifications for top matches
    const topMatches = matches.slice(0, 5); // Limit to top 5 matches

    for (const match of topMatches) {
      await this.sendAlertNotification(match);
    }
  }

  // Send notification for a property match
  private async sendAlertNotification(match: PropertyMatch) {
    const { property, alert } = match;
    
    let templateId: string;
    let variables: Record<string, any>;

    switch (alert.type) {
      case 'price_drop':
        templateId = 'property_price_drop';
        variables = {
          address: property.address,
          percentage: this.calculatePriceDrop(property),
          new_price: this.formatPrice(property.price),
          bmv_score: property.bmvScore || 0
        };
        break;

      case 'new_listing':
        templateId = 'new_bmv_property';
        variables = {
          address: property.address,
          bmv_score: property.bmvScore || 0,
          estimated_value: this.formatPrice(property.estimatedValue || property.price)
        };
        break;

      default:
        templateId = 'new_bmv_property';
        variables = {
          address: property.address,
          bmv_score: property.bmvScore || 0,
          estimated_value: this.formatPrice(property.estimatedValue || property.price)
        };
    }

    await notificationService.sendTemplatedNotification(
      templateId,
      alert.userId,
      variables,
      {
        property,
        alert: alert.id,
        matchedConditions: match.matchedConditions,
        score: match.score
      }
    );
  }

  // Calculate price drop percentage
  private calculatePriceDrop(property: any): number {
    if (!property.estimatedValue || !property.price) return 0;
    return Math.round(((property.estimatedValue - property.price) / property.estimatedValue) * 100);
  }

  // Format price for display
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  // Load alerts from storage
  private loadAlerts() {
    try {
      const stored = localStorage.getItem('property_alerts');
      if (stored) {
        const alerts = JSON.parse(stored);
        alerts.forEach((alert: PropertyAlert) => {
          this.alerts.set(alert.id, alert);
        });
        console.log(`Loaded ${alerts.length} property alerts`);
      }
    } catch (error) {
      console.error('Failed to load property alerts:', error);
    }
  }

  // Save alerts to storage
  private saveAlerts() {
    try {
      const alerts = Array.from(this.alerts.values());
      localStorage.setItem('property_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save property alerts:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get alert statistics
  getStats(): { total: number; active: number; triggered: number } {
    const alerts = Array.from(this.alerts.values());
    return {
      total: alerts.length,
      active: alerts.filter(a => a.enabled).length,
      triggered: alerts.reduce((sum, a) => sum + a.triggerCount, 0)
    };
  }

  // Test an alert against a specific property
  testAlert(alertId: string, property: any): PropertyMatch | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    return this.evaluateProperty(property, alert);
  }

  // Cleanup
  destroy() {
    this.stopMonitoring();
    this.alerts.clear();
  }
}

// Singleton instance
export const propertyAlertService = new PropertyAlertService();

// Export types
export type { PropertyAlert, PropertyAlertCondition, PropertyMatch };
