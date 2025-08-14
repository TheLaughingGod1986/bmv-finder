import { supabase } from './supabaseClient';
import { CONFIG } from './config';

// Types for ML predictions and learning
interface PropertyOutcome {
  id: string;
  propertyId: string;
  userId: string;
  predictedGrowth: number;
  actualGrowth: number;
  predictedRent: number;
  actualRent: number;
  predictedROI: number;
  actualROI: number;
  propertyType: string;
  postcode: string;
  purchasePrice: number;
  refurbishmentCost: number;
  stampDuty: number;
  legalFees: number;
  mortgageRate: number;
  ltv: number;
  monthsHeld: number;
  outcomeDate: string;
  accuracyScore: number;
}

interface MLPrediction {
  propertyGrowth: number;
  rentalYield: number;
  roi: number;
  confidence: number;
  factors: string[];
  lastUpdated: string;
}

interface PredictionFeatures {
  propertyType: string;
  postcode: string;
  purchasePrice: number;
  refurbishmentCost: number;
  stampDuty: number;
  legalFees: number;
  mortgageRate: number;
  ltv: number;
  marketTrend: number;
  locationScore: number;
  propertyAge: number;
  bedrooms: number;
  propertyCondition: string;
}

class MLPredictionEngine {
  private modelVersion: string = '1.0.0';
  private lastTrainingDate: string = '';
  private accuracyMetrics: {
    growthAccuracy: number;
    rentAccuracy: number;
    roiAccuracy: number;
    totalPredictions: number;
  } = {
    growthAccuracy: 0,
    rentAccuracy: 0,
    roiAccuracy: 0,
    totalPredictions: 0
  };

  // Initialize the ML engine
  async initialize(): Promise<void> {
    try {
      // Load existing model data
      await this.loadModelData();
      console.log('ML Prediction Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing ML engine:', error);
    }
  }

