import { Client } from '@elastic/elasticsearch';
import { esClient } from './esClient';

interface DataQualityMetrics {
  freshness: {
    lastUpdate: string;
    ageInHours: number;
    isFresh: boolean;
  };
  completeness: {
    totalRecords: number;
    missingFields: number;
    completenessScore: number;
  };
  accuracy: {
    validationErrors: number;
    accuracyScore: number;
  };
  consistency: {
    duplicateRecords: number;
    consistencyScore: number;
  };
}

interface AlertConfig {
  maxAgeHours: number;
  minCompletenessScore: number;
  minAccuracyScore: number;
  emailRecipients?: string[];
  webhookUrl?: string;
}

class DataQualityMonitor {
  private client: Client;
  private alertConfig: AlertConfig;

  constructor(client: Client, alertConfig: AlertConfig = {
    maxAgeHours: 24,
    minCompletenessScore: 0.95,
    minAccuracyScore: 0.98
  }) {
    this.client = client;
    this.alertConfig = alertConfig;
  }

  // Check data freshness
  async checkDataFreshness(index: string): Promise<{
    lastUpdate: string;
    ageInHours: number;
    isFresh: boolean;
  }> {
    try {
      const result = await this.client.search({
        index,
        size: 1,
        body: {
          sort: [{ dateOfTransfer: { order: 'desc' } }]
        }
      });

      if (result.hits.hits.length === 0) {
        return {
          lastUpdate: 'Never',
          ageInHours: Infinity,
          isFresh: false
        };
      }

      const lastRecord = result.hits.hits[0]._source;
      const lastUpdate = lastRecord.dateOfTransfer || lastRecord.date;
      const ageInHours = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);

      return {
        lastUpdate,
        ageInHours,
        isFresh: ageInHours <= this.alertConfig.maxAgeHours
      };
    } catch (error) {
      console.error('Error checking data freshness:', error);
      return {
        lastUpdate: 'Unknown',
        ageInHours: Infinity,
        isFresh: false
      };
    }
  }

  // Check data completeness
  async checkDataCompleteness(index: string, requiredFields: string[]): Promise<{
    totalRecords: number;
    missingFields: number;
    completenessScore: number;
  }> {
    try {
      // Get total count
      const countResult = await this.client.count({ index });
      const totalRecords = countResult.count;

      if (totalRecords === 0) {
        return {
          totalRecords: 0,
          missingFields: 0,
          completenessScore: 0
        };
      }

      // Check for missing fields
      let missingFields = 0;
      for (const field of requiredFields) {
        const fieldResult = await this.client.search({
          index,
          size: 0,
          body: {
            query: {
              bool: {
                must_not: {
                  exists: { field }
                }
              }
            }
          }
        });
        missingFields += fieldResult.hits.total.value;
      }

      const completenessScore = Math.max(0, 1 - (missingFields / (totalRecords * requiredFields.length)));

      return {
        totalRecords,
        missingFields,
        completenessScore
      };
    } catch (error) {
      console.error('Error checking data completeness:', error);
      return {
        totalRecords: 0,
        missingFields: 0,
        completenessScore: 0
      };
    }
  }

  // Validate data accuracy
  async validateDataAccuracy(index: string): Promise<{
    validationErrors: number;
    accuracyScore: number;
  }> {
    try {
      // Check for invalid price values
      const invalidPriceResult = await this.client.search({
        index,
        size: 0,
        body: {
          query: {
            bool: {
              should: [
                { range: { pricePaid: { lte: 0 } } },
                { range: { pricePaid: { gte: 10000000 } } } // £10M+ seems suspicious
              ]
            }
          }
        }
      });

      // Check for invalid dates
      const invalidDateResult = await this.client.search({
        index,
        size: 0,
        body: {
          query: {
            bool: {
              should: [
                { range: { dateOfTransfer: { gte: '2030-01-01' } } },
                { range: { dateOfTransfer: { lte: '1900-01-01' } } }
              ]
            }
          }
        }
      });

      const validationErrors = invalidPriceResult.hits.total.value + invalidDateResult.hits.total.value;
      const totalRecords = await this.getTotalRecords(index);
      const accuracyScore = totalRecords > 0 ? Math.max(0, 1 - (validationErrors / totalRecords)) : 0;

      return {
        validationErrors,
        accuracyScore
      };
    } catch (error) {
      console.error('Error validating data accuracy:', error);
      return {
        validationErrors: 0,
        accuracyScore: 0
      };
    }
  }

  // Check data consistency
  async checkDataConsistency(index: string): Promise<{
    duplicateRecords: number;
    consistencyScore: number;
  }> {
    try {
      // Check for potential duplicates based on key fields
      const duplicateResult = await this.client.search({
        index,
        size: 0,
        body: {
          aggs: {
            duplicates: {
              terms: {
                script: {
                  source: "doc['postcode'].value + '|' + doc['dateOfTransfer'].value + '|' + doc['pricePaid'].value"
                },
                min_doc_count: 2
              }
            }
          }
        }
      });

      const duplicateRecords = duplicateResult.aggregations.duplicates.buckets.reduce(
        (sum: number, bucket: any) => sum + bucket.doc_count, 0
      );

      const totalRecords = await this.getTotalRecords(index);
      const consistencyScore = totalRecords > 0 ? Math.max(0, 1 - (duplicateRecords / totalRecords)) : 0;

      return {
        duplicateRecords,
        consistencyScore
      };
    } catch (error) {
      console.error('Error checking data consistency:', error);
      return {
        duplicateRecords: 0,
        consistencyScore: 0
      };
    }
  }

  // Comprehensive data quality assessment
  async assessDataQuality(index: string): Promise<DataQualityMetrics> {
    const requiredFields = ['postcode', 'dateOfTransfer', 'pricePaid', 'propertyType'];

    const [freshness, completeness, accuracy, consistency] = await Promise.all([
      this.checkDataFreshness(index),
      this.checkDataCompleteness(index, requiredFields),
      this.validateDataAccuracy(index),
      this.checkDataConsistency(index)
    ]);

    return {
      freshness,
      completeness,
      accuracy,
      consistency
    };
  }

  // Monitor API calls and performance
  async logApiCall(endpoint: string, duration: number, status: number, error?: string): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      duration,
      status,
      error: error || null,
      userAgent: 'BMV-Finder-API'
    };

    try {
      await this.client.index({
        index: 'api_logs',
        body: logEntry
      });
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  // Generate alerts for data quality issues
  async generateAlerts(metrics: DataQualityMetrics): Promise<{
    alerts: string[];
    severity: 'low' | 'medium' | 'high';
  }> {
    const alerts: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check freshness
    if (!metrics.freshness.isFresh) {
      alerts.push(`Data is ${Math.round(metrics.freshness.ageInHours)} hours old (max: ${this.alertConfig.maxAgeHours}h)`);
      severity = 'high';
    }

    // Check completeness
    if (metrics.completeness.completenessScore < this.alertConfig.minCompletenessScore) {
      alerts.push(`Data completeness score is ${(metrics.completeness.completenessScore * 100).toFixed(1)}% (min: ${this.alertConfig.minCompletenessScore * 100}%)`);
      severity = severity === 'high' ? 'high' : 'medium';
    }

    // Check accuracy
    if (metrics.accuracy.accuracyScore < this.alertConfig.minAccuracyScore) {
      alerts.push(`Data accuracy score is ${(metrics.accuracy.accuracyScore * 100).toFixed(1)}% (min: ${this.alertConfig.minAccuracyScore * 100}%)`);
      severity = severity === 'high' ? 'high' : 'medium';
    }

    // Check consistency
    if (metrics.consistency.consistencyScore < 0.99) {
      alerts.push(`Data consistency score is ${(metrics.consistency.consistencyScore * 100).toFixed(1)}% (min: 99%)`);
      severity = severity === 'high' ? 'high' : 'medium';
    }

    return { alerts, severity };
  }

  // Send alerts via email or webhook
  async sendAlert(alert: { alerts: string[]; severity: string }, metrics: DataQualityMetrics): Promise<void> {
    const alertMessage = {
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      alerts: alert.alerts,
      metrics: {
        freshness: metrics.freshness.ageInHours,
        completeness: metrics.completeness.completenessScore,
        accuracy: metrics.accuracy.accuracyScore,
        consistency: metrics.consistency.consistencyScore
      }
    };

    // Send via webhook if configured
    if (this.alertConfig.webhookUrl) {
      try {
        await fetch(this.alertConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertMessage)
        });
      } catch (error) {
        console.error('Error sending webhook alert:', error);
      }
    }

    // Log alert
    console.log(`Data Quality Alert (${alert.severity}):`, alertMessage);
  }

  // Get total records count
  private async getTotalRecords(index: string): Promise<number> {
    try {
      const result = await this.client.count({ index });
      return result.count;
    } catch (error) {
      console.error('Error getting total records:', error);
      return 0;
    }
  }

  // Schedule regular monitoring
  startMonitoring(intervalMinutes: number = 60): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const metrics = await this.assessDataQuality('property_sales');
        const alerts = await this.generateAlerts(metrics);
        
        if (alerts.alerts.length > 0) {
          await this.sendAlert(alerts, metrics);
        }
      } catch (error) {
        console.error('Error in scheduled monitoring:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export default DataQualityMonitor; 