import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SettingsService, UnitSystem } from '../services/settingsService';
import { Colors } from '../utils/theme';

export const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  useEffect(() => {
    const loadSettings = async () => {
      const savedLang = await SettingsService.getLanguage();
      const savedUnits = await SettingsService.getUnitSystem();

      i18n.changeLanguage(savedLang);
      setUnitSystem(savedUnits);
    };
    loadSettings();
  }, []);

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await SettingsService.setLanguage(lang);
  };

  const handleUnitChange = async (unit: UnitSystem) => {
    setUnitSystem(unit);
    await SettingsService.setUnitSystem(unit);
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
});