import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, ScrollView } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTracker } from '../hooks/useTracker';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { saveActivity } from '../db/activityRepository';
import { ActivityType } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';
import { useFocusEffect } from '@react-navigation/native';

export const TrackingScreen = () => {
  const {t, i18n} = useTranslation();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const {
    isTracking,
    isPaused,
    activityType,
    setActivityType,
    duration,
    distance,
    setDistance,
    currentSpeed,
    route,
    currentLocation,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useTracker();

  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  useFocusEffect(
    useCallback(() => {
      const loadUnit = async () => {
        const currentUnit = await getUnitSystem();
        setUnitSystem(currentUnit);
      };

      loadUnit();
    }, [])
  );

  const handleSave = async () => {
    stopTracking();

    const avgSpeed = duration > 0 ? (distance / 1000) / (duration / 3600) : 0;

    try {
      await saveActivity({
        type: activityType, duration, distance,
        date: new Date().toISOString(),
        routeJson: JSON.stringify(route),
        averageSpeed: parseFloat(avgSpeed.toFixed(2)),
      });
      Alert.alert(t('tracking.success'), t('tracking.savedSuccessfully'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('tracking.success'), t('tracking.saveError'));
    }
  };

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* MAPA SA RUTOM */}
      <View style={[styles.mapContainer, isLandscape && styles.mapContainerLandscape]}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} showsUserLocation={true} followsUserLocation={true}
        region={
          currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          } : undefined
        }>
          {route.length > 0 && (
            <Polyline coordinates={route} strokeColor={Colors.primary} strokeWidth={5} />
          )}
        </MapView>
      </View>

      {/* KONTROLNI PANEL */}
      <View style={[styles.dashboard, isLandscape && styles.dashboardLandscape]}>
        <ScrollView contentContainerStyle={isLandscape ? styles.scrollContentLandscape : undefined} bounces={false}>
          {/* IZBOR AKTIVNOSTI */}
          {!isTracking && (
            <View style={styles.typeSelector}>
              {(['RUNNING', 'WALKING', 'CYCLING'] as ActivityType[]).map((type) => (
                <TouchableOpacity key={type} style={[styles.typeButton, activityType === type && styles.selectedTypeButton, ]}
                onPress={() => setActivityType(type)}>
                  <Text style={[styles.typeText, activityType === type && styles.selectedTypeText, ]}>
                    {getActivityTypeName(type, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* METRIKE */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('tracking.distance')}</Text>
              <Text style={styles.statValue}>{formatDistance(distance, unitSystem)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('tracking.time')}</Text>
              <Text style={styles.statValue}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('tracking.speed')}</Text>
              <Text style={styles.statValue}>{formatSpeed(currentSpeed, unitSystem)}</Text>
            </View>
          </View>

          {/* DUGMAD */}
          <View style={styles.actionContainer}>
            {!isTracking ? (
              <TouchableOpacity style={styles.startButton} onPress={startTracking}>
                <Text style={styles.buttonText}>{t('tracking.start')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControls}>
                {isPaused ? (
                  <TouchableOpacity style={styles.resumeButton} onPress={resumeTracking}>
                    <Text style={styles.buttonText}>{t('tracking.resume')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.pauseButton} onPress={pauseTracking}>
                    <Text style={styles.buttonText}>{t('tracking.pause')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.stopButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>{t('tracking.save')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  containerLandscape: { flexDirection: 'row' },
  mapContainer: { flex: 1 },
  mapContainerLandscape: { flex: 4.5 },
  map: { flex: 1 },
  dashboard: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dashboardLandscape: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    justifyContent: 'center',
  },
  scrollContentLandscape: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  selectedTypeButton: { backgroundColor: Colors.primary },
  typeText: { color: Colors.textSecondary, fontWeight: '600' },
  selectedTypeText: { color: '#000', fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: { alignItems: 'center' },
  statLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  statValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: 'bold' },
  actionContainer: { width: '100%' },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseButton: {
    backgroundColor: '#FFB300',
    flex: 1,
    marginRight: 10,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: Colors.primary,
    flex: 1,
    marginRight: 10,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: Colors.accent,
    flex: 1,
    marginLeft: 10,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});