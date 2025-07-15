# React Native Mobile App Development Guide

## Overview
This guide outlines the development of a cross-platform React Native mobile app for BMV Finder, including iOS widgets, notifications, and deployment protocols.

## 🏗 **Project Structure**

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── PropertyCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── HPIGraph.tsx
│   │   └── BMVScore.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── PropertyDetailScreen.tsx
│   │   ├── HPIAnalysisScreen.tsx
│   │   └── AccountScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── notifications.ts
│   │   ├── storage.ts
│   │   └── location.ts
│   ├── hooks/
│   │   ├── useProperties.ts
│   │   ├── useHPI.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts
├── ios/
│   ├── BMVFinder/
│   │   ├── Widget/
│   │   │   ├── BMVWidget.swift
│   │   │   └── BMVWidgetBundle.swift
│   │   └── AppDelegate.swift
│   └── BMVFinder.xcodeproj/
├── android/
│   └── app/
├── assets/
│   ├── icons/
│   └── images/
├── package.json
├── app.json
└── README.md
```

## 📱 **Core App Features**

### 1. Property Search & Discovery
```typescript
// src/screens/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SearchBar, PropertyCard, FilterModal } from '../components';
import { useProperties } from '../hooks/useProperties';

export const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const { properties, loading, error, searchProperties } = useProperties();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    await searchProperties(term, filters);
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchTerm}
        onChangeText={handleSearch}
        placeholder="Search by postcode or area..."
      />
      
      <FilterModal
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <FlatList
        data={properties}
        renderItem={({ item }) => <PropertyCard property={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => searchProperties(searchTerm, filters)} />
        }
      />
    </View>
  );
};
```

### 2. HPI Analysis & Market Insights
```typescript
// src/screens/HPIAnalysisScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { HPIGraph, MarketInsights, TrendAnalysis } from '../components';
import { useHPI } from '../hooks/useHPI';

export const HPIAnalysisScreen = ({ route }) => {
  const { postcode } = route.params;
  const { hpiData, marketTrends, loading } = useHPI(postcode);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HPI Analysis for {postcode}</Text>
      
      <HPIGraph data={hpiData} />
      
      <MarketInsights trends={marketTrends} />
      
      <TrendAnalysis postcode={postcode} />
    </ScrollView>
  );
};
```

### 3. BMV Scoring & Predictions
```typescript
// src/components/BMVScore.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BMVScoreProps {
  score: number;
  confidence: number;
  factors: string[];
}

export const BMVScore = ({ score, confidence, factors }: BMVScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return ['#4CAF50', '#45A049'];
    if (score >= 60) return ['#FF9800', '#F57C00'];
    return ['#F44336', '#D32F2F'];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getScoreColor(score)}
        style={styles.scoreCircle}
      >
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.scoreLabel}>BMV Score</Text>
      </LinearGradient>
      
      <Text style={styles.confidence}>
        Confidence: {confidence}%
      </Text>
      
      <View style={styles.factors}>
        {factors.map((factor, index) => (
          <Text key={index} style={styles.factor}>• {factor}</Text>
        ))}
      </View>
    </View>
  );
};
```

## 🍎 **iOS-Specific Features**

### 1. iOS Widgets Implementation
```swift
// ios/BMVFinder/Widget/BMVWidget.swift
import WidgetKit
import SwiftUI

