import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <>
        <StatusBar style="light" backgroundColor={Colors.cardBackground} />
        <NavigationContainer>
            <Tab.Navigator screenOptions={({route}) => ({
                headerStyle: {backgroundColor: Colors.cardBackground, elevation: 0, shadowOpacity: 0},
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { fontWeight: 'bold' },
                tabBarStyle: {
                    backgroundColor: Colors.cardBackground,
                    borderTopColor: Colors.border,
                    height: 55 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 3,
                },
                tabBarActiveTintColor: Colors.activeTab,
                tabBarInactiveTintColor: Colors.inactiveTab,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'pulse-outline';

                    if (route.name === 'Početna') iconName = focused ? 'fitness' : 'fitness-outline';
                    else if (route.name === 'Istorija') iconName = focused ? 'time' : 'time-outline';
                    else if (route.name === 'Statistika') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Ciljevi') iconName = focused ? 'trophy' : 'trophy-outline';
                    else if (route.name === 'Podešavanja') iconName = focused ? 'settings' : 'settings-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}>
                <Tab.Screen name="Početna" component={HomeScreen} />
                <Tab.Screen name="Istorija" component={HistoryScreen} />
                <Tab.Screen name="Statistika" component={StatsScreen} />
                <Tab.Screen name="Ciljevi" component={GoalsScreen} />
                <Tab.Screen name="Podešavanja" component={SettingsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
        </>
    );
};