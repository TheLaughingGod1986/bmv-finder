import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HpiData {
  postcode: string;
  currentValue: number;
  historicalData: Array<{
    date: string;
    value: number;
    change: number;
  }>;
  growthRate: number;
  marketTrend: string;
  confidence: number;
  factors: string[];
  recommendations: string[];
  comparison: {
    national: number;
    regional: number;
    local: number;
  };
}

export default function HpiAnalysisScreen({ navigation, route }: any) {
  const [hpiData, setHpiData] = useState<HpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m');

  const postcode = route.params?.postcode || 'M1 1AA';

  // Mock HPI data - replace with API call
  const mockHpiData: HpiData = {
    postcode: postcode,
    currentValue: 285000,
    historicalData: [
      { date: '2023-01', value: 250000, change: 0 },
      { date: '2023-02', value: 252000, change: 0.8 },
      { date: '2023-03', value: 255000, change: 1.2 },
      { date: '2023-04', value: 258000, change: 1.2 },
      { date: '2023-05', value: 262000, change: 1.6 },
      { date: '2023-06', value: 265000, change: 1.1 },
      { date: '2023-07', value: 268000, change: 1.1 },
      { date: '2023-08', value: 272000, change: 1.5 },
      { date: '2023-09', value: 275000, change: 1.1 },
      { date: '2023-10', value: 278000, change: 1.1 },
      { date: '2023-11', value: 282000, change: 1.4 },
      { date: '2023-12', value: 285000, change: 1.1 },
    ],
    growthRate: 12.5,
    marketTrend: 'Strong growth',
    confidence: 87,
    factors: [
      'Transport infrastructure improvements',
      'Employment growth in the area',
      'Regeneration projects',
      'Good school catchment area',
      'Proximity to amenities',
    ],
    recommendations: [
      'Consider this area for investment properties',
      'Monitor local development plans',
      'Research rental demand in the area',
      'Compare with similar postcodes',
    ],
    comparison: {
      national: 4.2,
      regional: 8.7,
      local: 12.5,
    },
  };

  useEffect(() => {
    loadHpiData();
  }, [postcode]);

  const loadHpiData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHpiData(mockHpiData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load HPI analysis');
    } finally {
      setLoading(false);
    }
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

  const getTrendColor = (value: number) => {
    if (value > 5) return '#5DA271';
    if (value > 0) return '#D4AF37';
    return '#E74C3C';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#5DA271';
    if (confidence >= 60) return '#D4AF37';
    return '#E74C3C';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A7CA5" />
          <Text style={styles.loadingText}>Analyzing HPI data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hpiData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No HPI data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>HPI Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Postcode Info */}
        <View style={styles.postcodeSection}>
          <Text style={styles.postcode}>{hpiData.postcode}</Text>
          <Text style={styles.currentValue}>
            {formatCurrency(hpiData.currentValue)}
          </Text>
        </View>

        {/* Growth Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Overview</Text>
          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <Ionicons name="trending-up" size={24} color="#5DA271" />
              <Text style={styles.growthTitle}>12 Month Growth</Text>
            </View>
            <Text style={[styles.growthValue, { color: getTrendColor(hpiData.growthRate) }]}>
              {formatPercentage(hpiData.growthRate)}
            </Text>
            <Text style={styles.growthLabel}>{hpiData.marketTrend}</Text>
          </View>
        </View>

        {/* Market Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Comparison</Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Local</Text>
              <Text style={[styles.comparisonValue, { color: getTrendColor(hpiData.comparison.local) }]}>
                {formatPercentage(hpiData.comparison.local)}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Regional</Text>
              <Text style={[styles.comparisonValue, { color: getTrendColor(hpiData.comparison.regional) }]}>
                {formatPercentage(hpiData.comparison.regional)}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>National</Text>
              <Text style={[styles.comparisonValue, { color: getTrendColor(hpiData.comparison.national) }]}>
                {formatPercentage(hpiData.comparison.national)}
              </Text>
            </View>
          </View>
        </View>

        {/* Confidence Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Confidence</Text>
          <View style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <Ionicons name="analytics" size={24} color={getConfidenceColor(hpiData.confidence)} />
              <Text style={styles.confidenceTitle}>Data Quality</Text>
            </View>
            <Text style={[styles.confidenceValue, { color: getConfidenceColor(hpiData.confidence) }]}>
              {hpiData.confidence}%
            </Text>
            <Text style={styles.confidenceLabel}>
              {hpiData.confidence >= 80 ? 'High confidence' : 
               hpiData.confidence >= 60 ? 'Medium confidence' : 'Low confidence'}
            </Text>
          </View>
        </View>

        {/* Key Factors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Growth Factors</Text>
          {hpiData.factors.map((factor, index) => (
            <View key={index} style={styles.factorItem}>
              <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Recommendations</Text>
          {hpiData.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb" size={16} color="#D4AF37" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>

        {/* Historical Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price History</Text>
          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === '6m' && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe('6m')}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === '6m' && styles.timeframeTextActive]}>
                6 Months
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === '12m' && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe('12m')}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === '12m' && styles.timeframeTextActive]}>
                12 Months
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === '24m' && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe('24m')}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === '24m' && styles.timeframeTextActive]}>
                24 Months
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.historicalData}>
            {hpiData.historicalData.slice(-6).map((data, index) => (
              <View key={index} style={styles.historicalItem}>
                <Text style={styles.historicalDate}>{data.date}</Text>
                <Text style={styles.historicalValue}>
                  {formatCurrency(data.value)}
                </Text>
                <Text style={[styles.historicalChange, { color: getTrendColor(data.change) }]}>
                  {formatPercentage(data.change)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share Analysis</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#3A7CA5',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  postcodeSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postcode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A7CA5',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  growthCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5DC',
    borderRadius: 8,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  growthValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  growthLabel: {
    fontSize: 14,
    color: '#666',
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5DC',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5DC',
    borderRadius: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  factorText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#3A7CA5',
  },
  timeframeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  historicalData: {
    gap: 10,
  },
  historicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  historicalDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  historicalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  historicalChange: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A7CA5',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
}); 