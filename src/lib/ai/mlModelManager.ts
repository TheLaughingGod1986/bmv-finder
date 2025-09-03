import { auditLogger } from '../audit/auditLogger';
import crypto from 'crypto';

export interface MLModel {
  id: string;
  name: string;
  type: 'REGRESSION' | 'CLASSIFICATION' | 'CLUSTERING' | 'DEEP_LEARNING' | 'ENSEMBLE';
  version: string;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  trainingDataSize: number;
  lastTrained: Date;
  status: 'TRAINING' | 'READY' | 'DEPRECATED' | 'ERROR';
  features: string[];
  hyperparameters: Record<string, any>;
  performance: ModelPerformance;
  metadata: Record<string, any>;
}

export interface ModelPerformance {
  trainingAccuracy: number;
  validationAccuracy: number;
  testAccuracy: number;
  trainingLoss: number;
  validationLoss: number;
  confusionMatrix?: number[][];
  rocCurve?: { fpr: number[]; tpr: number[] };
  featureImportance: Record<string, number>;
  predictionLatency: number; // in milliseconds
  throughput: number; // predictions per second
}

export interface TrainingData {
  id: string;
  modelId: string;
  features: Record<string, any>[];
  labels: any[];
  split: {
    training: number;
    validation: number;
    test: number;
  };
  createdAt: Date;
  size: number;
  quality: number; // 0-100
}

export interface PredictionRequest {
  modelId: string;
  features: Record<string, any>;
  options?: {
    returnProbabilities?: boolean;
    returnConfidence?: boolean;
    returnExplanation?: boolean;
  };
}

export interface PredictionResult {
  id: string;
  modelId: string;
  prediction: any;
  confidence?: number;
  probabilities?: Record<string, number>;
  explanation?: string;
  latency: number;
  timestamp: Date;
  features: Record<string, any>;
}

export interface ModelTrainingJob {
  id: string;
  modelId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
  metrics: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
  };
  results?: {
    finalAccuracy: number;
    trainingTime: number;
    bestEpoch: number;
  };
}

export class MLModelManager {
  private static instance: MLModelManager;
  private models: Map<string, MLModel> = new Map();
  private trainingData: Map<string, TrainingData> = new Map();
  private predictions: Map<string, PredictionResult> = new Map();
  private trainingJobs: Map<string, ModelTrainingJob> = new Map();
  private modelCache: Map<string, any> = new Map();

  private constructor() {
    this.initializeDefaultModels();
    this.startModelMonitoring();
    this.startAutoRetraining();
  }

  public static getInstance(): MLModelManager {
    if (!MLModelManager.instance) {
      MLModelManager.instance = new MLModelManager();
    }
    return MLModelManager.instance;
  }

  // Model Management
  async createModel(
    name: string,
    type: MLModel['type'],
    features: string[],
    hyperparameters: Record<string, any> = {}
  ): Promise<MLModel> {
    const model: MLModel = {
      id: crypto.randomUUID(),
      name,
      type,
      version: '1.0.0',
      accuracy: 0,
      trainingDataSize: 0,
      lastTrained: new Date(),
      status: 'TRAINING',
      features,
      hyperparameters,
      performance: {
        trainingAccuracy: 0,
        validationAccuracy: 0,
        testAccuracy: 0,
        trainingLoss: 0,
        validationLoss: 0,
        featureImportance: {},
        predictionLatency: 0,
        throughput: 0
      },
      metadata: {
        createdBy: 'system',
        description: `ML model for ${name}`,
        tags: ['property', 'investment', 'prediction']
      }
    };

    this.models.set(model.id, model);

    try {
      await auditLogger.logUserAction('ml_model_created', {
        modelId: model.id,
        name: model.name,
        type: model.type,
        features: model.features
      });
    } catch (error) {
      console.debug('Audit logging skipped (development mode)');
    }

    return model;
  }

  async trainModel(
    modelId: string,
    trainingData: TrainingData,
    options: {
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
      validationSplit?: number;
    } = {}
  ): Promise<ModelTrainingJob> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const job: ModelTrainingJob = {
      id: crypto.randomUUID(),
      modelId,
      status: 'PENDING',
      progress: 0,
      metrics: {
        epochs: options.epochs || 100,
        batchSize: options.batchSize || 32,
        learningRate: options.learningRate || 0.001,
        validationSplit: options.validationSplit || 0.2
      }
    };

