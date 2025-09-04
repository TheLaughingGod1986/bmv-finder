import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface AnalyticsQuery {
  id: string;
  name: string;
  description: string;
  type: 'property' | 'market' | 'portfolio' | 'user' | 'financial' | 'custom';
  filters: AnalyticsFilter[];
  aggregations: AnalyticsAggregation[];
  timeRange: TimeRange;
  groupBy: string[];
  orderBy: OrderBy[];
  limit?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'between' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AnalyticsAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median' | 'stddev' | 'variance' | 'percentile' | 'distinct';
  alias?: string;
  parameters?: Record<string, any>;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AnalyticsResult {
  id: string;
  queryId: string;
  data: AnalyticsDataPoint[];
  summary: AnalyticsSummary;
  metadata: AnalyticsMetadata;
  executionTime: number;
  createdAt: Date;
}

export interface AnalyticsDataPoint {
  timestamp?: Date;
  dimensions: Record<string, any>;
  metrics: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface AnalyticsSummary {
  totalRecords: number;
  totalValue: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  medianValue: number;
  standardDeviation: number;
  variance: number;
  percentiles: Record<number, number>;
  trends: TrendAnalysis;
  insights: AnalyticsInsight[];
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable' | 'volatile';
  magnitude: number;
  confidence: number;
  period: string;
  changeRate: number;
  seasonalPattern?: SeasonalPattern;
}

export interface SeasonalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  strength: number;
  peaks: Date[];
  valleys: Date[];
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations?: string[];
  metadata: Record<string, any>;
}

export interface AnalyticsMetadata {
  query: AnalyticsQuery;
  executionTime: number;
  dataSource: string;
  cacheHit: boolean;
  version: string;
  generatedAt: Date;
}

export interface BusinessIntelligenceReport {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'financial' | 'market' | 'custom';
  category: string;
  queries: string[];
  visualizations: ReportVisualization[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  template: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportVisualization {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'kpi' | 'map' | 'gauge' | 'treemap' | 'heatmap';
  title: string;
  description: string;
  config: VisualizationConfig;
  data: any;
  position: Position;
  size: Size;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'doughnut' | 'radar' | 'polar';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showDataLabels: boolean;
  animation: boolean;
  responsive: boolean;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  tooltip?: TooltipConfig;
  legend?: LegendConfig;
}

export interface AxisConfig {
  title: string;
  min?: number;
  max?: number;
  format?: string;
  type?: 'linear' | 'logarithmic' | 'category' | 'time';
}

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface LegendConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ReportFilter {
  id: string;
  name: string;
  type: 'select' | 'date' | 'text' | 'number' | 'boolean';
  field: string;
  options?: any[];
  defaultValue?: any;
  required: boolean;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface PredictiveModel {
  id: string;
  name: string;
  description: string;
  type: 'regression' | 'classification' | 'clustering' | 'time_series' | 'anomaly_detection';
  algorithm: string;
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'retired' | 'error';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingData: TrainingData;
  parameters: Record<string, any>;
  features: string[];
  target: string;
  createdAt: Date;
  updatedAt: Date;
  lastTrained?: Date;
}

export interface TrainingData {
  source: string;
  size: number;
  features: number;
  samples: number;
  quality: number;
  lastUpdated: Date;
}

export interface PredictionRequest {
  id: string;
  modelId: string;
  inputData: Record<string, any>;
  options: PredictionOptions;
  requestedBy: string;
  createdAt: Date;
}

export interface PredictionOptions {
  confidenceThreshold: number;
  returnProbabilities: boolean;
  explainPrediction: boolean;
  includeUncertainty: boolean;
}

export interface PredictionResult {
  id: string;
  requestId: string;
  modelId: string;
  prediction: any;
  confidence: number;
  probabilities?: Record<string, number>;
  explanation?: PredictionExplanation;
  uncertainty?: UncertaintyMetrics;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PredictionExplanation {
  featureImportance: Record<string, number>;
  decisionPath?: string[];
  reasoning: string;
  confidenceFactors: string[];
}

export interface UncertaintyMetrics {
  variance: number;
  standardError: number;
  confidenceInterval: [number, number];
  predictionInterval: [number, number];
}

export class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine;
  private queries: Map<string, AnalyticsQuery> = new Map();
  private results: Map<string, AnalyticsResult> = new Map();
  private reports: Map<string, BusinessIntelligenceReport> = new Map();
  private models: Map<string, PredictiveModel> = new Map();
  private predictions: Map<string, PredictionResult> = new Map();

  private constructor() {
    this.initializeDefaultQueries();
    this.initializeDefaultModels();
  }

  public static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  // Query Management
  async createQuery(query: Omit<AnalyticsQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsQuery> {
    const analyticsQuery: AnalyticsQuery = {
      id: crypto.randomUUID(),
      ...query,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queries.set(analyticsQuery.id, analyticsQuery);

    try {
      await auditLogger.logUserAction('analytics_query_created', {
        queryId: analyticsQuery.id,
        name: analyticsQuery.name,
        type: analyticsQuery.type
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return analyticsQuery;
  }

  async executeQuery(queryId: string, parameters?: Record<string, any>): Promise<AnalyticsResult> {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error('Analytics query not found');
    }

    const startTime = Date.now();
    
    try {
      // Simulate query execution based on type
      const data = await this.executeAnalyticsQuery(query, parameters);
      const summary = this.generateSummary(data);
      const insights = this.generateInsights(data, query);

      const result: AnalyticsResult = {
        id: crypto.randomUUID(),
        queryId,
        data,
        summary: {
          ...summary,
          insights
        },
        metadata: {
          query,
          executionTime: Date.now() - startTime,
          dataSource: 'simulated',
          cacheHit: false,
          version: '1.0.0',
          generatedAt: new Date()
        },
        executionTime: Date.now() - startTime,
        createdAt: new Date()
      };

      this.results.set(result.id, result);

      try {
        await auditLogger.logUserAction('analytics_query_executed', {
          queryId,
          resultId: result.id,
          executionTime: result.executionTime
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Business Intelligence Reports
  async createReport(report: Omit<BusinessIntelligenceReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessIntelligenceReport> {
    const biReport: BusinessIntelligenceReport = {
      id: crypto.randomUUID(),
      ...report,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reports.set(biReport.id, biReport);

    try {
      await auditLogger.logUserAction('bi_report_created', {
        reportId: biReport.id,
        name: biReport.name,
        type: biReport.type
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return biReport;
  }

  async generateReport(reportId: string, filters?: Record<string, any>): Promise<BusinessIntelligenceReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Execute all queries in the report
    const queryResults: AnalyticsResult[] = [];
    for (const queryId of report.queries) {
      try {
        const result = await this.executeQuery(queryId, filters);
        queryResults.push(result);
      } catch (error) {
        console.error(`Failed to execute query ${queryId}:`, error);
      }
    }

    // Generate visualizations
    const updatedVisualizations = await this.generateVisualizations(report.visualizations, queryResults);

    const updatedReport: BusinessIntelligenceReport = {
      ...report,
      visualizations: updatedVisualizations,
      updatedAt: new Date()
    };

    this.reports.set(reportId, updatedReport);

    try {
      await auditLogger.logUserAction('bi_report_generated', {
        reportId,
        queryCount: queryResults.length
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return updatedReport;
  }

  // Predictive Analytics
  async createModel(model: Omit<PredictiveModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<PredictiveModel> {
    const predictiveModel: PredictiveModel = {
      id: crypto.randomUUID(),
      ...model,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.models.set(predictiveModel.id, predictiveModel);

    try {
      await auditLogger.logUserAction('predictive_model_created', {
        modelId: predictiveModel.id,
        name: predictiveModel.name,
        type: predictiveModel.type
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return predictiveModel;
  }

  async trainModel(modelId: string, trainingData: any[]): Promise<PredictiveModel> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    model.status = 'training';
    this.models.set(modelId, model);

    // Simulate training process
    await this.simulateModelTraining(model, trainingData);

    model.status = 'ready';
    model.lastTrained = new Date();
    model.accuracy = Math.random() * 0.3 + 0.7; // 70-100%
    model.precision = Math.random() * 0.2 + 0.8; // 80-100%
    model.recall = Math.random() * 0.2 + 0.8; // 80-100%
    model.f1Score = (2 * model.precision * model.recall) / (model.precision + model.recall);

    this.models.set(modelId, model);

    try {
      await auditLogger.logUserAction('predictive_model_trained', {
        modelId,
        accuracy: model.accuracy,
        trainingSamples: trainingData.length
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return model;
  }

  async makePrediction(request: Omit<PredictionRequest, 'id' | 'createdAt'>): Promise<PredictionResult> {
    const model = this.models.get(request.modelId);
    if (!model || model.status !== 'ready') {
      throw new Error('Model not found or not ready');
    }

    const predictionRequest: PredictionRequest = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date()
    };

    // Simulate prediction
    const prediction = await this.simulatePrediction(model, request.inputData);
    const confidence = Math.random() * 0.3 + 0.7; // 70-100%

    const result: PredictionResult = {
      id: crypto.randomUUID(),
      requestId: predictionRequest.id,
      modelId: request.modelId,
      prediction,
      confidence,
      probabilities: request.options.returnProbabilities ? this.generateProbabilities(model) : undefined,
      explanation: request.options.explainPrediction ? this.generateExplanation(model, request.inputData) : undefined,
      uncertainty: request.options.includeUncertainty ? this.generateUncertaintyMetrics(prediction, confidence) : undefined,
      metadata: {
        modelVersion: model.version,
        algorithm: model.algorithm,
        features: model.features
      },
      createdAt: new Date()
    };

    this.predictions.set(result.id, result);

    try {
      await auditLogger.logUserAction('prediction_made', {
        modelId: request.modelId,
        predictionId: result.id,
        confidence
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return result;
  }

  // Private Methods
  private async executeAnalyticsQuery(query: AnalyticsQuery, parameters?: Record<string, any>): Promise<AnalyticsDataPoint[]> {
    const data: AnalyticsDataPoint[] = [];
    const timeRange = this.calculateTimeRange(query.timeRange);
    const points = this.getTimePoints(timeRange, query.timeRange.granularity);

    for (const point of points) {
      const dataPoint: AnalyticsDataPoint = {
        timestamp: point,
        dimensions: this.generateDimensions(query.groupBy, point),
        metrics: this.generateMetrics(query.aggregations, point),
        metadata: {
          queryType: query.type,
          parameters
        }
      };
      data.push(dataPoint);
    }

    return data;
  }

  private generateSummary(data: AnalyticsDataPoint[]): Omit<AnalyticsSummary, 'insights'> {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalValue: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0,
        medianValue: 0,
        standardDeviation: 0,
        variance: 0,
        percentiles: {},
        trends: {
          direction: 'stable',
          magnitude: 0,
          confidence: 0,
          period: 'N/A',
          changeRate: 0
        }
      };
    }

    const values = data.flatMap(d => Object.values(d.metrics));
    const totalValue = values.reduce((sum, val) => sum + val, 0);
    const averageValue = totalValue / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const sortedValues = [...values].sort((a, b) => a - b);
    const medianValue = sortedValues[Math.floor(sortedValues.length / 2)];

    const variance = values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    const percentiles: Record<number, number> = {};
    for (let p = 10; p <= 90; p += 10) {
      const index = Math.floor((p / 100) * sortedValues.length);
      percentiles[p] = sortedValues[index] || 0;
    }

    const trends = this.analyzeTrends(data);

    return {
      totalRecords: data.length,
      totalValue,
      averageValue,
      minValue,
      maxValue,
      medianValue,
      standardDeviation,
      variance,
      percentiles,
      trends
    };
  }

  private generateInsights(data: AnalyticsDataPoint[], query: AnalyticsQuery): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Trend insights
    if (data.length > 1) {
      const firstValue = Object.values(data[0].metrics)[0] || 0;
      const lastValue = Object.values(data[data.length - 1].metrics)[0] || 0;
      const changeRate = ((lastValue - firstValue) / firstValue) * 100;

      if (Math.abs(changeRate) > 10) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'trend',
          title: 'Significant Trend Detected',
          description: `Value has changed by ${changeRate.toFixed(1)}% over the period`,
          confidence: Math.min(Math.abs(changeRate) / 50, 1),
          impact: Math.abs(changeRate) > 50 ? 'high' : 'medium',
          actionable: true,
          recommendations: [
            'Monitor this trend closely',
            'Consider adjusting strategy based on trend direction'
          ],
          metadata: { changeRate, period: query.timeRange }
        });
      }
    }

    // Anomaly detection
    const values = data.flatMap(d => Object.values(d.metrics));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    for (let i = 0; i < data.length; i++) {
      const value = Object.values(data[i].metrics)[0] || 0;
      if (Math.abs(value - mean) > 2 * stdDev) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'anomaly',
          title: 'Anomaly Detected',
          description: `Unusual value detected at ${data[i].timestamp?.toISOString()}`,
          confidence: 0.8,
          impact: 'medium',
          actionable: true,
          recommendations: [
            'Investigate the cause of this anomaly',
            'Verify data quality and accuracy'
          ],
          metadata: { 
            timestamp: data[i].timestamp,
            value,
            expectedRange: [mean - stdDev, mean + stdDev]
          }
        });
        break; // Only report first anomaly
      }
    }

    return insights;
  }

  private async generateVisualizations(visualizations: ReportVisualization[], queryResults: AnalyticsResult[]): Promise<ReportVisualization[]> {
    return visualizations.map(viz => ({
      ...viz,
      data: this.generateVisualizationData(viz, queryResults)
    }));
  }

  private generateVisualizationData(visualization: ReportVisualization, queryResults: AnalyticsResult[]): any {
    // Simulate visualization data based on type
    switch (visualization.type) {
      case 'chart':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Property Values',
            data: [250000, 260000, 255000, 270000, 275000, 280000],
            borderColor: '#3A7CA5',
            backgroundColor: 'rgba(58, 124, 165, 0.1)'
          }]
        };
      case 'table':
        return {
          headers: ['Property', 'Value', 'Growth', 'Yield'],
          rows: [
            ['Property A', '£250,000', '+5.2%', '4.8%'],
            ['Property B', '£320,000', '+3.1%', '3.9%'],
            ['Property C', '£180,000', '+7.8%', '5.2%']
          ]
        };
      case 'metric':
        return {
          value: 275000,
          change: 5.2,
          changeType: 'positive',
          format: 'currency'
        };
      default:
        return {};
    }
  }

  private async simulateModelTraining(model: PredictiveModel, trainingData: any[]): Promise<void> {
    // Simulate training process
    const steps = [
      'Loading training data...',
      'Preprocessing features...',
      'Training model...',
      'Validating model...',
      'Optimizing parameters...',
      'Finalizing model...'
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async simulatePrediction(model: PredictiveModel, inputData: Record<string, any>): Promise<any> {
    // Simulate prediction based on model type
    switch (model.type) {
      case 'regression':
        return Math.random() * 200000 + 100000; // Property value prediction
      case 'classification':
        return Math.random() > 0.5 ? 'BUY' : 'HOLD';
      case 'time_series':
        return Math.random() * 0.1 + 0.95; // Growth rate prediction
      default:
        return Math.random();
    }
  }

  private generateProbabilities(model: PredictiveModel): Record<string, number> {
    const probabilities: Record<string, number> = {};
    const total = Math.random() * 0.4 + 0.6; // 60-100%
    
    if (model.type === 'classification') {
      probabilities['BUY'] = total * 0.6;
      probabilities['HOLD'] = total * 0.3;
      probabilities['SELL'] = total * 0.1;
    }
    
    return probabilities;
  }

  private generateExplanation(model: PredictiveModel, inputData: Record<string, any>): PredictionExplanation {
    const featureImportance: Record<string, number> = {};
    model.features.forEach(feature => {
      featureImportance[feature] = Math.random();
    });

    return {
      featureImportance,
      reasoning: `Based on the input features, the model predicts this outcome due to strong indicators in ${Object.keys(featureImportance).slice(0, 2).join(' and ')}.`,
      confidenceFactors: [
        'Historical data consistency',
        'Feature correlation strength',
        'Model training accuracy'
      ]
    };
  }

  private generateUncertaintyMetrics(prediction: any, confidence: number): UncertaintyMetrics {
    const variance = (1 - confidence) * 0.1;
    const standardError = Math.sqrt(variance);
    const margin = 1.96 * standardError; // 95% confidence interval

    return {
      variance,
      standardError,
      confidenceInterval: [prediction - margin, prediction + margin],
      predictionInterval: [prediction - margin * 1.5, prediction + margin * 1.5]
    };
  }

  private calculateTimeRange(timeRange: TimeRange): { start: Date; end: Date } {
    return {
      start: timeRange.start,
      end: timeRange.end
    };
  }

  private getTimePoints(timeRange: { start: Date; end: Date }, granularity: string): Date[] {
    const points: Date[] = [];
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    
    let current = new Date(start);
    while (current <= end) {
      points.push(new Date(current));
      
      switch (granularity) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }
    
    return points;
  }

  private generateDimensions(groupBy: string[], timestamp: Date): Record<string, any> {
    const dimensions: Record<string, any> = {};
    
    groupBy.forEach(field => {
      switch (field) {
        case 'region':
          dimensions[field] = ['London', 'Manchester', 'Birmingham'][Math.floor(Math.random() * 3)];
          break;
        case 'propertyType':
          dimensions[field] = ['House', 'Flat', 'Terraced'][Math.floor(Math.random() * 3)];
          break;
        case 'date':
          dimensions[field] = timestamp.toISOString().split('T')[0];
          break;
        default:
          dimensions[field] = `value_${Math.floor(Math.random() * 10)}`;
      }
    });
    
    return dimensions;
  }

  private generateMetrics(aggregations: AnalyticsAggregation[], timestamp: Date): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    aggregations.forEach(agg => {
      const alias = agg.alias || `${agg.function}_${agg.field}`;
      
      switch (agg.function) {
        case 'count':
          metrics[alias] = Math.floor(Math.random() * 100) + 10;
          break;
        case 'sum':
          metrics[alias] = Math.floor(Math.random() * 1000000) + 100000;
          break;
        case 'avg':
          metrics[alias] = Math.floor(Math.random() * 500000) + 200000;
          break;
        case 'min':
          metrics[alias] = Math.floor(Math.random() * 200000) + 100000;
          break;
        case 'max':
          metrics[alias] = Math.floor(Math.random() * 500000) + 300000;
          break;
        default:
          metrics[alias] = Math.random() * 100;
      }
    });
    
    return metrics;
  }

  private analyzeTrends(data: AnalyticsDataPoint[]): TrendAnalysis {
    if (data.length < 2) {
      return {
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        period: 'N/A',
        changeRate: 0
      };
    }

    const values = data.map(d => Object.values(d.metrics)[0] || 0);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changeRate = ((lastValue - firstValue) / firstValue) * 100;

    let direction: 'up' | 'down' | 'stable' | 'volatile';
    if (Math.abs(changeRate) < 5) {
      direction = 'stable';
    } else if (changeRate > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    // Check for volatility
    const variance = values.reduce((sum, val, i) => {
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      return sum + Math.pow(val - avg, 2);
    }, 0) / values.length;

    if (variance > Math.pow(firstValue * 0.1, 2)) {
      direction = 'volatile';
    }

    return {
      direction,
      magnitude: Math.abs(changeRate),
      confidence: Math.min(Math.abs(changeRate) / 20, 1),
      period: `${data.length} periods`,
      changeRate
    };
  }

  private initializeDefaultQueries(): void {
    const defaultQueries: AnalyticsQuery[] = [
      {
        id: crypto.randomUUID(),
        name: 'Property Value Trends',
        description: 'Analyze property value trends over time',
        type: 'property',
        filters: [],
        aggregations: [
          { field: 'price', function: 'avg', alias: 'average_price' },
          { field: 'price', function: 'count', alias: 'property_count' }
        ],
        timeRange: {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'month'
        },
        groupBy: ['region', 'propertyType'],
        orderBy: [{ field: 'timestamp', direction: 'asc' }],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Market Performance Analysis',
        description: 'Comprehensive market performance metrics',
        type: 'market',
        filters: [],
        aggregations: [
          { field: 'sales_volume', function: 'sum', alias: 'total_sales' },
          { field: 'average_price', function: 'avg', alias: 'market_average' },
          { field: 'growth_rate', function: 'avg', alias: 'average_growth' }
        ],
        timeRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'week'
        },
        groupBy: ['region'],
        orderBy: [{ field: 'total_sales', direction: 'desc' }],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultQueries.forEach(query => {
      this.queries.set(query.id, query);
    });
  }

  private initializeDefaultModels(): void {
    const defaultModels: PredictiveModel[] = [
      {
        id: crypto.randomUUID(),
        name: 'Property Value Predictor',
        description: 'Predicts property values based on location and features',
        type: 'regression',
        algorithm: 'Random Forest',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        trainingData: {
          source: 'property_sales_data',
          size: 10000,
          features: 15,
          samples: 10000,
          quality: 0.92,
          lastUpdated: new Date()
        },
        parameters: {
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 5
        },
        features: ['location', 'bedrooms', 'bathrooms', 'property_type', 'age', 'condition'],
        target: 'price',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTrained: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Investment Recommendation Engine',
        description: 'Classifies properties as BUY, HOLD, or SELL',
        type: 'classification',
        algorithm: 'Gradient Boosting',
        version: '1.0.0',
        status: 'ready',
        accuracy: 0.78,
        precision: 0.75,
        recall: 0.80,
        f1Score: 0.77,
        trainingData: {
          source: 'investment_history',
          size: 5000,
          features: 12,
          samples: 5000,
          quality: 0.88,
          lastUpdated: new Date()
        },
        parameters: {
          learning_rate: 0.1,
          n_estimators: 200,
          max_depth: 6
        },
        features: ['price', 'location_score', 'growth_potential', 'rental_yield', 'market_trend'],
        target: 'recommendation',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTrained: new Date()
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  // Public getters
  getQuery(queryId: string): AnalyticsQuery | null {
    return this.queries.get(queryId) || null;
  }

  getAllQueries(): AnalyticsQuery[] {
    return Array.from(this.queries.values());
  }

  getResult(resultId: string): AnalyticsResult | null {
    return this.results.get(resultId) || null;
  }

  getAllResults(): AnalyticsResult[] {
    return Array.from(this.results.values());
  }

  getReport(reportId: string): BusinessIntelligenceReport | null {
    return this.reports.get(reportId) || null;
  }

  getAllReports(): BusinessIntelligenceReport[] {
    return Array.from(this.reports.values());
  }

  getModel(modelId: string): PredictiveModel | null {
    return this.models.get(modelId) || null;
  }

  getAllModels(): PredictiveModel[] {
    return Array.from(this.models.values());
  }

  getPrediction(predictionId: string): PredictionResult | null {
    return this.predictions.get(predictionId) || null;
  }

  getAllPredictions(): PredictionResult[] {
    return Array.from(this.predictions.values());
  }

  getAnalyticsStats(): {
    totalQueries: number;
    totalResults: number;
    totalReports: number;
    totalModels: number;
    totalPredictions: number;
    averageExecutionTime: number;
    cacheHitRate: number;
  } {
    const queries = this.getAllQueries();
    const results = this.getAllResults();
    const reports = this.getAllReports();
    const models = this.getAllModels();
    const predictions = this.getAllPredictions();

    const totalQueries = queries.length;
    const totalResults = results.length;
    const totalReports = reports.length;
    const totalModels = models.length;
    const totalPredictions = predictions.length;

    const averageExecutionTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.executionTime, 0) / results.length 
      : 0;

    const cacheHitRate = results.length > 0 
      ? results.filter(r => r.metadata.cacheHit).length / results.length 
      : 0;

    return {
      totalQueries,
      totalResults,
      totalReports,
      totalModels,
      totalPredictions,
      averageExecutionTime,
      cacheHitRate
    };
  }
}

// Export singleton instance
export const advancedAnalyticsEngine = AdvancedAnalyticsEngine.getInstance();
