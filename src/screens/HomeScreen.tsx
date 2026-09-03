import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { getAllActivities } from '../db/activityRepository';
import { Activity } from '../models/Activity';
import { formatDistance, formatTime, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const HomeScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  
  useFocusEffect(
    useCallback(() => {
      const loadDashboardData = async () => {
        try {
          const currentUnit = await getUnitSystem();
          setUnitSystem(currentUnit);

          const data = await getAllActivities();

          const distSum = data.reduce((acc, curr) => acc + curr.distance, 0);
          const durSum = data.reduce((acc, curr) => acc + curr.duration, 0);

          setTotalDistanceMeters(distSum);
          setTotalDuration(durSum);
          setRecentActivities(data.slice(0, 3));
        } catch(error) {
          console.error('Greška pri učitavanju podataka za dashboard:', error);
        }
      };

      loadDashboardData();
    }, [])
  );

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* DUGME KOJE OTVARA TRACKING EKRAN */}
        <View style={styles.headerCard}>
          <Text style={styles.greeting}>{t('home.readyForWorkout')}</Text>

          <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={() => navigation.navigate('Tracking')}>
            <Ionicons name='play-circle' size={28} color='#000' />
            <Text style={styles.startButtonText}>{t('home.startNewWorkout')}</Text>
          </TouchableOpacity>
        </View>

        {/* REZIME AKTIVNOSTI */}
        <Text style={styles.sectionTitle}>{t('home.activitySummary')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name='map-outline' size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatDistance(totalDistanceMeters, unitSystem)}</Text>
            <Text style={styles.statLabel}>{t('home.totalDistance')}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name='time-outline' size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatTime(totalDuration)}</Text>
            <Text style={styles.statLabel}>{t('home.activeTime')}</Text>
          </View>
        </View>

        {/* NEDAVNE AKTIVNOSTI */}
        <Text style={styles.sectionTitle}>{t('home.recentActivities')}</Text>
        {recentActivities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('home.noActivities')}</Text>
          </View>
        ) : (
          recentActivities.map((act) => (
            <View key={act.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Ionicons name={act.type === 'RUNNING' ? 'flame' : act.type === 'WALKING' ? 'walk' : 'bicycle'}
                size={22} color={Colors.primary} />
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {getActivityTypeName(act.type, t)}
                </Text>

                <Text style={styles.activitySub}>
                  {new Date(act.date).toLocaleDateString(i18n.language)}
                </Text>

                <View style={styles.activityMetrics}>
                  <Text style={styles.metricText}>{formatDistance(act.distance, unitSystem)}</Text>
                  <Text style={styles.metricSub}>{formatTime(act.duration)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 2 },
  content: { padding: 16, paddingBottom: 2 },
  headerCard: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 15,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    padding: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  activitySub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  activityMetrics: {
    alignItems: 'flex-end',
  },
  metricText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  metricSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});