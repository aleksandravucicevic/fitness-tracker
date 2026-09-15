import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { RippleTouchable } from '../components/RippleTouchable';
import { DatePickerModal } from '../components/DatePickerModal';
import { TimePickerModal } from '../components/TimePickerModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../utils/theme';
import { saveActivity } from '../db/activityRepository';
import { ActivityType } from '../models/Activity';
import { getActivityTypeName } from '../utils/activityUtils';
import { getUnitSystem, milesToKm } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';
import { scheduleDailyReminder } from '../services/notificationService';

export const ManualActivityScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [activityType, setActivityType] = useState<ActivityType>('RUNNING');
  const [durationInput, setDurationInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      getUnitSystem().then(setUnitSystem);
    }, [])
  );

  const handleSave = async () => {
    const durationMin = parseFloat(durationInput.replace(',', '.'));
    const distanceRaw = parseFloat(distanceInput.replace(',', '.'));

    if (!durationMin || durationMin <= 0 || isNaN(durationMin)) {
      Alert.alert(t('manual.warning'), t('manual.invalidDuration'));
      return;
    }
    if (!distanceRaw || distanceRaw <= 0 || isNaN(distanceRaw)) {
      Alert.alert(t('manual.warning'), t('manual.invalidDistance'));
      return;
    }

    const distanceKm = unitSystem === 'imperial' ? milesToKm(distanceRaw) : distanceRaw;
    const distanceMeters = distanceKm * 1000;
    const durationSeconds = Math.round(durationMin * 60);
    const avgSpeed = durationSeconds > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : 0;

    setIsSaving(true);
    try {
      await saveActivity({
        type: activityType,
        duration: durationSeconds,
        distance: distanceMeters,
        date: date.toISOString(),
        description: descriptionInput || '',
        routeJson: undefined,
        averageSpeed: parseFloat(avgSpeed.toFixed(2)),
      });

      // ponovno zakazivanje podsjetnika na osnovu unesenog datuma aktivnosti
      scheduleDailyReminder(date).catch(() => {});
      
      Alert.alert(t('manual.success'), t('manual.savedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Greška pri ručnom čuvanju aktivnosti:', error);
      Alert.alert(t('manual.warning'), t('manual.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectDate = (selectedDate: Date) => {
    const updated = new Date(date);
    updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setDate(updated);
  };

  const handleSelectTime = (selectedTime: Date) => {
    setDate(selectedTime);
  };

  const RedAsterisk = () => <Text style={styles.requiredStar}> *</Text>;

  const renderTypeSelector = () => (
    <>
      <Text style={[styles.sectionLabel, isLandscape && styles.landscapeSectionLabel]}>
        {t('manual.activityType')}
        <RedAsterisk />
      </Text>
      <View style={styles.typeSelector}>
        {(['RUNNING', 'WALKING', 'CYCLING'] as ActivityType[]).map((type) => (
          <RippleTouchable
            key={type}
            style={[styles.typeButton, activityType === type && styles.selectedTypeButton]}
            onPress={() => setActivityType(type)}
          >
            <Text style={[styles.typeText, activityType === type && styles.selectedTypeText]}>
              {getActivityTypeName(type, t)}
            </Text>
          </RippleTouchable>
        ))}
      </View>
    </>
  );

  const renderDateTimeSection = () => (
    <>
      <Text style={styles.sectionLabel}>
        {t('manual.date')}
        <RedAsterisk />
      </Text>
      <View style={styles.rowInputs}>
        <RippleTouchable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={styles.dateBtnText}>{date.toLocaleDateString(i18n.language)}</Text>
        </RippleTouchable>
        <RippleTouchable style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time-outline" size={18} color={Colors.primary} />
          <Text style={styles.dateBtnText}>
            {date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </RippleTouchable>
      </View>
    </>
  );

  const renderMetricsInputs = () => (
    <View style={styles.rowInputs}>
      <View style={styles.flex1}>
        <Text style={[styles.sectionLabel, isLandscape && styles.landscapeSectionLabel]}>
          {t('manual.durationLabel')}
          <RedAsterisk />
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={durationInput}
          onChangeText={setDurationInput}
          placeholder={t('manual.durationPlaceholder')}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.flex1}>
        <Text style={[styles.sectionLabel, isLandscape && styles.landscapeSectionLabel]}>
          {t('manual.distanceLabel', { unit: unitSystem === 'imperial' ? 'mi' : 'km' })}
          <RedAsterisk />
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distanceInput}
          onChangeText={setDistanceInput}
          placeholder={unitSystem === 'imperial' ? 'npr. 3.1' : 'npr. 5'}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderDescriptionInput = () => (
    <>
      <Text style={styles.sectionLabel}>{t('manual.descriptionLabel')}</Text>
      <TextInput
        style={[styles.input, styles.textArea, isLandscape && styles.landscapeTextArea]}
        value={descriptionInput}
        onChangeText={setDescriptionInput}
        placeholder={t('manual.descriptionPlaceholder')}
        placeholderTextColor={Colors.textSecondary}
        multiline
        numberOfLines={3}
      />
    </>
  );

  const renderSaveButton = () => (
    <RippleTouchable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
      <Ionicons name="save-outline" size={20} color="#000" />
      <Text style={styles.saveButtonText}>
        {isSaving ? t('manual.saving') : t('manual.save')}
      </Text>
    </RippleTouchable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {isLandscape ? (
        /* LANDSCAPE MODE */
        <View style={styles.landscapeContainer}>
          <View style={styles.landscapeColumn}>
            {renderTypeSelector()}
            {renderDateTimeSection()}
            <View style={{ marginTop: 'auto', paddingTop: 10 }}>
              {renderSaveButton()}
            </View>
          </View>

          <View style={[styles.landscapeColumn, isLandscape && {marginTop: 18}]}>
            {renderMetricsInputs()}
            {renderDescriptionInput()}
          </View>
        </View>
      ) : (
        <View>
          {renderTypeSelector()}
          {renderDateTimeSection()}
          {renderMetricsInputs()}
          {renderDescriptionInput()}
          {renderSaveButton()}
        </View>
      )}

      {/* DATETIMEPICKER MODALI */}
      {showDatePicker && (
        <DatePickerModal
          visible={showDatePicker}
          date={date}
          maximumDate={new Date()}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={handleSelectDate}
        />
      )}
      {showTimePicker && (
        <TimePickerModal
          visible={showTimePicker}
          date={date}
          onClose={() => setShowTimePicker(false)}
          onSelectTime={handleSelectTime}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 18,
  },
  flex1: {
    flex: 1,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  landscapeSectionLabel: {
    marginTop: 0,
  },
  requiredStar: {
    color: '#FF5252',
    fontWeight: 'bold',
  },

  landscapeContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'stretch',
    paddingHorizontal: 18,
  },
  landscapeColumn: {
    flex: 1,
  },

  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTypeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  selectedTypeText: {
    color: '#000',
    fontWeight: 'bold',
  },

  // REDOVI I POLJA UNOSA
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  landscapeTextArea: {
    height: 100,
  },

  // DUGME ZA ČUVANJE
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});