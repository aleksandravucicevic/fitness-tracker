import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Language, SettingsService, UnitSystem } from '../services/settingsService';
import { Colors } from '../utils/theme';
import {
  scheduleDailyReminder,
  sendInstantNotification,
} from '../services/notificationService';

const TIME_OPTIONS = [
  { label: '09:00', hour: 9, minute: 0 },
  { label: '18:00', hour: 18, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
];

export const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number }>({ hour: 20, minute: 0 });

  useEffect(() => {
    const loadSettings = async () => {
      const savedLang = await SettingsService.getLanguage();
      const savedUnits = await SettingsService.getUnitSystem();
      const savedNotifs = await SettingsService.getNotificationEnabled();
      const savedTime = await SettingsService.getNotificationTime();

      i18n.changeLanguage(savedLang);
      setUnitSystem(savedUnits);
      setNotificationsEnabled(savedNotifs);
      setSelectedTime(savedTime);
    };
    loadSettings();
  }, []);

  const handleLanguageChange = async (lang: Language) => {
    await i18n.changeLanguage(lang);
    await SettingsService.setLanguage(lang);
  };

  const handleUnitChange = async (unit: UnitSystem) => {
    setUnitSystem(unit);
    await SettingsService.setUnitSystem(unit);
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await SettingsService.setNotificationsEnabled(value);
    await scheduleDailyReminder();
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    setSelectedTime({ hour, minute });
    await SettingsService.setNotificationTime(hour, minute);
    await scheduleDailyReminder();
  };

  return (
    <View style={styles.container}>
      {/* JEZIK */}
      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={[styles.row, i18n.language === 'sr' && styles.selectedRow]}
                          onPress={() => handleLanguageChange('sr')}>
          <Text style={styles.rowText}>Srpski</Text>
          {i18n.language === 'sr' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={[styles.row, i18n.language === 'en' && styles.selectedRow]}
                          onPress={() => handleLanguageChange('en')}>
          <Text style={styles.rowText}>English</Text>
          {i18n.language === 'en' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* MJERNA JEDINICA */}
      <Text style={styles.sectionTitle}>{t('units')}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={[styles.row, unitSystem === 'metric' && styles.selectedRow]}
                          onPress={() => handleUnitChange('metric')}>
          <Text style={styles.rowText}>{t('kilometers')}</Text>
          {unitSystem === 'metric' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={[styles.row, unitSystem === 'imperial' && styles.selectedRow]}
                          onPress={() => handleUnitChange('imperial')}>
          <Text style={styles.rowText}>{t('miles')}</Text>
          {unitSystem === 'imperial' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* NOTIFIKACIJE */}
      <Text style={styles.sectionTitle}>{t('notifications')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('enableNotifications')}</Text>
          <Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle}
          trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={notificationsEnabled ? '#000' : '#f4f3f4'} />
        </View>

        {notificationsEnabled && (
          <>
          <View style={styles.divider} />
          {/* IZBOR VREMENA PODSJETNIKA */}
          <View style={styles.timeSection}>
            <Text style={styles.subLabel}>{t('notificationTime')}</Text>
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((item) => {
                const isSelected = selectedTime.hour === item.hour && selectedTime.minute === item.minute;
                return (
                  <TouchableOpacity key={item.label} style={[styles.timeChip, isSelected && styles.selectedTimeChip]}
                  onPress={() => handleTimeChange(item.hour, item.minute)}>
                    <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={sendInstantNotification}>
              <Text style={[styles.rowText, { color:Colors.primary, fontWeight: 'bold' }]}>
                {t('sendTestNotification')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectedRow: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  rowText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  checkmark: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  timeSection: { padding: 16 },
  subLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 10 },
  timeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectedTimeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeText: { color: Colors.textPrimary, fontWeight: '600' },
  selectedTimeText: { color: '#000' },
});