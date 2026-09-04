import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, useWindowDimensions } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={isLandscape ? styles.landscapeRow : undefined}>
        <View style={isLandscape ? styles.landscapeColumn : undefined}>
          {/* JEZIK */}
          <Text style={[styles.sectionTitle, isLandscape && styles.landscapeSectionTitle]}>
            {t('language')}
          </Text>
          <View style={[styles.card, isLandscape && styles.landscapeCardContainer]}>
            <TouchableOpacity
              style={[
                styles.row,
                isLandscape ? styles.landscapeOptionTile : styles.rowItemPadding,
                i18n.language === 'sr' && styles.selectedRow,
              ]}
              onPress={() => handleLanguageChange('sr')}
            >
              <Text style={styles.rowText}>Srpski</Text>
              {i18n.language === 'sr' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={isLandscape ? styles.verticalDivider : styles.divider} />

            <TouchableOpacity
              style={[
                styles.row,
                isLandscape ? styles.landscapeOptionTile : styles.rowItemPadding,
                i18n.language === 'en' && styles.selectedRow,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.rowText}>English</Text>
              {i18n.language === 'en' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>

          {/* MJERNA JEDINICA */}
          <Text style={[styles.sectionTitle, isLandscape && styles.landscapeSectionTitle]}>
            {t('units')}
          </Text>
          <View style={[styles.card, isLandscape && styles.landscapeCardContainer]}>
            <TouchableOpacity
              style={[
                styles.row,
                isLandscape ? styles.landscapeOptionTile : styles.rowItemPadding,
                unitSystem === 'metric' && styles.selectedRow,
              ]}
              onPress={() => handleUnitChange('metric')}
            >
              <Text style={styles.rowText}>{t('kilometers')}</Text>
              {unitSystem === 'metric' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={isLandscape ? styles.verticalDivider : styles.divider} />

            <TouchableOpacity
              style={[
                styles.row,
                isLandscape ? styles.landscapeOptionTile : styles.rowItemPadding,
                unitSystem === 'imperial' && styles.selectedRow,
              ]}
              onPress={() => handleUnitChange('imperial')}
            >
              <Text style={styles.rowText}>{t('miles')}</Text>
              {unitSystem === 'imperial' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={isLandscape ? styles.landscapeColumn : undefined}>
          <Text style={[styles.sectionTitle, isLandscape && {marginTop: 0}]}>
            {t('notifications')}
          </Text>
          <View style={styles.card}>
            <View style={[styles.row, isLandscape && styles.rowItemPadding]}>
              <Text style={styles.rowText}>{t('enableNotifications')}</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={notificationsEnabled ? '#000' : '#f4f3f4'}
              />
            </View>

            {notificationsEnabled && (
              <>
                <View style={styles.divider} />

                {/* IZBOR VREMENA PODSJETNIKA */}
                <View style={[styles.timeSection, isLandscape && styles.landscapeTimeSection]}>
                  <Text style={styles.subLabel}>{t('notificationTime')}</Text>
                  <View style={[styles.timeGrid, isLandscape && styles.landscapeTimeGrid]}>
                    {TIME_OPTIONS.map((item) => {
                      const isSelected = selectedTime.hour === item.hour && selectedTime.minute === item.minute;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          style={[
                            styles.timeChip,
                            isLandscape && styles.landscapeTimeChip,
                            isSelected && styles.selectedTimeChip,
                          ]}
                          onPress={() => handleTimeChange(item.hour, item.minute)}
                        >
                          <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={[styles.row, isLandscape && styles.rowItemPadding]} onPress={sendInstantNotification}>
                  <Text style={[styles.rowText, { color: Colors.primary, fontWeight: 'bold' }]}>
                    {t('sendTestNotification')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  landscapeRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  landscapeColumn: {
    flex: 1,
  },
  landscapeSectionTitle: {
    marginTop: 11,
  },
  landscapeCardContainer: {
    flexDirection: 'row',
  },
  landscapeOptionTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionTitle: {
    fontSize: 13,
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
  rowItemPadding: {
    paddingVertical: 10
  },
  selectedRow: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  rowText: {
    fontSize: 15,
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
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  timeSection: { padding: 16 },
  landscapeTimeSection: { padding: 12, paddingVertical: 8 },
  subLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  landscapeTimeGrid: {
    gap: 8,
    justifyContent: 'flex-start',
  },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  landscapeTimeChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectedTimeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },
  selectedTimeText: { color: '#000' },
});