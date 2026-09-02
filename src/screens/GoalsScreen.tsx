import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../utils/theme';
import { getGoals, saveGoals, GoalsData, GoalPeriod, SingleGoalSet } from '../db/goalsRepository';
import { getActivityStats } from '../db/activityRepository';
import { formatDistance, kmToMiles, milesToKm, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const GoalsScreen = () => {
  const {t, i18n} = useTranslation();
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  const [allGoals, setAllGoals] = useState<GoalsData>({
    daily: {},
    weekly: {},
  });
  
  const [stepsInput, setStepsInput] = useState<string>('');
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [durationInput, setDurationInput] = useState<string>('');

  const [currentDistanceMeters, setCurrentDistanceMeters] = useState<number>(0);
  const [currentDurationMins, setCurrentDurationMins] = useState<number>(0);
  const [currentSteps, setCurrentSteps] = useState<number>(0);

  const populateInputsForPeriod = (goalsSet: SingleGoalSet, currentUnit: UnitSystem) => {
    setStepsInput(goalsSet.stepsGoal ? goalsSet.stepsGoal.toString() : '');

    if(goalsSet.distanceGoalKm) {
      const displayDist = currentUnit === 'imperial' ? kmToMiles(goalsSet.distanceGoalKm) : goalsSet.distanceGoalKm;
      setDistanceInput(displayDist.toFixed(1));
    }
    
    setDurationInput(goalsSet.durationGoalMins ? goalsSet.durationGoalMins.toString() : '');
  };

  const fetchProgressForPeriod = async (targetPeriod: GoalPeriod) => {
    try {
      const daysToFetch = targetPeriod === 'daily' ? 1 : 7;
      const stats = await getActivityStats('ALL', daysToFetch);

      const distKm = stats.totalDistance / 1000;
      setCurrentDistanceMeters(stats.totalDistance);
      setCurrentDurationMins(Math.floor(stats.totalDuration / 60));
      setCurrentSteps(Math.round(distKm * 1333));
    } catch (error) {
      console.error('Greška pri dohvatanju statistike za ciljeve:', error);
    }
  };

  const loadGoalsAndProgress = async () => {
    try {
      const currentUnit = await getUnitSystem();
      setUnitSystem(currentUnit);

      const savedGoals = await getGoals();
      setAllGoals(savedGoals);

      populateInputsForPeriod(savedGoals[period], currentUnit);
      await fetchProgressForPeriod(period);
    } catch (error) {
      console.error('Greška pri učitavanju ciljeva:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoalsAndProgress();
    }, [period])
  );

  const handlePeriodChange = async (newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    populateInputsForPeriod(allGoals[newPeriod], unitSystem);
    await fetchProgressForPeriod(newPeriod);
  };

  const handleSaveGoals = async () => {
    const stp = stepsInput.trim() !== '' ? parseInt(stepsInput, 10) : undefined;
    const rawDist = distanceInput.trim() !== '' ? parseFloat(distanceInput) : undefined;
    const dur = durationInput.trim() !== '' ? parseInt(durationInput, 10) : undefined;

    if (!stp && !rawDist && !dur) {
      Alert.alert(t('goals.warning'), t('goals.enterAtLeastOne'));
      return;
    }

    let distKm: number | undefined = undefined;
    if(rawDist && !isNaN(rawDist) && rawDist > 0)
      distKm = unitSystem === 'imperial' ? milesToKm(rawDist) : rawDist;

    const updatedCurrentSet: SingleGoalSet = {
      stepsGoal: stp && !isNaN(stp) && stp > 0 ? stp : undefined,
      distanceGoalKm: distKm ? parseFloat(distKm.toFixed(2)) : undefined,
      durationGoalMins: dur && !isNaN(dur) && dur > 0 ? dur : undefined,
    };

    const updatedAllGoals: GoalsData = {
      ...allGoals,
      [period]: updatedCurrentSet,
    };

    await saveGoals(updatedAllGoals);
    setAllGoals(updatedAllGoals);
    await fetchProgressForPeriod(period);

    Alert.alert(t('goals.success'), t('goals.savedSuccessfully'));
  };

  const activeGoalSet = allGoals[period];
  const periodLabel = period === 'daily' ? t('goals.today') : t('goals.last7Days');

  const targetDistanceMeters = activeGoalSet.distanceGoalKm ? activeGoalSet.distanceGoalKm * 1000 : 0;
  const distanceProgressPercent = targetDistanceMeters > 0 ? Math.min((currentDistanceMeters / targetDistanceMeters) * 100, 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* SELEKTOR PERIODA */}
      <View style={styles.periodToggle}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'daily' && styles.periodBtnActive]}
          onPress={() => handlePeriodChange('daily')}
        >
          <Text style={[styles.periodBtnText, period === 'daily' && styles.periodBtnTextActive]}>
            {t('goals.dailyGoals')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodBtn, period === 'weekly' && styles.periodBtnActive]}
          onPress={() => handlePeriodChange('weekly')}
        >
          <Text style={[styles.periodBtnText, period === 'weekly' && styles.periodBtnTextActive]}>
            {t('goals.weeklyGoals')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* NAPREDAK */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('goals.achievedFor', { period: periodLabel })}</Text>

        {!activeGoalSet.stepsGoal && !activeGoalSet.distanceGoalKm && !activeGoalSet.durationGoalMins && (
          <Text style={styles.noGoalsText}>{t('goals.noGoalsSet')}</Text>
        )}

        {/* KORACI */}
        {activeGoalSet.stepsGoal && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.label}>
                {t('goals.steps')} ({currentSteps} / {activeGoalSet.stepsGoal})
              </Text>
              <Text style={styles.percentText}>
                {Math.min((currentSteps / activeGoalSet.stepsGoal) * 100, 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((currentSteps / activeGoalSet.stepsGoal) * 100, 100)}%`,
                    backgroundColor: '#FFB74D',
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* DISTANCA */}
        {activeGoalSet.distanceGoalKm && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.label}>
                {t('goals.distance')} ({formatDistance(currentDistanceMeters, unitSystem)} / {formatDistance(targetDistanceMeters, unitSystem)})
              </Text>
              <Text style={styles.percentText}>
                {distanceProgressPercent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${distanceProgressPercent}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* VRIJEME */}
        {activeGoalSet.durationGoalMins && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.label}>
                {t('goals.time')} ({currentDurationMins} / {activeGoalSet.durationGoalMins} min)
              </Text>
              <Text style={styles.percentText}>
                {Math.min((currentDurationMins / activeGoalSet.durationGoalMins) * 100, 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((currentDurationMins / activeGoalSet.durationGoalMins) * 100, 100)}%`,
                    backgroundColor: '#4FC3F7',
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* PODEŠAVANJE CILJEVA */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('goals.setGoalsTitle', { period: period === 'daily' ? t('goals.daily') : t('goals.weekly') })}</Text>

        <Text style={styles.inputLabel}>{t('goals.stepCount')}:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={stepsInput}
          onChangeText={setStepsInput}
          placeholder="npr. 10000"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.inputLabel}>{t('goals.distanceWithUnit', { unit: unitSystem === 'imperial' ? 'mi' : 'km' })}:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distanceInput}
          onChangeText={setDistanceInput}
          placeholder={unitSystem === 'imperial' ? 'npr. 12.5' : 'npr. 20'}
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.inputLabel}>{t('goals.timeInMin')}:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={durationInput}
          onChangeText={setDurationInput}
          placeholder="npr. 150"
          placeholderTextColor={Colors.textSecondary}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoals}>
          <Ionicons name="save-outline" size={20} color="#000" />
          <Text style={styles.saveButtonText}>{t('goals.saveGoals')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  periodBtnTextActive: { color: '#000', fontWeight: 'bold' },
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  noGoalsText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  progressSection: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  percentText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  progressBarBackground: { height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 6 },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});