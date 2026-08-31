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
import { Colors } from '../utils/theme';
import { getGoals, saveGoals, Goals } from '../db/goalsRepository';
import { getActivityStats } from '../db/activityRepository';

export const GoalsScreen = () => {
  const [goals, setGoals] = useState<Goals>({ 
    weeklySteps: 10000,
    weeklyDistanceKm: 20,
    weeklyDurationMins: 150,
  });
  const [stepsInput, setStepsInput] = useState<string>('10000');
  const [distanceInput, setDistanceInput] = useState<string>('20');
  const [durationInput, setDurationInput] = useState<string>('150');

  const [currentWeekDistanceKm, setCurrentWeekDistanceKm] = useState<number>(0);
  const [currentWeekDurationMins, setCurrentWeekDurationMins] = useState<number>(0);
  const [currentWeekSteps, setCurrentWeekSteps] = useState<number>(0);
  
  const loadGoalsAndProgress = async () => {
    try {
      const savedGoals = await getGoals();
      setGoals(savedGoals);
      setStepsInput(savedGoals.weeklySteps.toString());
      setDistanceInput(savedGoals.weeklyDistanceKm.toString());
      setDurationInput(savedGoals.weeklyDurationMins.toString());

      const weekStats = await getActivityStats('ALL', 7);
      const distKm = weekStats.totalDistance / 1000;
      setCurrentWeekDistanceKm(distKm);
      setCurrentWeekDurationMins(Math.floor(weekStats.totalDuration / 60));

      // procjena koraka: (1km = ~1333 koraka)
      const estimatedSteps = Math.round(distKm * 1333);
      setCurrentWeekSteps(estimatedSteps);
    } catch (error) {
      console.error('Greška pri učitavanju ciljeva:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoalsAndProgress();
    }, [])
  );

  const handleSaveGoals = async () => {
    const stp = parseInt(stepsInput, 10);
    const dist = parseFloat(distanceInput);
    const dur = parseInt(durationInput, 10);

    if(isNaN(stp) || stp <= 0 || isNaN(dist) || dist <= 0 || isNaN(dur) || dur <= 0) {
      Alert.alert('Neispravan unos', 'Unesite validne brojeve za ciljeve.');
      return;
    }

    const updatedGoals: Goals = {
      weeklySteps: stp,
      weeklyDistanceKm: dist,
      weeklyDurationMins: dur,
    };

    await saveGoals(updatedGoals);
    setGoals(updatedGoals);
    Alert.alert('Uspjeh', 'Vaši ciljevi su uspješno sačuvani.');
  };

  const stepsProgress = Math.min((currentWeekSteps / goals.weeklySteps) * 100, 100);
  const distanceProgress = Math.min((currentWeekDistanceKm / goals.weeklyDistanceKm) * 100, 100);
  const durationProgress = Math.min((currentWeekDurationMins / goals.weeklyDurationMins) * 100, 100);
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Napredak u posljednjih 7 dana</Text>

        {/* CILJ KORACI */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>
              Koraci ({currentWeekSteps} / {goals.weeklySteps})
            </Text>
            <Text style={styles.percentText}>{stepsProgress.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${stepsProgress}%`, backgroundColor: '#FFB74D' }]} />
          </View>
        </View>

        {/* CILJ DISTANCA */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>
              Distanca ({currentWeekDistanceKm.toFixed(1)} / {goals.weeklyDistanceKm} km)
            </Text>
            <Text style={styles.percentText}>{distanceProgress.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${distanceProgress}%` }]} />
          </View>
        </View>

        {/* CILJ VRIJEME */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>
              Vrijeme ({currentWeekDurationMins} / {goals.weeklyDurationMins} min)
            </Text>
            <Text style={styles.percentText}>{durationProgress.toFixed(0)}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${durationProgress}%`, backgroundColor: '#4FC3F7' }]} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Postavi ciljeve</Text>

        <Text style={styles.inputLabel}>Sedmični ciljni broj koraka:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={stepsInput} 
                  onChangeText={setStepsInput} placeholder='npr. 10000' placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.inputLabel}>Sedmična ciljna pređena distanca (km):</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={distanceInput} 
                  onChangeText={setDistanceInput} placeholder='npr. 20' placeholderTextColor={Colors.textSecondary} />

        <Text style={styles.inputLabel}>Sedmično ciljno aktivno vrijeme (min):</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={durationInput} 
                  onChangeText={setDurationInput} placeholder='npr. 150' placeholderTextColor={Colors.textSecondary} />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoals}>
          <Ionicons name='save-outline' size={20} color="#000" />
          <Text style={styles.saveButtonText}>Sačuvaj ciljeve</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  progressSection: { marginBottom: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  percentText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  progressBarBackground: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
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