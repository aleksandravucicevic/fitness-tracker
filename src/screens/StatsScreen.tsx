import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../utils/theme';
import { getActivityStats, ActivityStats } from '../db/activityRepository';
import { getAllActivities } from '../db/activityRepository';
import { Activity } from '../models/Activity';

const screenWidth = Dimensions.get('window').width;

export const StatsScreen = () => {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [activityType, setActivityType] = useState<string>('ALL');
  const [stats, setStats] = useState<ActivityStats>({
    totalDistance: 0,
    totalDuration: 0,
    totalCount: 0,
    avgSpeed: 0,
  });

  const [chartData, setChartData] = useState<{labels: string[]; data: number[]}>({
    labels: ['-'],
    data: [0],
  });

  const loadData = async () => {
    try {
      const currentStats = await getActivityStats(activityType, periodDays);
      setStats(currentStats);

      const allActivities = await getAllActivities();
      prepareChartData(allActivities, periodDays, activityType);
    } catch (error) {
      console.error('Greška pri učitavanju statistike:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [periodDays, activityType])
  );

  const prepareChartData = (activities: Activity[], days: number, type: string) => {
    const filtered = activities.filter((act) => {
      const actDate = new Date(act.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const matchesType = type === 'ALL' || act.type === type;
      return actDate >= cutoffDate && matchesType;
    });

    if (days === 7) {
      const daysOfWeek = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
      const labels: string[] = [];
      const data: number[] = [];

      for(let i = 6; i>=0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = daysOfWeek[d.getDay()];
        labels.push(dayLabel);

        const totalForDay = filtered.filter((act) => new Date(act.date).toDateString() === d.toDateString())
                                    .reduce((sum, act) => sum + act.distance / 1000, 0);

        data.push(Number(totalForDay.toFixed(1)));
      }

      setChartData({labels, data});
    } else {
      const labels = ['P1', 'P2', 'P3', 'P4'];
      const data = [
        filtered.slice(0, 2).reduce((s, a) => s + a.distance / 1000, 0),
        filtered.slice(2, 4).reduce((s, a) => s + a.distance / 1000, 0),
        filtered.slice(4, 6).reduce((s, a) => s + a.distance / 1000, 0),
        filtered.slice(6).reduce((s, a) => s + a.distance / 1000, 0),
      ].map((v) => Number(v.toFixed(1)));

      setChartData({labels, data});
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* SELEKTOR PERIODA */}
      <View style={styles.periodSelector}>
        {[
          { label: '7 dana', value: 7},
          { label: '30 dana', value: 30},
          { label: '1 godina', value: 365 },
        ].map((p) => (
          <TouchableOpacity key={p.value} style={[styles.periodBtn, periodDays === p.value && styles.periodBtnActive]}
          onPress={() => setPeriodDays(p.value)}>
            <Text style={[styles.periodBtn, periodDays === p.value && styles.periodBtnActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FILTER PO TIPU AKTIVNOSTI */}
      <View style={styles.filterChips}>
        {['ALL', 'RUNNING', 'WALKING', 'CYCLING'].map((type) => (
          <TouchableOpacity key={type} style={[styles.chip, activityType === type && styles.chipActive]}
          onPress={() => setActivityType(type)}>
            <Text style={[styles.chipText, activityType === type && styles.chipTextActive]}>
              {type === 'ALL' ? 'Sve' : type === 'RUNNING' ? 'Trčanje' : type === 'WALKING' ? 'Hodanje' : 'Bicikl'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* METRIKE */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name='navigate-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {(stats.totalDistance / 1000).toFixed(2)} km
          </Text>
          <Text style={styles.statLabel}>Ukupna distanca</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name='time-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>Ukupno vrijeme</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name='fitness-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{stats.totalCount}</Text>
          <Text style={styles.statLabel}>Broj aktivnosti</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name='speedometer-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {Number(stats.avgSpeed || 0).toFixed(1)} km/h
          </Text>
          <Text style={styles.statLabel}>Prosječna brzina</Text>
        </View>
      </View>

      {/* GRAFIKON AKTIVNOSTI */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distanca po danima (km)</Text>
        <BarChart data={{labels: chartData.labels, datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }],}}
                  width={screenWidth - 48}
                  height={220}
                  yAxisLabel=''
                  yAxisSuffix='km'
                  chartConfig={{
                    backgroundColor: Colors.cardBackground,
                    backgroundGradientFrom: Colors.cardBackground,
                    backgroundGradientTo: Colors.cardBackground,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    barPercentage: 0.6
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars={true} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  periodBtnTextActive: { color: '#000', fontWeight: 'bold' },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chartCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chart: { borderRadius: 12, marginTop: 8 },
});