struct BMVWidgetEntryView: View {
    var entry: BMVWidgetEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("BMV Finder")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(entry.date, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            if let property = entry.property {
                VStack(alignment: .leading, spacing: 4) {
                    Text(property.address)
                        .font(.headline)
                        .lineLimit(1)
                    
                    Text("£\(property.pricePaid, specifier: "%.0f")")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    HStack {
                        Text("BMV Score:")
                        Text("\(property.bmvScore)")
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                    .font(.caption)
                }
            } else {
                Text("No recent searches")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct BMVWidget: Widget {
    let kind: String = "BMVWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BMVWidgetProvider()) { entry in
            BMVWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("BMV Finder")
        .description("Quick property insights")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 2. Lock Screen Widgets
```swift
// ios/BMVFinder/Widget/LockScreenWidget.swift
struct LockScreenBMVWidget: Widget {
    let kind: String = "LockScreenBMVWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenWidgetProvider()) { entry in
            LockScreenBMVWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("BMV Alerts")
        .description("Property alerts on lock screen")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
```

### 3. App Clips Implementation
```swift
// ios/BMVFinder/AppClip/AppClipDelegate.swift
import UIKit
import AppClip

class AppClipDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Handle App Clip invocation
        if let userActivity = launchOptions?[.userActivity] as? NSUserActivity {
            handleUserActivity(userActivity)
        }
        
        return true
    }
    
    func handleUserActivity(_ userActivity: NSUserActivity) {
        if userActivity.activityType == "SearchProperty" {
            if let postcode = userActivity.userInfo?["postcode"] as? String {
                // Navigate to property search with postcode
                navigateToSearch(postcode: postcode)
            }
        }
    }
}
```

## 🔔 **Push Notifications**

### 1. Notification Service
```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export class NotificationService {
  static async registerForPushNotifications() {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    
    // Send token to backend
    await this.sendTokenToServer(token.data);
  }

  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immediate
    });
  }

  static async scheduleMarketAlert(postcode: string, threshold: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Market Alert',
        body: `Properties in ${postcode} are now below your threshold`,
        data: { postcode, type: 'market_alert' },
      },
      trigger: {
        seconds: 3600, // Check every hour
        repeats: true,
      },
    });
  }
}
```

### 2. Location-Based Alerts
```typescript
// src/services/location.ts
import * as Location from 'expo-location';
import { NotificationService } from './notifications';

export class LocationService {
  static async requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  static async getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({});
    return location;
  }

  static async startLocationTracking() {
    await Location.startLocationUpdatesAsync('location-tracking', {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 300000, // 5 minutes
      distanceInterval: 1000, // 1km
    });
  }

  static async handleLocationUpdate(location: Location.LocationObject) {
    // Check for nearby properties
    const nearbyProperties = await this.getNearbyProperties(location);
    
    if (nearbyProperties.length > 0) {
      await NotificationService.scheduleLocalNotification(
        'Nearby Properties',
        `Found ${nearbyProperties.length} properties near you`,
        { properties: nearbyProperties }
      );
    }
  }
}
```

## 🚀 **Deployment Protocol**

### 1. CI/CD Pipeline
```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile App Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:mobile
      - run: npm run lint:mobile

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx expo build:ios --non-interactive
      - uses: actions/upload-artifact@v3
        with:
          name: ios-build
          path: build/ios/

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx expo build:android --non-interactive
      - uses: actions/upload-artifact@v3
        with:
          name: android-build
          path: build/android/

  deploy-testflight:
    needs: build-ios
    runs-on: macos-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: ios-build
      - uses: apple-actions/upload-testflight@v1
        with:
          app-path: "build/ios/BMVFinder.ipa"
          api-key: ${{ secrets.APPLE_API_KEY }}
          api-key-id: ${{ secrets.APPLE_API_KEY_ID }}
          api-issuer-id: ${{ secrets.APPLE_ISSUER_ID }}

  deploy-play-store:
    needs: build-android
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: android-build
      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.bmvfinder.app
          releaseFiles: build/android/app-release.aab
          track: internal
```

### 2. App Store Optimization (ASO)
```typescript
// app.json - App Store metadata
{
  "expo": {
    "name": "BMV Finder",
    "slug": "bmv-finder",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3A7CA5"
    },
    "ios": {
      "bundleIdentifier": "com.bmvfinder.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "BMV Finder uses your location to find nearby properties and provide market insights.",
        "NSCameraUsageDescription": "BMV Finder uses the camera for property photos and AR features.",
        "NSFaceIDUsageDescription": "BMV Finder uses Face ID for secure authentication."
      },
      "appStoreUrl": "https://apps.apple.com/app/bmv-finder/id123456789",
      "associatedDomains": ["applinks:bmvfinder.com"]
    },
    "android": {
      "package": "com.bmvfinder.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3A7CA5"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "INTERNET"
      ]
    },
    "plugins": [
      "expo-notifications",
      "expo-location",
      "expo-camera",
      "expo-face-id"
    ]
  }
}
```

## 📊 **Analytics & Monitoring**

### 1. Mobile Analytics
```typescript
// src/services/analytics.ts
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export class AnalyticsService {
  static async logEvent(eventName: string, parameters?: any) {
    await analytics().logEvent(eventName, parameters);
  }

  static async logSearch(searchTerm: string, resultsCount: number) {
    await this.logEvent('property_search', {
      search_term: searchTerm,
      results_count: resultsCount,
      platform: 'mobile'
    });
  }

  static async logPropertyView(propertyId: string, bmvScore: number) {
    await this.logEvent('property_view', {
      property_id: propertyId,
      bmv_score: bmvScore,
      platform: 'mobile'
    });
  }

  static async setUserProperties(userId: string, tier: string) {
    await analytics().setUserId(userId);
    await analytics().setUserProperty('subscription_tier', tier);
  }
}
```

## 🧪 **Testing Strategy**

### 1. Unit Tests
```typescript
// src/__tests__/components/PropertyCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PropertyCard } from '../../components/PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    address: '123 Test Street',
    pricePaid: 250000,
    bmvScore: 85,
    dateOfTransfer: '2023-01-01'
  };

  it('renders property information correctly', () => {
    const { getByText } = render(<PropertyCard property={mockProperty} />);
    
    expect(getByText('123 Test Street')).toBeTruthy();
    expect(getByText('£250,000')).toBeTruthy();
    expect(getByText('85')).toBeTruthy();
  });

  it('handles tap events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PropertyCard property={mockProperty} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('property-card'));
    expect(onPress).toHaveBeenCalledWith(mockProperty);
  });
});
```

### 2. Integration Tests
```typescript
// src/__tests__/screens/SearchScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../../screens/SearchScreen';
import { PropertyService } from '../../services/api';

jest.mock('../../services/api');

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs search and displays results', async () => {
    const mockProperties = [
      { id: '1', address: '123 Test St', pricePaid: 250000 }
    ];
    
    PropertyService.searchProperties = jest.fn().mockResolvedValue(mockProperties);
    
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search by postcode or area...');
    fireEvent.changeText(searchInput, 'SW1A 1AA');
    
    await waitFor(() => {
      expect(getByText('123 Test St')).toBeTruthy();
    });
  });
});
```

## 📋 **Quality Assurance Checklist**

### Development Checklist
- [ ] Cross-platform compatibility tested
- [ ] iOS widgets implemented and tested
- [ ] Push notifications working
- [ ] Offline functionality implemented
- [ ] Performance optimized
- [ ] Accessibility features added

### Deployment Checklist
- [ ] App Store Connect configured
- [ ] Google Play Console configured
- [ ] CI/CD pipeline working
- [ ] Beta testing completed
- [ ] App store optimization implemented
- [ ] Analytics and crash reporting active

### Post-Launch Checklist
- [ ] User feedback collected
- [ ] Performance monitoring active
- [ ] Crash reporting configured
- [ ] App store reviews monitored
- [ ] Analytics data analyzed
- [ ] Update roadmap planned 