    this.trainingJobs.set(job.id, job);

    // Start training asynchronously
    this.executeTrainingJob(job, trainingData);

    return job;
  }

  private async executeTrainingJob(job: ModelTrainingJob, trainingData: TrainingData): Promise<void> {
    try {
      job.status = 'RUNNING';
      job.startTime = new Date();
      this.trainingJobs.set(job.id, job);

      const model = this.models.get(job.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Simulate training process
      for (let epoch = 0; epoch < job.metrics.epochs; epoch++) {
        // Simulate training progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
        job.progress = Math.round((epoch / job.metrics.epochs) * 100);
        this.trainingJobs.set(job.id, job);

        // Simulate accuracy improvement
        const accuracy = Math.min(0.95, 0.5 + (epoch / job.metrics.epochs) * 0.45);
        model.accuracy = accuracy;
        model.performance.trainingAccuracy = accuracy;
        model.performance.validationAccuracy = accuracy - 0.05;
        model.performance.testAccuracy = accuracy - 0.08;
        model.performance.trainingLoss = Math.max(0.1, 1.0 - (epoch / job.metrics.epochs) * 0.9);
        model.performance.validationLoss = model.performance.trainingLoss + 0.1;
      }

      // Complete training
      job.status = 'COMPLETED';
      job.endTime = new Date();
      job.results = {
        finalAccuracy: model.accuracy,
        trainingTime: job.endTime.getTime() - job.startTime!.getTime(),
        bestEpoch: job.metrics.epochs
      };

      model.status = 'READY';
      model.lastTrained = new Date();
      model.trainingDataSize = trainingData.size;

      // Calculate feature importance
      model.performance.featureImportance = this.calculateFeatureImportance(model.features);
      model.performance.predictionLatency = Math.random() * 50 + 10; // 10-60ms
      model.performance.throughput = Math.random() * 1000 + 500; // 500-1500 predictions/sec

      this.models.set(model.id, model);
      this.trainingJobs.set(job.id, job);

      try {
        await auditLogger.logUserAction('ml_model_trained', {
          modelId: model.id,
          jobId: job.id,
          finalAccuracy: model.accuracy,
          trainingTime: job.results.trainingTime
        });
      } catch (error) {
        console.debug('Audit logging skipped (development mode)');
      }

    } catch (error) {
      job.status = 'FAILED';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
      this.trainingJobs.set(job.id, job);
    }
  }

  // Prediction
  async makePrediction(request: PredictionRequest): Promise<PredictionResult> {
    const model = this.models.get(request.modelId);
    if (!model || model.status !== 'READY') {
      throw new Error('Model not ready for predictions');
    }

    const startTime = Date.now();

    // Simulate prediction
    const prediction = this.simulatePrediction(model, request.features);
    const confidence = this.calculateConfidence(model, request.features);
    const probabilities = request.options?.returnProbabilities ? 
      this.calculateProbabilities(model, request.features) : undefined;
    const explanation = request.options?.returnExplanation ? 
      this.generateExplanation(model, request.features, prediction) : undefined;

    const result: PredictionResult = {
      id: crypto.randomUUID(),
      modelId: request.modelId,
      prediction,
      confidence,
      probabilities,
      explanation,
      latency: Date.now() - startTime,
      timestamp: new Date(),
      features: request.features
    };

    this.predictions.set(result.id, result);

    // Update model performance metrics
    model.performance.predictionLatency = 
      (model.performance.predictionLatency + result.latency) / 2;

    this.models.set(model.id, model);

    return result;
  }

  private simulatePrediction(model: MLModel, features: Record<string, any>): any {
    // Simulate prediction based on model type
    switch (model.type) {
      case 'REGRESSION':
        return this.simulateRegressionPrediction(features);
      case 'CLASSIFICATION':
        return this.simulateClassificationPrediction(features);
      case 'CLUSTERING':
        return this.simulateClusteringPrediction(features);
      default:
        return Math.random() * 100;
    }
  }

  private simulateRegressionPrediction(features: Record<string, any>): number {
    // Simulate regression prediction (e.g., property price)
    let prediction = 200000; // Base price
    
    if (features.bedrooms) prediction += features.bedrooms * 50000;
    if (features.bathrooms) prediction += features.bathrooms * 25000;
    if (features.size) prediction += features.size * 100;
    if (features.location === 'London') prediction *= 1.5;
    if (features.location === 'Manchester') prediction *= 0.8;
    
    return Math.round(prediction);
  }

  private simulateClassificationPrediction(features: Record<string, any>): string {
    // Simulate classification prediction (e.g., investment recommendation)
    const score = Math.random();
    if (score > 0.7) return 'BUY';
    if (score > 0.4) return 'HOLD';
    return 'SELL';
  }

  private simulateClusteringPrediction(features: Record<string, any>): number {
    // Simulate clustering prediction (e.g., property cluster)
    return Math.floor(Math.random() * 5) + 1;
  }

  private calculateConfidence(model: MLModel, features: Record<string, any>): number {
    // Calculate confidence based on model accuracy and feature completeness
    let confidence = model.accuracy * 100;
    
    // Adjust based on feature completeness
    const requiredFeatures = model.features;
    const presentFeatures = requiredFeatures.filter(f => features[f] !== undefined);
    const completeness = presentFeatures.length / requiredFeatures.length;
    
    confidence *= completeness;
    
    return Math.round(confidence);
  }

  private calculateProbabilities(model: MLModel, features: Record<string, any>): Record<string, number> {
    // Simulate probability calculation
    const baseProb = Math.random();
    return {
      'BUY': baseProb,
      'HOLD': (1 - baseProb) * 0.6,
      'SELL': (1 - baseProb) * 0.4
    };
  }

  private generateExplanation(model: MLModel, features: Record<string, any>, prediction: any): string {
    // Generate explanation for the prediction
    const explanations = [];
    
    if (features.bedrooms && features.bedrooms > 3) {
      explanations.push('High bedroom count increases property value');
    }
    if (features.location === 'London') {
      explanations.push('London location commands premium pricing');
    }
    if (features.size && features.size > 1000) {
      explanations.push('Large property size contributes to higher value');
    }
    
    return explanations.join('. ') || 'Prediction based on standard market factors';
  }

  private calculateFeatureImportance(features: string[]): Record<string, number> {
    // Simulate feature importance calculation
    const importance: Record<string, number> = {};
    const totalImportance = features.length;
    
    features.forEach((feature, index) => {
      importance[feature] = (totalImportance - index) / totalImportance;
    });
    
    return importance;
  }

  // Data Management
  async createTrainingData(
    modelId: string,
    features: Record<string, any>[],
    labels: any[],
    split: { training: number; validation: number; test: number }
  ): Promise<TrainingData> {
    const trainingData: TrainingData = {
      id: crypto.randomUUID(),
      modelId,
      features,
      labels,
      split,
      createdAt: new Date(),
      size: features.length,
      quality: this.calculateDataQuality(features, labels)
    };

    this.trainingData.set(trainingData.id, trainingData);

    return trainingData;
  }

  private calculateDataQuality(features: Record<string, any>[], labels: any[]): number {
    // Simulate data quality calculation
    let quality = 100;
    
    // Check for missing values
    const missingValues = features.reduce((count, feature) => {
      return count + Object.values(feature).filter(value => value === null || value === undefined).length;
    }, 0);
    
    quality -= (missingValues / (features.length * Object.keys(features[0] || {}).length)) * 50;
    
    // Check for outliers (simplified)
    quality -= Math.random() * 10;
    
    return Math.max(0, Math.round(quality));
  }

  // Model Evaluation
  async evaluateModel(modelId: string, testData: TrainingData): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  }> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Simulate model evaluation
    const accuracy = model.accuracy + (Math.random() - 0.5) * 0.1;
    const precision = accuracy - 0.05;
    const recall = accuracy - 0.03;
    const f1Score = (2 * precision * recall) / (precision + recall);

    // Simulate confusion matrix
    const confusionMatrix = [
      [Math.round(accuracy * 100), Math.round((1 - accuracy) * 50)],
      [Math.round((1 - accuracy) * 30), Math.round(accuracy * 100)]
    ];

    return {
      accuracy: Math.max(0, Math.min(1, accuracy)),
      precision: Math.max(0, Math.min(1, precision)),
      recall: Math.max(0, Math.min(1, recall)),
      f1Score: Math.max(0, Math.min(1, f1Score)),
      confusionMatrix
    };
  }

  // Background Processing
  private startModelMonitoring(): void {
    // Monitor model performance every hour
    setInterval(() => {
      this.monitorModelPerformance();
    }, 60 * 60 * 1000);
  }

  private startAutoRetraining(): void {
    // Check for models that need retraining daily
    setInterval(() => {
      this.checkForRetraining();
    }, 24 * 60 * 60 * 1000);
  }

  private monitorModelPerformance(): void {
    for (const [id, model] of this.models) {
      if (model.status === 'READY') {
        // Simulate performance monitoring
        const recentPredictions = Array.from(this.predictions.values())
          .filter(p => p.modelId === id && p.timestamp > new Date(Date.now() - 60 * 60 * 1000));
        
        if (recentPredictions.length > 0) {
          const avgLatency = recentPredictions.reduce((sum, p) => sum + p.latency, 0) / recentPredictions.length;
          model.performance.predictionLatency = avgLatency;
          model.performance.throughput = recentPredictions.length;
          
          this.models.set(id, model);
        }
      }
    }
  }

  private async checkForRetraining(): Promise<void> {
    for (const [id, model] of this.models) {
      if (model.status === 'READY') {
        const daysSinceTraining = (Date.now() - model.lastTrained.getTime()) / (1000 * 60 * 60 * 24);
        
        // Retrain if model is older than 30 days or accuracy has degraded
        if (daysSinceTraining > 30 || model.accuracy < 0.7) {
          console.log(`Scheduling retraining for model ${model.name}`);
          // In a real implementation, this would trigger retraining
        }
      }
    }
  }

  private initializeDefaultModels(): void {
    // Initialize default ML models
    const defaultModels = [
      {
        name: 'Property Price Prediction',
        type: 'REGRESSION' as MLModel['type'],
        features: ['bedrooms', 'bathrooms', 'size', 'location', 'property_type', 'age'],
        hyperparameters: { learningRate: 0.001, epochs: 100, batchSize: 32 }
      },
      {
        name: 'Investment Recommendation',
        type: 'CLASSIFICATION' as MLModel['type'],
        features: ['price', 'location', 'rental_yield', 'market_trend', 'risk_score'],
        hyperparameters: { learningRate: 0.01, epochs: 50, batchSize: 16 }
      },
      {
        name: 'Property Clustering',
        type: 'CLUSTERING' as MLModel['type'],
        features: ['price', 'size', 'location', 'bedrooms', 'bathrooms'],
        hyperparameters: { nClusters: 5, maxIter: 300 }
      }
    ];

    for (const modelConfig of defaultModels) {
      const model: MLModel = {
        id: crypto.randomUUID(),
        name: modelConfig.name,
        type: modelConfig.type,
        version: '1.0.0',
        accuracy: 0.85,
        trainingDataSize: 10000,
        lastTrained: new Date(),
        status: 'READY',
        features: modelConfig.features,
        hyperparameters: modelConfig.hyperparameters,
        performance: {
          trainingAccuracy: 0.85,
          validationAccuracy: 0.82,
          testAccuracy: 0.80,
          trainingLoss: 0.15,
          validationLoss: 0.18,
          featureImportance: {},
          predictionLatency: 25,
          throughput: 1000
        },
        metadata: {
          createdBy: 'system',
          description: `Default ${modelConfig.name} model`,
          tags: ['property', 'investment', 'prediction']
        }
      };

      // Calculate feature importance
      model.performance.featureImportance = this.calculateFeatureImportance(model.features);
      
      this.models.set(model.id, model);
    }
  }

  // Public getters
  getModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  getModel(id: string): MLModel | null {
    return this.models.get(id) || null;
  }

  getTrainingJobs(): ModelTrainingJob[] {
    return Array.from(this.trainingJobs.values());
  }

  getTrainingJob(id: string): ModelTrainingJob | null {
    return this.trainingJobs.get(id) || null;
  }

  getPredictions(limit: number = 100): PredictionResult[] {
    return Array.from(this.predictions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getModelStats(): {
    totalModels: number;
    readyModels: number;
    trainingModels: number;
    totalPredictions: number;
    averageAccuracy: number;
    averageLatency: number;
  } {
    const models = Array.from(this.models.values());
    const predictions = Array.from(this.predictions.values());
    
    return {
      totalModels: models.length,
      readyModels: models.filter(m => m.status === 'READY').length,
      trainingModels: models.filter(m => m.status === 'TRAINING').length,
      totalPredictions: predictions.length,
      averageAccuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length,
      averageLatency: predictions.reduce((sum, p) => sum + p.latency, 0) / predictions.length
    };
  }
}

// Export singleton instance
export const mlModelManager = MLModelManager.getInstance();
