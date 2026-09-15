import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { RippleTouchable } from '../components/RippleTouchable';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors, SubtleElevation } from '../utils/theme';
import { getActivityStats, ActivityStats } from '../db/activityRepository';
import { getAllActivities } from '../db/activityRepository';
import { Activity } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, getUnitSystem, metersToMiles } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const StatsScreen = () => {
  const {t, i18n} = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [activityType, setActivityType] = useState<string>('ALL');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [stats, setStats] = useState<ActivityStats>({ totalDistance: 0, totalDuration: 0, totalCount: 0, avgSpeed: 0, totalSteps: 0 });

  const [chartData, setChartData] = useState<{labels: string[]; data: number[]; unit: string; periodLabelKey: string; }>({
    labels: ['-'],
    data: [0],
    unit: 'km',
    periodLabelKey: 'stats.periodDay',
  });

  const loadData = async () => {
    try {
      const currentUnit = await getUnitSystem();
      setUnitSystem(currentUnit);

      const currentStats = await getActivityStats(activityType, periodDays);
      setStats(currentStats);

      const allActivities = await getAllActivities();
      prepareChartData(allActivities, periodDays, activityType, currentUnit);
    } catch (error) {
      console.error('Greška pri učitavanju statistike:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [periodDays, activityType, i18n.language])
  );

  const prepareChartData = (activities: Activity[], days: number, type: string, currentUnit: UnitSystem) => {
    const unitLabel = currentUnit === 'imperial' ? 'mi' : 'km';
    
    const filtered = activities.filter((act) => {
      const actDate = new Date(act.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const matchesType = type === 'ALL' || act.type === type;
      return actDate >= cutoffDate && matchesType;
    });

    const toChartUnit = (meters: number): number => {
      const val = currentUnit === 'imperial' ? metersToMiles(meters) : meters/1000;
      return Number(val.toFixed(2));
    };

    if (days === 7) {
      const daysOfWeek = ['stats.daysOfWeek.sun', 'stats.daysOfWeek.mon', 'stats.daysOfWeek.tue', 'stats.daysOfWeek.wed', 'stats.daysOfWeek.thu', 'stats.daysOfWeek.fri', 'stats.daysOfWeek.sat'];
      const labels: string[] = [];
      const data: number[] = [];

      for(let i = 6; i>=0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = t(daysOfWeek[d.getDay()]);
        labels.push(dayLabel);

        const totalMetersForDay = filtered.filter((act) => new Date(act.date).toDateString() === d.toDateString())
                                    .reduce((sum, act) => sum + act.distance, 0);

        data.push(toChartUnit(totalMetersForDay));
      }

      setChartData({labels, data, unit: unitLabel,periodLabelKey: 'stats.periodDay'});
    } else if (days === 30){
      const labels = ['P1', 'P2', 'P3', 'P4'];
      const now = new Date();

      const p1 = filtered.filter((a) => (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24) <= 7);
      const p2 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 7 && diff <= 14;
      });
      const p3 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 14 && diff <= 21;
      });
      const p4 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 21;
      });

      const m1 = p1.reduce((s, a) => s + a.distance, 0);
      const m2 = p2.reduce((s, a) => s + a.distance, 0);
      const m3 = p3.reduce((s, a) => s + a.distance, 0);
      const m4 = p4.reduce((s, a) => s + a.distance, 0);

      const data = [
        toChartUnit(m1),
        toChartUnit(m2),
        toChartUnit(m3),
        toChartUnit(m4),
      ];

      setChartData({labels, data, unit: unitLabel, periodLabelKey: 'stats.periodQuarter'});
    } else {
      const labels = ['P1', 'P2', 'P3', 'P4'];
      const now = new Date();

      const p1 = filtered.filter((a) => (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24) <= 91);
      const p2 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 91 && diff <= 182;
      });
      const p3 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 182 && diff <= 273;
      });
      const p4 = filtered.filter((a) => {
        const diff = (now.getTime() - new Date(a.date).getTime()) / (1000 * 3600 * 24);
        return diff > 273;
      });

      const m1 = p1.reduce((s, a) => s + a.distance, 0);
      const m2 = p2.reduce((s, a) => s + a.distance, 0);
      const m3 = p3.reduce((s, a) => s + a.distance, 0);
      const m4 = p4.reduce((s, a) => s + a.distance, 0);

      const data = [
        toChartUnit(m1),
        toChartUnit(m2),
        toChartUnit(m3),
        toChartUnit(m4),
      ];

      setChartData({labels, data, unit: unitLabel, periodLabelKey: 'stats.periodQuarter'});
    }
  };

  const computedChartWidth = Math.max(width - 64, 280);
  const computedHeight = isLandscape ? 160 : 220;

  return (
    <ScrollView style={[styles.container, isLandscape && {paddingHorizontal: 32}]} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* SELEKTOR PERIODA */}
      <View style={styles.periodSelector}>
        {[
          { label: t('stats.days7'), value: 7},
          { label: t('stats.days30'), value: 30},
          { label: t('stats.year1'), value: 365 },
        ].map((p) => (
          <RippleTouchable key={p.value} style={[styles.periodBtn, periodDays === p.value && styles.periodBtnActive]}
          onPress={() => setPeriodDays(p.value)}>
            <Text style={[styles.periodBtnText, periodDays === p.value && styles.periodBtnTextActive]}>
              {p.label}
            </Text>
          </RippleTouchable>
        ))}
      </View>

      {/* FILTER PO TIPU AKTIVNOSTI */}
      <View style={styles.filterChips}>
        {['ALL', 'RUNNING', 'WALKING', 'CYCLING'].map((type) => (
          <RippleTouchable key={type} style={[styles.chip, activityType === type && styles.chipActive]}
          onPress={() => setActivityType(type)}>
            <Text style={[styles.chipText, activityType === type && styles.chipTextActive]}>
              {getActivityTypeName(type, t)}
            </Text>
          </RippleTouchable>
        ))}
      </View>

      {/* METRIKE */}
      <View style={[styles.statsGrid, isLandscape && styles.landscapeStatsGrid]}>
        <View style={[styles.statCard, isLandscape && styles.landscapeStatCard]}>
          <Ionicons name='navigate-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {formatDistance(stats.totalDistance, unitSystem)}
          </Text>
          <Text style={styles.statLabel}>{t('stats.totalDistance')}</Text>
        </View>

        <View style={[styles.statCard, isLandscape && styles.landscapeStatCard]}>
          <Ionicons name='time-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{formatTime(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>{t('stats.totalTime')}</Text>
        </View>

        <View style={[styles.statCard, isLandscape && styles.landscapeStatCard]}>
          <Ionicons name='fitness-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{stats.totalCount}</Text>
          <Text style={styles.statLabel}>{t('stats.activityCount')}</Text>
        </View>

        <View style={[styles.statCard, isLandscape && styles.landscapeStatCard]}>
          <Ionicons name='speedometer-outline' size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {formatSpeed(stats.avgSpeed || 0, unitSystem)}
          </Text>
          <Text style={styles.statLabel}>{t('stats.avgSpeed')}</Text>
        </View>
      </View>

      {/* GRAFIKON AKTIVNOSTI */}
      <View style={[styles.chartCard, isLandscape && {paddingTop: 11, paddingBottom: 13}]}>
        <Text style={styles.chartTitle}>{t('stats.chartTitle', {period: t(chartData.periodLabelKey), unit: chartData.unit})}</Text>
        <BarChart data={{labels: chartData.labels, datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }],}}
                  width={computedChartWidth}
                  height={computedHeight}
                  yAxisLabel=''
                  yAxisSuffix={chartData.unit}
                  chartConfig={{
                    backgroundColor: Colors.cardBackground,
                    backgroundGradientFrom: Colors.cardBackground,
                    backgroundGradientTo: Colors.cardBackground,
                    decimalPlaces: 2,
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
  periodBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  periodBtnTextActive: { color: '#000', fontWeight: 'bold' },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  landscapeStatsGrid: {
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...SubtleElevation,
  },
  landscapeStatCard: {
    width: '23.5%',
    padding: 12,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chartCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    paddingBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...SubtleElevation,
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