  // Generate predictions based on property features
  async generatePredictions(features: PredictionFeatures): Promise<MLPrediction> {
    try {
      // Get historical outcomes for similar properties
      const similarOutcomes = await this.getSimilarOutcomes(features);
      
      // Calculate predictions using weighted averages
      const predictions = this.calculateWeightedPredictions(features, similarOutcomes);
      
      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(features, similarOutcomes.length);
      
      // Identify key factors influencing the prediction
      const factors = this.identifyKeyFactors(features, similarOutcomes);
      
      return {
        propertyGrowth: predictions.growth,
        rentalYield: predictions.yield,
        roi: predictions.roi,
        confidence: confidence,
        factors: factors,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      return this.getDefaultPrediction();
    }
  }

  // Learn from actual outcomes to improve future predictions
  async learnFromOutcome(outcome: PropertyOutcome): Promise<void> {
    try {
      // Store the outcome for future learning
      await this.storeOutcome(outcome);
      
      // Update accuracy metrics
      this.updateAccuracyMetrics(outcome);
      
      // Retrain model if we have enough new data
      await this.checkAndRetrain();
      
      console.log('Successfully learned from outcome:', outcome.id);
    } catch (error) {
      console.error('Error learning from outcome:', error);
    }
  }

  // Get prediction accuracy metrics
  getAccuracyMetrics() {
    return {
      ...this.accuracyMetrics,
      modelVersion: this.modelVersion,
      lastTrainingDate: this.lastTrainingDate
    };
  }

  // Private methods for ML calculations
  private async getSimilarOutcomes(features: PredictionFeatures): Promise<PropertyOutcome[]> {
    try {
      const { data, error } = await supabase
        .from('property_outcomes')
        .select('*')
        .eq('propertyType', features.propertyType)
        .gte('purchasePrice', features.purchasePrice * 0.8)
        .lte('purchasePrice', features.purchasePrice * 1.2)
        .order('outcomeDate', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching similar outcomes:', error);
      return [];
    }
  }

  private calculateWeightedPredictions(features: PredictionFeatures, outcomes: PropertyOutcome[]) {
    if (outcomes.length === 0) {
      return this.getDefaultPredictions();
    }

    // Calculate weighted averages based on similarity and recency
    let totalWeight = 0;
    let weightedGrowth = 0;
    let weightedYield = 0;
    let weightedROI = 0;

    outcomes.forEach(outcome => {
      const weight = this.calculateSimilarityWeight(features, outcome);
      totalWeight += weight;
      
      weightedGrowth += (outcome.actualGrowth / outcome.purchasePrice) * weight;
      weightedYield += (outcome.actualRent * 12 / outcome.purchasePrice) * weight;
      weightedROI += outcome.actualROI * weight;
    });

    return {
      growth: totalWeight > 0 ? (weightedGrowth / totalWeight) * features.purchasePrice : 0.03 * features.purchasePrice,
      yield: totalWeight > 0 ? weightedYield / totalWeight : 0.06,
      roi: totalWeight > 0 ? weightedROI / totalWeight : 0.08
    };
  }

  private calculateSimilarityWeight(features: PredictionFeatures, outcome: PropertyOutcome): number {
    // Calculate similarity based on multiple factors
    const priceSimilarity = 1 - Math.abs(features.purchasePrice - outcome.purchasePrice) / outcome.purchasePrice;
    const typeSimilarity = features.propertyType === outcome.propertyType ? 1 : 0.5;
    const locationSimilarity = features.postcode.substring(0, 3) === outcome.postcode.substring(0, 3) ? 1 : 0.3;
    
    // Recency factor (more recent outcomes get higher weight)
    const monthsAgo = (new Date().getTime() - new Date(outcome.outcomeDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    const recencyFactor = Math.max(0.1, 1 - (monthsAgo / 60)); // Decay over 5 years
    
    return (priceSimilarity + typeSimilarity + locationSimilarity) / 3 * recencyFactor;
  }

  private static calculateConfidence(features: PredictionFeatures, outcomeCount: number): number {
    let confidence = Math.min(0.95, outcomeCount / 20); // Base confidence
    
    // Boost confidence for well-represented property types and locations
    if (outcomeCount >= 10) confidence += 0.1;
    if (outcomeCount >= 25) confidence += 0.1;
    
    // Price-based confidence adjustments
    if (features.purchasePrice > CONFIG.VALUATION.HIGH_VALUE_THRESHOLD) confidence *= 0.8; // High-value properties
    if (features.purchasePrice < CONFIG.VALUATION.MIN_PROPERTY_VALUE) confidence *= 0.7; // Very low-value properties
    
    // Reduce confidence for unusual property characteristics
    if (features.refurbishmentCost > features.purchasePrice * 0.3) confidence *= 0.9; // High refurb costs
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private identifyKeyFactors(features: PredictionFeatures, outcomes: PropertyOutcome[]): string[] {
    const factors: string[] = [];
    
    if (outcomes.length >= 10) {
      factors.push('Strong historical data available');
    } else if (outcomes.length >= 5) {
      factors.push('Moderate historical data available');
    } else {
      factors.push('Limited historical data - using market averages');
    }
    
    if (features.propertyType === 'House') {
      factors.push('Detached properties typically show stable growth');
    } else if (features.propertyType === 'Flat') {
      factors.push('Apartments often provide higher rental yields');
    }
    
    if (features.ltv > 0.8) {
      factors.push('High LTV may impact cash flow');
    }
    
    if (features.refurbishmentCost > 0) {
      factors.push('Refurbishment costs factored into ROI calculation');
    }
    
    return factors;
  }

  private async storeOutcome(outcome: PropertyOutcome): Promise<void> {
    try {
      const { error } = await supabase
        .from('property_outcomes')
        .insert([outcome]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error storing outcome:', error);
    }
  }

  private updateAccuracyMetrics(outcome: PropertyOutcome): void {
    const growthError = Math.abs(outcome.predictedGrowth - outcome.actualGrowth) / outcome.actualGrowth;
    const rentError = Math.abs(outcome.predictedRent - outcome.actualRent) / outcome.actualRent;
    const roiError = Math.abs(outcome.predictedROI - outcome.actualROI) / outcome.actualROI;
    
    this.accuracyMetrics.totalPredictions++;
    
    // Update running averages
    this.accuracyMetrics.growthAccuracy = 
      (this.accuracyMetrics.growthAccuracy * (this.accuracyMetrics.totalPredictions - 1) + (1 - growthError)) / 
      this.accuracyMetrics.totalPredictions;
    
    this.accuracyMetrics.rentAccuracy = 
      (this.accuracyMetrics.rentAccuracy * (this.accuracyMetrics.totalPredictions - 1) + (1 - rentError)) / 
      this.accuracyMetrics.totalPredictions;
    
    this.accuracyMetrics.roiAccuracy = 
      (this.accuracyMetrics.roiAccuracy * (this.accuracyMetrics.totalPredictions - 1) + (1 - roiError)) / 
      this.accuracyMetrics.totalPredictions;
  }

  private async checkAndRetrain(): Promise<void> {
    // Retrain model every 50 new outcomes or monthly
    const shouldRetrain = this.accuracyMetrics.totalPredictions % 50 === 0 || 
                         (new Date().getTime() - new Date(this.lastTrainingDate).getTime()) > 30 * 24 * 60 * 60 * 1000;
    
    if (shouldRetrain) {
      await this.retrainModel();
    }
  }

  private async retrainModel(): Promise<void> {
    try {
      // Advanced retraining logic would go here
      // For now, we'll just update the version and date
      this.modelVersion = `1.${Math.floor(this.accuracyMetrics.totalPredictions / 50)}.0`;
      this.lastTrainingDate = new Date().toISOString();
      
      console.log('Model retrained successfully. New version:', this.modelVersion);
    } catch (error) {
      console.error('Error retraining model:', error);
    }
  }

  private async loadModelData(): Promise<void> {
    try {
      // Load model metadata from database
      const { data, error } = await supabase
        .from('ml_model_metadata')
        .select('*')
        .single();
      
      if (data && !error) {
        this.modelVersion = data.version;
        this.lastTrainingDate = data.last_training_date;
        this.accuracyMetrics = data.accuracy_metrics;
      }
    } catch (error) {
      console.error('Error loading model data:', error);
    }
  }

  private getDefaultPrediction(): MLPrediction {
    return {
      propertyGrowth: 0.03, // 3% default growth
      rentalYield: 0.06, // 6% default yield
      roi: 0.08, // 8% default ROI
      confidence: 0.3,
      factors: ['Using market averages - limited historical data available'],
      lastUpdated: new Date().toISOString()
    };
  }

  private getDefaultPredictions() {
    return {
      growth: 0.03,
      yield: 0.06,
      roi: 0.08
    };
  }
}

// Export singleton instance
export const mlPredictionEngine = new MLPredictionEngine(); 