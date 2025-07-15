import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
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
  distance: number;
  lastSold: string;
  priceChange: number;
}

interface FilterOptions {
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  propertyType: string;
  radius: string;
  sortBy: string;
}

export default function SearchScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    propertyType: '',
    radius: '5',
    sortBy: 'relevance',
  });

  // Mock data - replace with API calls
  const mockProperties: Property[] = [
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
      distance: 0.5,
      lastSold: '2022-03-15',
      priceChange: 8.5,
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
      distance: 1.2,
      lastSold: '2021-11-20',
      priceChange: 12.3,
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
      distance: 2.1,
      lastSold: '2023-01-10',
      priceChange: 6.7,
    },
    {
      id: '4',
      address: '321 Elm Street, Liverpool',
      price: 195000,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'Flat',
      imageUrl: 'https://via.placeholder.com/300x200',
      postcode: 'L1 1AA',
      hpiGrowth: 7.2,
      distance: 3.5,
      lastSold: '2022-08-05',
      priceChange: 4.2,
    },
  ];

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProperties(mockProperties);
    } catch (error) {
      Alert.alert('Error', 'Failed to search properties');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseInt(filters.maxPrice));
    }

    // Apply bedroom filter
    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.bedrooms));
    }

    // Apply property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);
    }

    // Apply radius filter
    if (filters.radius) {
      filtered = filtered.filter(p => p.distance <= parseInt(filters.radius));
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'hpi-growth':
        filtered.sort((a, b) => b.hpiGrowth - a.hpiGrowth);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      default:
        // Relevance sorting (default)
        break;
    }

    setFilteredProperties(filtered);
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetailFromSearch', { property });
  };

  const handleHpiAnalysis = (postcode: string) => {
    navigation.navigate('HpiAnalysis', { postcode });
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      propertyType: '',
      radius: '5',
      sortBy: 'relevance',
    });
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

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.propertyImage} />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <Text style={styles.propertyPrice}>
          {formatCurrency(item.price)}
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>
            {item.bedrooms} bed • {item.bathrooms} bath • {item.distance}km
          </Text>
          <Text style={styles.propertyType}>{item.propertyType}</Text>
        </View>
        <View style={styles.propertyMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>HPI Growth:</Text>
            <Text
              style={[
                styles.metricValue,
                { color: item.hpiGrowth > 0 ? '#5DA271' : '#E74C3C' },
              ]}
            >
              {formatPercentage(item.hpiGrowth)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Price Change:</Text>
            <Text
              style={[
                styles.metricValue,
                { color: item.priceChange > 0 ? '#5DA271' : '#E74C3C' },
              ]}
            >
              {formatPercentage(item.priceChange)}
            </Text>
          </View>
        </View>
        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleHpiAnalysis(item.postcode)}
          >
            <Ionicons name="analytics" size={16} color="#3A7CA5" />
            <Text style={styles.actionButtonText}>HPI Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={16} color="#D4AF37" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Properties</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter postcode or area..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={performSearch} style={styles.searchButton}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#3A7CA5" />
          <Text style={styles.filterToggleText}>Filters</Text>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#3A7CA5"
          />
        </TouchableOpacity>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.filterInput}
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.filterRow}>
              <TextInput
                style={styles.filterInput}
                placeholder="Bedrooms"
                value={filters.bedrooms}
                onChangeText={(text) => setFilters({ ...filters, bedrooms: text })}
                keyboardType="numeric"
              />
              <View style={styles.filterSelect}>
                <Text style={styles.filterSelectText}>
                  {filters.propertyType || 'Property Type'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterSelect}>
                <Text style={styles.filterSelectText}>
                  Radius: {filters.radius}km
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
              <View style={styles.filterSelect}>
                <Text style={styles.filterSelectText}>
                  Sort: {filters.sortBy}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
            </View>

            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A7CA5" />
            <Text style={styles.loadingText}>Searching properties...</Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredProperties.length} properties found
              </Text>
            </View>

            <FlatList
              data={filteredProperties}
              renderItem={renderPropertyItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.propertyList}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    padding: 20,
    backgroundColor: '#3A7CA5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    justifyContent: 'space-between',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A7CA5',
    marginLeft: 8,
    flex: 1,
  },
  filtersPanel: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  filterSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 10,
  },
  filterSelectText: {
    fontSize: 14,
    color: '#333',
  },
  clearFiltersButton: {
    backgroundColor: '#E5E5E5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#666',
    fontWeight: '600',
  },
  resultsContainer: {
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
  resultsHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  propertyList: {
    padding: 15,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A7CA5',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  propertyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5DC',
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
}); 