import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName, estimateCalories } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { Activity, LocationPoint } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, formatCalories, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const ActivityDetailScreen = ({ route } : any) => {
    const {t, i18n} = useTranslation();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const {activity}: { activity: Activity } = route.params;
    const routePoints: LocationPoint[] = activity.routeJson ? JSON.parse(activity.routeJson) : [];
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        const loadUnit = async () => {
            const currentUnit = await getUnitSystem();
            setUnitSystem(currentUnit);
        }
        loadUnit();
    }, []);

    useEffect(() => {
        if(mapRef.current && routePoints.length > 0) {
            const timeout = setTimeout(() => {
                mapRef.current?.fitToCoordinates(routePoints, {
                    edgePadding: {top: 100, right: 100, bottom: 100, left: 100},
                    animated: false,
                });
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isLandscape, routePoints.length]);

    const initialRegion = routePoints.length > 0 ? {
        latitude: routePoints[0].latitude,
        longitude: routePoints[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    } : undefined;

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            {/* PRIKAZ RUTE NA MAPI */}
            <View style={[isLandscape ? styles.mapContainerLandscape : styles.mapContainer]}>
                {routePoints.length > 0 ? (
                    <MapView ref={mapRef} key={isLandscape ? 'map-landscape' : 'map-portrait'}
                        style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
                        <Polyline coordinates={routePoints} strokeColor={Colors.primary} strokeWidth={5} />
                    </MapView>
                ) : (
                    <View style={[styles.noMapCard]}>
                        <Ionicons name='cloud-offline-outline' size={48} color={Colors.textSecondary} />
                        <Text style={styles.noMapText}>{t('activityDetail.noGpsRoute')}</Text>
                    </View>
                )}
            </View>

            {/* ANALITIKA */}
            <ScrollView style={[isLandscape ? styles.detailsSectionLandscape : styles.detailsSection]} 
                contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailsContainer, isLandscape && {paddingVertical: 6}]}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.titleText}>{getActivityTypeName(activity.type, t)}</Text>
                            <Text style={styles.dateText}>{new Date(activity.date).toLocaleDateString(i18n.language)}</Text>
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
                                {formatCalories(estimateCalories(activity.type, activity.duration))}
                            </Text>
                            <Text style={styles.metricLabel}>{t('activityDetail.estCalories')}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  containerLandscape: { flexDirection: 'row' },
  mapContainer: { flex: 1, width: '100%' },
  mapContainerLandscape: { flex: 1.1, height: '100%' },
  map: { flex: 1, width: '100%', height: '100%' },
  noMapCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMapText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  detailsSection: { flex: 0.6 },
  detailsSectionLandscape: { flex: 0.5 },
  detailsContainer: { padding: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  dateText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 14,
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