import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  imageUrl: string;
  postcode: string;
  hpiGrowth: number;
}

interface MarketInsight {
  area: string;
  growth: number;
  volume: number;
  averagePrice: number;
}

export default function HomeScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API calls
  const mockFeaturedProperties: Property[] = [
    {
      id: '1',
      address: '123 Main Street, Manchester',
      price: 285000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'Semi-detached',
      imageUrl: 'https://via.placeholder.com/300x200',
      postcode: 'M1 1AA',
      hpiGrowth: 12.5,
    },
    {
      id: '2',
      address: '456 Oak Avenue, Birmingham',
      price: 320000,
      bedrooms: 4,
      bathrooms: 2,
      propertyType: 'Detached',
      imageUrl: 'https://via.placeholder.com/300x200',
      postcode: 'B1 1AA',
      hpiGrowth: 9.8,
    },
    {
      id: '3',
      address: '789 Pine Road, Leeds',
      price: 245000,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'Terraced',
      imageUrl: 'https://via.placeholder.com/300x200',
      postcode: 'LS1 1AA',
      hpiGrowth: 8.4,
    },
  ];

  const mockMarketInsights: MarketInsight[] = [
    {
      area: 'Manchester',
      growth: 12.5,
      volume: 2345,
      averagePrice: 285000,
    },
    {
      area: 'Birmingham',
      growth: 9.8,
      volume: 1890,
      averagePrice: 320000,
    },
    {
      area: 'Leeds',
      growth: 8.4,
      volume: 1567,
      averagePrice: 245000,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFeaturedProperties(mockFeaturedProperties);
      setMarketInsights(mockMarketInsights);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property });
  };

  const handleHpiAnalysis = (postcode: string) => {
    navigation.navigate('HpiAnalysis', { postcode });
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BMV Finder</Text>
          <Text style={styles.subtitle}>Find your next investment property</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by postcode or area..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Search')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="search" size={24} color="#3A7CA5" />
            </View>
            <Text style={styles.quickActionText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Predictions')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="trending-up" size={24} color="#5DA271" />
            </View>
            <Text style={styles.quickActionText}>Predictions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Account')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="person" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.quickActionText}>Account</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() => handlePropertyPress(property)}
              >
                <Image source={{ uri: property.imageUrl }} style={styles.propertyImage} />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    {property.address}
                  </Text>
                  <Text style={styles.propertyPrice}>
                    {formatCurrency(property.price)}
                  </Text>
                  <View style={styles.propertyDetails}>
                    <Text style={styles.propertyDetail}>
                      {property.bedrooms} bed • {property.bathrooms} bath
                    </Text>
                    <Text style={styles.propertyType}>{property.propertyType}</Text>
                  </View>
                  <View style={styles.hpiContainer}>
                    <Text style={styles.hpiLabel}>HPI Growth:</Text>
                    <Text
                      style={[
                        styles.hpiValue,
                        { color: property.hpiGrowth > 0 ? '#5DA271' : '#E74C3C' },
                      ]}
                    >
                      {formatPercentage(property.hpiGrowth)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={() => handleHpiAnalysis(property.postcode)}
                  >
                    <Text style={styles.analyzeButtonText}>Analyze HPI</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Market Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights</Text>
          {marketInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightArea}>{insight.area}</Text>
                <Text
                  style={[
                    styles.insightGrowth,
                    { color: insight.growth > 0 ? '#5DA271' : '#E74C3C' },
                  ]}
                >
                  {formatPercentage(insight.growth)}
                </Text>
              </View>
              <View style={styles.insightDetails}>
                <Text style={styles.insightDetail}>
                  {insight.volume.toLocaleString()} properties
                </Text>
                <Text style={styles.insightDetail}>
                  Avg: {formatCurrency(insight.averagePrice)}
                </Text>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#3A7CA5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E5E5',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#3A7CA5',
    borderRadius: 20,
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3A7CA5',
    fontWeight: '500',
  },
  propertyCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  propertyInfo: {
    padding: 15,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3A7CA5',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  propertyDetail: {
    fontSize: 14,
    color: '#666',
  },
  propertyType: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  hpiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hpiLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  hpiValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#5DA271',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  insightGrowth: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightDetail: {
    fontSize: 14,
    color: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
}); 