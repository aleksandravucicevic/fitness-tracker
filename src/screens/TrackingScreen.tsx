import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTracker } from '../hooks/useTracker';
import { Colors } from '../utils/theme';
import { saveActivity } from '../db/activityRepository';
import { ActivityType } from '../models/Activity';

export const TrackingScreen = () => {
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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
      Alert.alert('Uspješno!', 'Vaša aktivnost je sačuvana u istoriju aktivnosti.');
    } catch (error) {
      console.error(error);
      Alert.alert('Greška', 'Došlo je do greške pri učitavanju aktivnosti.');
    }
  };

  return (
    <View style={styles.container}>
      {/* MAPA SA RUTOM */}
      <View style={styles.mapContainer}>
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
      <View style={styles.dashboard}>
        {/* IZBOR AKTIVNOSTI */}
        {!isTracking && (
          <View style={styles.typeSelector}>
            {(['RUNNING', 'WALKING', 'CYCLING'] as ActivityType[]).map((type) => (
              <TouchableOpacity key={type} style={[styles.typeButton, activityType === type && styles.selectedTypeButton, ]}
              onPress={() => setActivityType(type)}>
                <Text style={[styles.typeText, activityType === type && styles.selectedTypeText, ]}>
                  {type === 'RUNNING' ? 'Trčanje' : type === 'WALKING' ? 'Hodanje' : 'Bicikl'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* METRIKE */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{(distance/1000).toFixed(2)} km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Vrijeme</Text>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Brzina</Text>
            <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
          </View>
        </View>

        {/* DUGMAD */}
        <View style={styles.actionContainer}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={startTracking}>
              <Text style={styles.buttonText}>START</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              {isPaused ? (
                <TouchableOpacity style={styles.resumeButton} onPress={resumeTracking}>
                  <Text style={styles.buttonText}>NASTAVI</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseButton} onPress={pauseTracking}>
                  <Text style={styles.buttonText}>PAUZA</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.stopButton} onPress={handleSave}>
                <Text style={styles.buttonText}>SAČUVAJ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  dashboard: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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