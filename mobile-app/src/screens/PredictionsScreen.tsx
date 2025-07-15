import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Prediction {
  id: string;
  postcode: string;
  currentValue: number;
  predictedValue: number;
  growthRate: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  lastUpdated: string;
}

interface MarketInsight {
  area: string;
  trend: string;
  confidence: number;
  recommendation: string;
}

export default function PredictionsScreen({ navigation }: any) {
  const [postcode, setPostcode] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedPredictions, setSavedPredictions] = useState<Prediction[]>([]);

  // Mock data - replace with API calls
  const mockPredictions: Prediction[] = [
    {
      id: '1',
      postcode: 'M1 1AA',
      currentValue: 285000,
      predictedValue: 315000,
      growthRate: 10.5,
      confidence: 87,
      timeframe: '12 months',
      factors: ['Transport links', 'Regeneration', 'Employment growth'],
      lastUpdated: '2024-01-15',
    },
    {
      id: '2',
      postcode: 'B1 1AA',
      currentValue: 320000,
      predictedValue: 345000,
      growthRate: 7.8,
      confidence: 82,
      timeframe: '12 months',
      factors: ['City center location', 'Infrastructure investment'],
      lastUpdated: '2024-01-14',
    },
  ];

  const mockMarketInsights: MarketInsight[] = [
    {
      area: 'Manchester',
      trend: 'Strong growth expected',
      confidence: 85,
      recommendation: 'Consider investment properties',
    },
    {
      area: 'Birmingham',
      trend: 'Steady appreciation',
      confidence: 78,
      recommendation: 'Good for long-term holds',
    },
    {
      area: 'Leeds',
      trend: 'Moderate growth',
      confidence: 72,
      recommendation: 'Monitor market conditions',
    },
  ];

  useEffect(() => {
    loadSavedPredictions();
    loadMarketInsights();
  }, []);

  const loadSavedPredictions = async () => {
    try {
      // Simulate loading saved predictions
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavedPredictions(mockPredictions);
    } catch (error) {
      console.error('Error loading saved predictions:', error);
    }
  };

  const loadMarketInsights = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setMarketInsights(mockMarketInsights);
    } catch (error) {
      console.error('Error loading market insights:', error);
    }
  };

  const generatePrediction = async () => {
    if (!postcode.trim()) {
      Alert.alert('Error', 'Please enter a postcode');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPrediction: Prediction = {
        id: Date.now().toString(),
        postcode: postcode.toUpperCase(),
        currentValue: Math.floor(Math.random() * 200000) + 150000,
        predictedValue: Math.floor(Math.random() * 250000) + 200000,
        growthRate: Math.random() * 15 + 5,
        confidence: Math.floor(Math.random() * 20) + 70,
        timeframe: '12 months',
        factors: ['Market analysis', 'Economic indicators', 'Local development'],
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      setPredictions([newPrediction, ...predictions]);
      setPostcode('');
      Alert.alert('Success', 'Prediction generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = (prediction: Prediction) => {
    setSavedPredictions([prediction, ...savedPredictions]);
    Alert.alert('Success', 'Prediction saved to your list');
  };

  const deletePrediction = (id: string) => {
    setSavedPredictions(savedPredictions.filter(p => p.id !== id));
    Alert.alert('Success', 'Prediction removed from your list');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#5DA271';
    if (confidence >= 60) return '#D4AF37';
    return '#E74C3C';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Property Predictions</Text>
          <Text style={styles.subtitle}>AI-powered market insights</Text>
        </View>

        {/* Prediction Generator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate New Prediction</Text>
          <View style={styles.predictionForm}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter postcode..."
                value={postcode}
                onChangeText={setPostcode}
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
            <TouchableOpacity
              style={[styles.generateButton, loading && styles.generateButtonDisabled]}
              onPress={generatePrediction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trending-up" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Prediction</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Predictions */}
        {predictions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Predictions</Text>
            {predictions.map((prediction) => (
              <View key={prediction.id} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <Text style={styles.postcode}>{prediction.postcode}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={[styles.confidenceText, { color: getConfidenceColor(prediction.confidence) }]}>
                      {getConfidenceText(prediction.confidence)} Confidence
                    </Text>
                  </View>
                </View>
                
                <View style={styles.predictionValues}>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Current Value</Text>
                    <Text style={styles.currentValue}>
                      {formatCurrency(prediction.currentValue)}
                    </Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Predicted Value</Text>
                    <Text style={styles.predictedValue}>
                      {formatCurrency(prediction.predictedValue)}
                    </Text>
                  </View>
                </View>

                <View style={styles.growthContainer}>
                  <Text style={styles.growthLabel}>Expected Growth:</Text>
                  <Text style={[styles.growthValue, { color: '#5DA271' }]}>
                    {formatPercentage(prediction.growthRate)}
                  </Text>
                </View>

                <View style={styles.factorsContainer}>
                  <Text style={styles.factorsLabel}>Key Factors:</Text>
                  {prediction.factors.map((factor, index) => (
                    <Text key={index} style={styles.factor}>
                      • {factor}
                    </Text>
                  ))}
                </View>

                <View style={styles.predictionActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => savePrediction(prediction)}
                  >
                    <Ionicons name="bookmark-outline" size={16} color="#3A7CA5" />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('HpiAnalysis', { postcode: prediction.postcode })}
                  >
                    <Ionicons name="analytics" size={16} color="#5DA271" />
                    <Text style={styles.actionButtonText}>HPI Analysis</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Saved Predictions */}
        {savedPredictions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Predictions</Text>
              <TouchableOpacity onPress={() => setSavedPredictions([])}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {savedPredictions.map((prediction) => (
              <View key={prediction.id} style={styles.savedPredictionCard}>
                <View style={styles.savedPredictionHeader}>
                  <Text style={styles.savedPostcode}>{prediction.postcode}</Text>
                  <TouchableOpacity onPress={() => deletePrediction(prediction.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
                <View style={styles.savedPredictionValues}>
                  <Text style={styles.savedValue}>
                    {formatCurrency(prediction.currentValue)} → {formatCurrency(prediction.predictedValue)}
                  </Text>
                  <Text style={[styles.savedGrowth, { color: '#5DA271' }]}>
                    {formatPercentage(prediction.growthRate)} growth
                  </Text>
                </View>
                <Text style={styles.savedConfidence}>
                  {prediction.confidence}% confidence • {prediction.timeframe}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Market Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights</Text>
          {marketInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightArea}>{insight.area}</Text>
                <View style={styles.insightConfidence}>
                  <Text style={styles.insightConfidenceText}>
                    {insight.confidence}% confidence
                  </Text>
                </View>
              </View>
              <Text style={styles.insightTrend}>{insight.trend}</Text>
              <Text style={styles.insightRecommendation}>
                {insight.recommendation}
              </Text>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#3A7CA5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E5E5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  clearText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  predictionForm: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5DA271',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  predictionCard: {
    backgroundColor: '#F5F5DC',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postcode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueContainer: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  predictedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A7CA5',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  growthLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  growthValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  factorsContainer: {
    marginBottom: 15,
  },
  factorsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  factor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  predictionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  savedPredictionCard: {
    backgroundColor: '#F5F5DC',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  savedPredictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedPostcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  savedPredictionValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  savedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  savedGrowth: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  savedConfidence: {
    fontSize: 12,
    color: '#666',
  },
  insightCard: {
    backgroundColor: '#F5F5DC',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightArea: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  insightConfidence: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insightConfidenceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  insightTrend: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5DA271',
    marginBottom: 5,
  },
  insightRecommendation: {
    fontSize: 12,
    color: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
}); 