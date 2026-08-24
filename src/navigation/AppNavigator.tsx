import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator screenOptions={({route}) => ({
                headerStyle: {backgroundColor: "#6200ee"},
                headerTintColor: "#fff",
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
                tabBarIcon: ({ color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';

                    if (route.name === 'Početna') iconName = 'play-circle-outline';
                    else if (route.name === 'Istorija') iconName = 'list-outline';
                    else if (route.name === 'Statistika') iconName = 'bar-chart-outline';
                    else if (route.name === 'Ciljevi') iconName = 'trophy-outline';
                    else if (route.name === 'Podešavanja') iconName = 'settings-outline';

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
    );
};