import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';
import AccountScreen from './src/screens/AccountScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import HpiAnalysisScreen from './src/screens/HpiAnalysisScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Home tab
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
      <Stack.Screen 
        name="HpiAnalysis" 
        component={HpiAnalysisScreen}
        options={{ title: 'HPI Analysis' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Search tab
function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchMain" 
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PropertyDetailFromSearch" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Predictions tab
function PredictionsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PredictionsMain" 
        component={PredictionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PropertyDetailFromPredictions" 
        component={PropertyDetailScreen}
        options={{ title: 'Property Details' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Account tab
function AccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AccountMain" 
        component={AccountScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Predictions') {
              iconName = focused ? 'trending-up' : 'trending-up-outline';
            } else if (route.name === 'Account') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3A7CA5',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#3A7CA5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{ 
            title: 'Home',
            headerShown: false 
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchStack}
          options={{ 
            title: 'Search',
            headerShown: false 
          }}
        />
        <Tab.Screen 
          name="Predictions" 
          component={PredictionsStack}
          options={{ 
            title: 'Predictions',
            headerShown: false 
          }}
        />
        <Tab.Screen 
          name="Account" 
          component={AccountStack}
          options={{ 
            title: 'Account',
            headerShown: false 
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 