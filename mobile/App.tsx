import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StatusBar } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { OutageListScreen } from './src/screens/OutageListScreen';
import { getUserLocation } from './src/services/storage';
import { UserLocation } from './src/types';
import { COLORS, TYPE_ICONS, TYPE_LABELS } from './src/constants';

const Tab = createBottomTabNavigator();

export default function App() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    getUserLocation().then((loc) => {
      if (loc) setLocation(loc);
    });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
          },
        }}
      >
        <Tab.Screen
          name="home"
          options={{
            tabBarLabel: 'Genel',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
          }}
        >
          {() => <HomeScreen />}
        </Tab.Screen>

        <Tab.Screen
          name="electricity"
          options={{
            tabBarLabel: TYPE_LABELS.electricity,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TYPE_ICONS.electricity}</Text>,
          }}
        >
          {() => <OutageListScreen location={location} type="electricity" />}
        </Tab.Screen>

        <Tab.Screen
          name="water"
          options={{
            tabBarLabel: TYPE_LABELS.water,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TYPE_ICONS.water}</Text>,
          }}
        >
          {() => <OutageListScreen location={location} type="water" />}
        </Tab.Screen>

        <Tab.Screen
          name="gas"
          options={{
            tabBarLabel: TYPE_LABELS.gas,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TYPE_ICONS.gas}</Text>,
          }}
        >
          {() => <OutageListScreen location={location} type="gas" />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
