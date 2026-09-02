import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { Activity, LocationPoint } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, formatCalories, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const ActivityDetailScreen = ({ route } : any) => {
    const {t, i18n} = useTranslation();
    const {activity}: { activity: Activity } = route.params;
    const routePoints: LocationPoint[] = activity.routeJson ? JSON.parse(activity.routeJson) : [];
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    useEffect(() => {
        const loadUnit = async () => {
            const currentUnit = await getUnitSystem();
            setUnitSystem(currentUnit);
        }
        loadUnit();
    }, []);

    const initialRegion = routePoints.length > 0 ? {
        latitude: routePoints[0].latitude,
        longitude: routePoints[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    } : undefined;

    return (
        <ScrollView style={styles.container}>
            {/* PRIKAZ RUTE NA MAPI */}
            {routePoints.length > 0 ? (
                <View style={styles.mapContainer}>
                    <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
                        <Polyline coordinates={routePoints} strokeColor={Colors.primary} strokeWidth={5} />
                    </MapView>
                </View>
            ) : (
                <View style={styles.noMapCard}>
                    <Ionicons name='cloud-offline-outline' size={48} color={Colors.textSecondary} />
                    <Text style={styles.noMapText}>{t('activityDetail.noGpsRoute')}</Text>
                </View>
            )}

            {/* ANALITIKA */}
            <View style={styles.detailsContainer}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.titleText}>
                            {getActivityTypeName(activity.type, t)}
                        </Text>

                        <Text style={styles.dateText}>
                            {new Date(activity.date).toLocaleDateString(i18n.language)}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* METRIKE */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Ionicons name='navigate-outline' size={22} color={Colors.primary} />
                        <Text style={styles.metricValue}>
                            {formatDistance(activity.distance, unitSystem)}
                        </Text>
                        <Text style={styles.metricLabel}>{t('activityDetail.totalDistance')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <Ionicons name='time-outline' size={22} color={Colors.primary} />
                        <Text style={styles.metricValue}>{formatTime(activity.duration, true)}</Text>
                        <Text style={styles.metricLabel}>{t('activityDetail.totalDuration')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <Ionicons name='speedometer-outline' size={22} color={Colors.primary} />
                        <Text style={styles.metricValue}>{formatSpeed(activity.averageSpeed, unitSystem)}</Text>
                        <Text style={styles.metricLabel}>{t('activityDetail.avgSpeed')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <Ionicons name='flame-outline' size={22} color={Colors.primary} />
                        <Text style={styles.metricValue}>
                            {formatCalories((activity.distance/1000)*60)}
                        </Text>
                        <Text style={styles.metricLabel}>{t('activityDetail.estCalories')}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { height: 280, width: '100%' },
  map: { flex: 1 },
  noMapCard: {
    height: 180,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noMapText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  detailsContainer: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  dateText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  metricLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});