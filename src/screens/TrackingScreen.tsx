import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, ScrollView, Modal, TextInput } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTracker } from '../hooks/useTracker';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { saveActivity } from '../db/activityRepository';
import { ActivityType } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';
import { useFocusEffect } from '@react-navigation/native';
import { scheduleDailyReminder } from '../services/notificationService';

export const TrackingScreen = () => {
  const {t, i18n} = useTranslation();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const navigation = useNavigation<any>();
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
    hasLocationPermission,
    steps,
    isPedometerAvailable,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useTracker();

  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      const loadUnit = async () => {
        const currentUnit = await getUnitSystem();
        setUnitSystem(currentUnit);
      };

      loadUnit();
    }, [])
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if(mapRef.current && currentLocation) {
        mapRef.current.animateCamera({
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        }, {duration: 200});
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [isLandscape]);

  const handleStart = async () => {
    const started = await startTracking();
  };

  const handleOpenSaveModal = () => {
    if (route.length < 2) {
      Alert.alert(t('tracking.warning'), hasLocationPermission === false ? t('tracking.noPermissionMessage') : t('tracking.notEnoughGpsData'));
      return;
    }

    pauseTracking();
    setIsModalVisible(true);
  };

  const handleCancelSave = () => {
    setIsModalVisible(false);
    setDescription('');
  };

  const handleConfirmSave = async () => {
    stopTracking();
    setIsModalVisible(false);

    const avgSpeed = duration > 0 ? (distance / 1000) / (duration / 3600) : 0;

    try {
      await saveActivity({
        type: activityType, duration, distance,
        date: new Date().toISOString(),
        routeJson: JSON.stringify(route),
        averageSpeed: parseFloat(avgSpeed.toFixed(2)),
        description: description.trim() || undefined,
        steps: isPedometerAvailable ? steps : undefined,
      });

      setDescription('');
      // ponovno zakazivanje podsjetnika, s obzirom da je korisnik upravo sačuvao trening
      scheduleDailyReminder(new Date()).catch(() => {});
      Alert.alert(t('tracking.success'), t('tracking.savedSuccessfully'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('tracking.warning'), t('tracking.saveError'));
    }
  };

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* MAPA SA RUTOM */}
      <View style={[isLandscape ? styles.mapContainerLandscape : styles.mapContainer]}>
        <MapView ref={mapRef} style={styles.map} 
        provider={PROVIDER_GOOGLE} showsUserLocation={true} followsUserLocation={true}
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
      <View style={[isLandscape ? styles.dashboardLandscape : styles.dashboard]}>
        <ScrollView contentContainerStyle={isLandscape ? styles.scrollContentLandscape : undefined} bounces={false}
          showsVerticalScrollIndicator={false}>
          {/* IZBOR AKTIVNOSTI */}
          {!isTracking && (
            <View style={styles.typeSelector}>
              {(['RUNNING', 'WALKING', 'CYCLING'] as ActivityType[]).map((type) => (
                <TouchableOpacity key={type} style={[styles.typeButton, activityType === type && styles.selectedTypeButton ]}
                onPress={() => setActivityType(type)}>
                  <Text style={[styles.typeText, activityType === type && styles.selectedTypeText ]}>
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
              <Text style={styles.statValue}>{formatTime(duration, true)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('tracking.speed')}</Text>
              <Text style={styles.statValue}>{formatSpeed(currentSpeed, unitSystem)}</Text>
            </View>
            {isPedometerAvailable && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('tracking.steps')}</Text>
                <Text style={styles.statValue}>{steps}</Text>
              </View>
            )}
          </View>

          {/* DUGMAD */}
          <View style={styles.actionContainer}>
            {!isTracking ? (
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
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

                <TouchableOpacity style={styles.stopButton} onPress={handleOpenSaveModal}>
                  <Text style={styles.buttonText}>{t('tracking.save')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* MODAL ZA UNOS OPISA */}
      <Modal visible={isModalVisible} transparent={true}
        animationType="slide" onRequestClose={handleCancelSave}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('tracking.saveActivityTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('tracking.addDescriptionPrompt')}:</Text>
            
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('tracking.descriptionPlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelSave}>
                <Text style={styles.modalCancelButtonText}>{t('picker.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleConfirmSave}>
                <Text style={styles.buttonText}>{t('picker.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  containerLandscape: { flexDirection: 'row' },
  mapContainer: { flex: 0.55, width: '100%' },
  mapContainerLandscape: { flex: 1.5, height: '100%' },
  map: { flex: 1 },
  dashboard: {
    flex: 0.45,
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dashboardLandscape: {
    flex: 1,
    height: '100%',
    padding: 20,
    backgroundColor: Colors.cardBackground,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  descriptionInput: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
});