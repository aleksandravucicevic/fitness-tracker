import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect,useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getActivityTypeName } from '../utils/activityUtils';
import { Colors } from '../utils/theme';
import { getAllActivities, deleteActivity } from '../db/activityRepository';
import { Activity } from '../models/Activity';
import { formatDistance, formatSpeed, formatTime, getUnitSystem } from '../utils/unitFormatter';
import { UnitSystem } from '../services/settingsService';

export const HistoryScreen = () => {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const navigation = useNavigation<any>();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const loadActivities = async () => {
    try {
      const currentUnit = await getUnitSystem();
      setUnitSystem(currentUnit);

      const data = await getAllActivities();
      setActivities(data);
    } catch (error) {
      console.error('Greška pri učitavanju istorije aktivnosti:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [])
  );

  const handleDelete = (id: number) => {
    Alert.alert(t('history.deleteTitle'), t('history.deleteMessage'), [
      { text: t('history.cancel'), style: 'cancel' },
      {
        text: t('history.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(id);
          loadActivities();
        },
      },
    ]);
  };

  const filteredActivities = activities.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesType;

    const translatedName = getActivityTypeName(item.type, t).toLowerCase();
    const formattedDate = new Date(item.date).toLocaleDateString(i18n.language).toLowerCase();
    const rawDate = item.date ? item.date.toString().toLowerCase() : '';

    const matchesSearch = translatedName.includes(query) ||
                          formattedDate.includes(query) ||
                          rawDate.includes(query);
    return matchesType && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* SEARCH, FILTER, LIST/TABLE VIEW */}
      <View style={styles.headerControls}>
        {/* SEARCH */}
        <View style={styles.searchBar}>
          <Ionicons name='search-outline' size={18} color={Colors.textSecondary} />
          <TextInput style={styles.searchInput} placeholder={t('history.searchPlaceholder')}
                    placeholderTextColor={Colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} autoCorrect={false} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* LIST/TABLE */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}>
            <Ionicons name='list' size={20} color={viewMode === 'list' ? '#000' : Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
          onPress={() => setViewMode('table')}>
            <Ionicons name='grid' size={18} color={viewMode === 'table' ? "#000" : Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTERI */}
      <View style={styles.filterChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.filterChips}>
          {['ALL', 'RUNNING', 'WALKING', 'CYCLING'].map((type) => (
            <TouchableOpacity key={type} style={[styles.chip, selectedType === type && styles.chipActive]}
              onPress={() => setSelectedType(type)}>
              <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                {getActivityTypeName(type, t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* SADRŽAJ LISTE/TABELE */}
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('history.noActivitiesFound')}</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList key={isLandscape ? 'landscape-list' : 'portrait-list'}
          numColumns={isLandscape ? 2 : 1}
          columnWrapperStyle={isLandscape ? { justifyContent: 'space-between' } : undefined}
          data={filteredActivities} keyExtractor={(item) => item.id!.toString()} 
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, isLandscape && { width: '49%' }]} activeOpacity={0.8} onPress={() => navigation.navigate('ActivityDetail', { activity: item })}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.activityType}>
                  {getActivityTypeName(item.type, t)}
                </Text>

                <Text style={styles.dateText}>
                  {new Date(item.date).toLocaleDateString(i18n.language)}
                </Text>
              </View>

              <TouchableOpacity style={styles.deleteButtonHeader} onPress={() => handleDelete(item.id!)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name='trash-outline' size={18} color={Colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t('history.distance')}</Text>
                <Text style={styles.metricValue}>{formatDistance(item.distance, unitSystem)}</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t('history.duration')}</Text>
                <Text style={styles.metricValue}>{formatTime(item.duration, true)}</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t('history.avgSpeed')}</Text>
                <Text style={styles.metricValue}>{formatSpeed(item.averageSpeed, unitSystem)}</Text>
              </View>
            </View>

          </TouchableOpacity>
          )}
        />
      ) : (
        /* ZAGLAVLJE TABELE */
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
          <View style={{ minWidth: Math.max(width - 38, 520) }}>
          <View style={[styles.tableHeader, isLandscape && { paddingVertical: 8 }]}>
            <Text style={[styles.th, {flex: 1.6}, isLandscape && {flex: 1.4}]}>{t('history.table.type')}</Text>
            <Text style={[styles.th, {flex: 1.2}]}>{t('history.table.date')}</Text>
            <Text style={[styles.th, {flex: 1}]}>{t('history.table.distance')}</Text>
            <Text style={[styles.th, {flex: 1}]}>{t('history.table.duration')}</Text>
            <Text style={[styles.th, {flex: 1}]}>{t('history.table.speed')}</Text>
            <Text style={[styles.th, {width: 40, textAlign: 'center'}]}>{t('history.table.action')}</Text>
          </View>

          {/* TIJELO TABELE*/}
          <FlatList data={filteredActivities} keyExtractor={(item) => item.id!.toString()}
            renderItem={({item, index}) => (
            <View style={[styles.tableRow, index % 2 === 1 && {backgroundColor: Colors.cardBackground},]}>
              <TouchableOpacity style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }} activeOpacity={0.7} 
              onPress={() => navigation.navigate('ActivityDetail', {activity: item})}>
                <Text style={[styles.td, {flex: 1.2, fontWeight: 'bold'}]}>
                  {getActivityTypeName(item.type, t)}
                </Text>

                <Text style={[styles.td, {flex: 1.2}]}>
                  {new Date(item.date).toLocaleDateString(i18n.language)}
                </Text>

                <Text style={[styles.td, {flex: 1}]}>
                  {formatDistance(item.distance, unitSystem)}
                </Text>

                <Text style={[styles.td, {flex: 1}]}>
                  {formatTime(item.duration, true)}
                </Text>

                <Text style={[styles.td, {flex: 1}]}>
                  {formatSpeed(item.averageSpeed, unitSystem)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={{width: 40, alignItems: 'center', justifyContent: 'center'}}
              onPress={() => handleDelete(item.id!)}>
                <Ionicons name='trash-outline' size={16} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            )}
          />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 18, paddingBottom: 5 },
  headerControls: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 8, marginLeft: 8 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { padding: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: Colors.primary },
  filterChipsContainer: { marginBottom: 10 },
  filterChips: { flexDirection: 'row', gap: 8 },
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
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  activityType: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  dateText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  deleteButtonHeader: {
    padding: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  metric: { alignItems: 'flex-start' },
  metricLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 2 },
  metricValue: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  tableScrollView: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  th: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  td: { color: Colors.textPrimary, fontSize: 13 },
});