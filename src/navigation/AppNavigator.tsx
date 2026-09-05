import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { Colors } from '../utils/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { TrackingScreen } from '../screens/TrackingScreen';
import { ManualActivityScreen } from '../screens/ManualActivityScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    const {t, i18n} = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator screenOptions={({route}) => ({
            headerStyle: {backgroundColor: Colors.cardBackground, elevation: 0, shadowOpacity: 0},
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: 'bold' },
            tabBarStyle: {
                backgroundColor: Colors.cardBackground,
                borderTopColor: Colors.border,
                height: 52 + insets.bottom,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                paddingTop: 3,
            },
            tabBarActiveTintColor: Colors.activeTab,
            tabBarInactiveTintColor: Colors.inactiveTab,
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'pulse-outline';
                if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'HistoryTab') iconName = focused ? 'hourglass' : 'hourglass-outline';
                else if (route.name === 'StatsTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                else if (route.name === 'GoalsTab') iconName = focused ? 'trophy' : 'trophy-outline';
                else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{tabBarLabel: t('homeTitle'), headerTitle: 'Fitness Tracker'}} />
            <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{tabBarLabel: t('historyTitle'), headerTitle: t('historyTitle')}}/>
            <Tab.Screen name="StatsTab" component={StatsScreen} options={{tabBarLabel: t('statsTitle'), headerTitle: t('statsTitle')}}/>
            <Tab.Screen name="GoalsTab" component={GoalsScreen} options={{tabBarLabel: t('goalsTitle'), headerTitle: t('goalsTitle')}}/>
            <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{tabBarLabel: t('settingsTitle'), headerTitle: t('settingsTitle')}} />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const {t, i18n} = useTranslation();

    return (
        <>
            <StatusBar style="light" backgroundColor={Colors.cardBackground} />
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="MainTabs" component={TabNavigator} />
                    <Stack.Screen name="Tracking" component={TrackingScreen}
                    options={{
                        headerShown: true,
                        title: t('newWorkout'),
                        headerStyle: { backgroundColor: Colors.cardBackground },
                        headerTintColor: Colors.textPrimary,
                    }} />
                    <Stack.Screen name="ManualActivity" component={ManualActivityScreen}
                    options={{
                        headerShown: true,
                        title: t('manual.title'),
                        headerStyle: { backgroundColor: Colors.cardBackground },
                        headerTintColor: Colors.textPrimary,
                    }} />
                    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen}
                    options={{
                        headerShown: true,
                        title: t('activityDetailsTitle'),
                        headerStyle: { backgroundColor: Colors.cardBackground },
                        headerTintColor: Colors.textPrimary,
                    }} />
                </Stack.Navigator>
            </NavigationContainer>
        </>
    );
};