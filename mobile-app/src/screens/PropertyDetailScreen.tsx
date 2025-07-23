import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
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
  description: string;
  features: string[];
  lastSold: string;
  priceChange: number;
  area: number;
  tenure: string;
  councilTax: string;
  energyRating: string;
  // Enhanced energy efficiency data
  energyEfficiency: {
    currentRating: string;
    potentialRating: string;
    energyConsumption: number; // kWh/m²/year
    heatingCost: number; // £/year
    carbonEmissions: number; // kg CO2/year
    insulation: {
      walls: string;
      roof: string;
      windows: string;
      floor: string;
    };
    heatingSystem: string;
    hotWater: string;
    lighting: string;
    renewableEnergy: string[];
  };
}

export default function PropertyDetailScreen({ navigation, route }: { navigation: unknown; route: unknown }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEnergyDetails, setShowEnergyDetails] = useState(false);

  // Mock property data - replace with API call
  const mockProperty: Property = {
    id: '1',
    address: '123 Main Street, Manchester, M1 1AA',
    price: 285000,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Semi-detached',
    imageUrl: 'https://via.placeholder.com/400x300',
    postcode: 'M1 1AA',
    hpiGrowth: 12.5,
    description: 'A beautifully presented semi-detached property in a sought-after location. This home offers modern living with traditional charm, featuring a spacious kitchen, generous bedrooms, and a well-maintained garden.',
    features: [
      'Modern kitchen with integrated appliances',
      'Spacious living room with bay window',
      'Three well-proportioned bedrooms',
      'Family bathroom with shower',
      'En-suite to master bedroom',
      'Private rear garden',
      'Off-street parking',
      'Gas central heating',
      'Double glazing throughout',
      'Close to transport links'
    ],
    lastSold: '2022-03-15',
    priceChange: 8.5,
    area: 1200,
    tenure: 'Freehold',
    councilTax: 'Band C',
    energyRating: 'B',
    energyEfficiency: {
      currentRating: 'B',
      potentialRating: 'A',
      energyConsumption: 244,
      heatingCost: 834,
      carbonEmissions: 2.8,
      insulation: {
        walls: 'Cavity wall insulation',
        roof: 'Loft insulation (200mm)',
        windows: 'Double glazed',
        floor: 'Suspended timber floor'
      },
      heatingSystem: 'Gas boiler (2018)',
      hotWater: 'From main heating system',
      lighting: 'Low energy lighting (80%)',
      renewableEnergy: ['Solar panels (4kW)']
    }
  };

  useEffect(() => {
    loadProperty();
  }, []);

  const loadProperty = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperty(mockProperty);
    } catch (error) {
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    Alert.alert(
      saved ? 'Removed from saved' : 'Added to saved',
      saved ? 'Property removed from your saved list' : 'Property added to your saved list'
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property?.address} - ${property?.price}`,
        title: 'BMV Finder Property',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share property');
    }
  };

  const handleHpiAnalysis = () => {
    navigation.navigate('HpiAnalysis', { postcode: property?.postcode });
  };

  const handleEnergyAnalysis = () => {
    setShowEnergyDetails(!showEnergyDetails);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEnergyRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return '#00A651';
      case 'B': return '#85BB2F';
      case 'C': return '#FFCC00';
      case 'D': return '#FF9900';
      case 'E': return '#FF6600';
      case 'F': return '#FF3300';
      case 'G': return '#CC0000';
      default: return '#999999';
    }
  };

  const getEnergyRatingDescription = (rating: string) => {
    switch (rating) {
      case 'A': return 'Very energy efficient';
      case 'B': return 'Energy efficient';
      case 'C': return 'Average efficiency';
      case 'D': return 'Below average';
      case 'E': return 'Poor efficiency';
      case 'F': return 'Very poor efficiency';
      case 'G': return 'Extremely poor efficiency';
      default: return 'Unknown efficiency';
    }
  };

  const calculatePotentialSavings = () => {
    if (!property?.energyEfficiency) return 0;
    const currentCost = property.energyEfficiency.heatingCost;
    const potentialCost = currentCost * 0.6; // Assume 40% savings with improvements
    return currentCost - potentialCost;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Property not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: property.imageUrl }} style={styles.propertyImage} />
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={24}
                  color={saved ? '#E74C3C' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          {/* Price and Basic Info */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatCurrency(property.price)}</Text>
            <View style={styles.basicInfo}>
              <Text style={styles.address}>{property.address}</Text>
              <View style={styles.propertyStats}>
                <Text style={styles.stat}>{property.bedrooms} bed</Text>
                <Text style={styles.stat}>•</Text>
                <Text style={styles.stat}>{property.bathrooms} bath</Text>
                <Text style={styles.stat}>•</Text>
                <Text style={styles.stat}>{property.area} sq ft</Text>
              </View>
            </View>
          </View>

          {/* HPI Growth */}
          <View style={styles.hpiSection}>
            <View style={styles.hpiHeader}>
              <Ionicons name="trending-up" size={20} color="#5DA271" />
              <Text style={styles.hpiTitle}>HPI Growth</Text>
            </View>
            <View style={styles.hpiContent}>
              <Text style={[styles.hpiValue, { color: '#5DA271' }]}>
                {formatPercentage(property.hpiGrowth)}
              </Text>
              <Text style={styles.hpiLabel}>in the last 12 months</Text>
            </View>
            <TouchableOpacity style={styles.analyzeButton} onPress={handleHpiAnalysis}>
              <Text style={styles.analyzeButtonText}>View Detailed Analysis</Text>
            </TouchableOpacity>
          </View>

          {/* Energy Efficiency Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="leaf" size={20} color="#5DA271" />
                <Text style={styles.sectionTitle}>Energy Efficiency</Text>
              </View>
              <TouchableOpacity onPress={handleEnergyAnalysis}>
                <Ionicons 
                  name={showEnergyDetails ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Energy Rating Display */}
            <View style={styles.energyRatingContainer}>
              <View style={styles.energyRatingItem}>
                <Text style={styles.energyRatingLabel}>Current</Text>
                <View style={[styles.energyRatingBadge, { backgroundColor: getEnergyRatingColor(property.energyEfficiency.currentRating) }]}>
                  <Text style={styles.energyRatingText}>{property.energyEfficiency.currentRating}</Text>
                </View>
                <Text style={styles.energyRatingDescription}>
                  {getEnergyRatingDescription(property.energyEfficiency.currentRating)}
                </Text>
              </View>
              <View style={styles.energyRatingItem}>
                <Text style={styles.energyRatingLabel}>Potential</Text>
                <View style={[styles.energyRatingBadge, { backgroundColor: getEnergyRatingColor(property.energyEfficiency.potentialRating) }]}>
                  <Text style={styles.energyRatingText}>{property.energyEfficiency.potentialRating}</Text>
                </View>
                <Text style={styles.energyRatingDescription}>
                  {getEnergyRatingDescription(property.energyEfficiency.potentialRating)}
                </Text>
              </View>
            </View>

            {/* Quick Energy Stats */}
            <View style={styles.energyStats}>
              <View style={styles.energyStatItem}>
                <Ionicons name="flash" size={16} color="#FF9900" />
                <Text style={styles.energyStatValue}>{property.energyEfficiency.energyConsumption}</Text>
                <Text style={styles.energyStatLabel}>kWh/m²/year</Text>
              </View>
              <View style={styles.energyStatItem}>
                <Ionicons name="pound" size={16} color="#E74C3C" />
                <Text style={styles.energyStatValue}>{formatCurrency(property.energyEfficiency.heatingCost)}</Text>
                <Text style={styles.energyStatLabel}>Heating cost/year</Text>
              </View>
              <View style={styles.energyStatItem}>
                <Ionicons name="cloud" size={16} color="#3498DB" />
                <Text style={styles.energyStatValue}>{property.energyEfficiency.carbonEmissions}</Text>
                <Text style={styles.energyStatLabel}>tonnes CO2/year</Text>
              </View>
            </View>

            {/* Detailed Energy Information */}
            {showEnergyDetails && (
              <View style={styles.energyDetails}>
                {/* Insulation Details */}
                <View style={styles.energyDetailSection}>
                  <Text style={styles.energyDetailTitle}>Insulation</Text>
                  <View style={styles.energyDetailGrid}>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Walls</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.insulation.walls}</Text>
                    </View>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Roof</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.insulation.roof}</Text>
                    </View>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Windows</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.insulation.windows}</Text>
                    </View>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Floor</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.insulation.floor}</Text>
                    </View>
                  </View>
                </View>

                {/* Systems */}
                <View style={styles.energyDetailSection}>
                  <Text style={styles.energyDetailTitle}>Systems</Text>
                  <View style={styles.energyDetailGrid}>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Heating</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.heatingSystem}</Text>
                    </View>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Hot Water</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.hotWater}</Text>
                    </View>
                    <View style={styles.energyDetailItem}>
                      <Text style={styles.energyDetailLabel}>Lighting</Text>
                      <Text style={styles.energyDetailValue}>{property.energyEfficiency.lighting}</Text>
                    </View>
                  </View>
                </View>

                {/* Renewable Energy */}
                {property.energyEfficiency.renewableEnergy.length > 0 && (
                  <View style={styles.energyDetailSection}>
                    <Text style={styles.energyDetailTitle}>Renewable Energy</Text>
                    {property.energyEfficiency.renewableEnergy.map((item, index) => (
                      <View key={index} style={styles.renewableEnergyItem}>
                        <Ionicons name="sunny" size={16} color="#FFD700" />
                        <Text style={styles.renewableEnergyText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Potential Savings */}
                <View style={styles.savingsSection}>
                  <Text style={styles.savingsTitle}>Potential Annual Savings</Text>
                  <Text style={styles.savingsAmount}>{formatCurrency(calculatePotentialSavings())}</Text>
                  <Text style={styles.savingsDescription}>
                    With energy efficiency improvements, you could save up to 40% on your energy bills
                  </Text>
                </View>

                {/* Recommendations */}
                <View style={styles.recommendationsSection}>
                  <Text style={styles.recommendationsTitle}>Improvement Recommendations</Text>
                  <View style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
                    <Text style={styles.recommendationText}>Upgrade to triple glazing</Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
                    <Text style={styles.recommendationText}>Install smart heating controls</Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
                    <Text style={styles.recommendationText}>Add cavity wall insulation</Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
                    <Text style={styles.recommendationText}>Consider solar panel installation</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Property Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Property Type</Text>
                <Text style={styles.detailValue}>{property.propertyType}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tenure</Text>
                <Text style={styles.detailValue}>{property.tenure}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Council Tax</Text>
                <Text style={styles.detailValue}>{property.councilTax}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Energy Rating</Text>
                <Text style={styles.detailValue}>{property.energyRating}</Text>
              </View>
            </View>
          </View>

          {/* Price History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price History</Text>
            <View style={styles.priceHistory}>
              <View style={styles.priceHistoryItem}>
                <Text style={styles.priceHistoryDate}>
                  {formatDate(property.lastSold)}
                </Text>
                <Text style={styles.priceHistoryPrice}>
                  {formatCurrency(property.price - (property.price * property.priceChange / 100))}
                </Text>
                <Text style={styles.priceHistoryChange}>
                  {formatPercentage(property.priceChange)} change
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {property.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#5DA271" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Contact Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interested in this property?</Text>
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>Call Agent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>Email Agent</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 20,
  },
  priceSection: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A7CA5',
    marginBottom: 8,
  },
  basicInfo: {
    marginBottom: 10,
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  propertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stat: {
    fontSize: 14,
    color: '#666',
  },
  hpiSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hpiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  hpiContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  hpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hpiLabel: {
    fontSize: 14,
    color: '#666',
  },
  analyzeButton: {
    backgroundColor: '#5DA271',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  energyRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  energyRatingItem: {
    alignItems: 'center',
  },
  energyRatingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  energyRatingBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  energyRatingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  energyRatingDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 80,
  },
  energyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  energyStatItem: {
    alignItems: 'center',
  },
  energyStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  energyStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  energyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
  },
  energyDetailSection: {
    marginBottom: 20,
  },
  energyDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  energyDetailGrid: {
    gap: 10,
  },
  energyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  energyDetailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  energyDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  renewableEnergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  renewableEnergyText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  savingsSection: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  savingsDescription: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  recommendationsSection: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceHistory: {
    gap: 10,
  },
  priceHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  priceHistoryDate: {
    fontSize: 14,
    color: '#666',
  },
  priceHistoryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceHistoryChange: {
    fontSize: 14,
    color: '#5DA271',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 15,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A7CA5',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
}); 