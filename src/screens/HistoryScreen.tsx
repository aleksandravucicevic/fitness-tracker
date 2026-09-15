import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  const [selectedDuration, setSelectedDuration] = useState<'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'>('ALL');
  const navigation = useNavigation<any>();

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  const matchesDurationFilter = (durationSeconds: number): boolean => {
    const minutes = durationSeconds / 60;
    switch(selectedDuration) {
      case 'SHORT':
        return minutes < 30;
      case 'MEDIUM':
        return minutes >= 30 && minutes <= 60;
      case 'LONG':
        return minutes > 60;
      default:
        return true;
    }
  }

  const filteredActivities = activities.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesDuration = matchesDurationFilter(item.duration);

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesType && matchesDuration;

    const translatedName = getActivityTypeName(item.type, t).toLowerCase();
    const formattedDate = new Date(item.date).toLocaleDateString(i18n.language).toLowerCase();
    const rawDate = item.date ? item.date.toString().toLowerCase() : '';

    const matchesSearch = translatedName.includes(query) ||
                          formattedDate.includes(query) ||
                          rawDate.includes(query);
    return matchesType && matchesDuration && matchesSearch;
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedType, selectedDuration]);

  const pagedActivities = filteredActivities.slice(0, visibleCount);
  const hasMoreToLoad = visibleCount < filteredActivities.length;

  const handleLoadMore = () => {
    if(hasMoreToLoad)
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredActivities.length));
  };

  return (
    <View style={[styles.container, isLandscape && { padding: 18 }]}>
      {/* SEARCH, FILTER, LIST/TABLE VIEW */}
      <View style={[styles.controlsCard, isLandscape && styles.controlsCardLandscape]}>
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
        <View style={[styles.filtersWrapper, isLandscape ? styles.filtersWrapperLandscape : styles.filtersWrapperPortrait]}>
          
          {/* TIP AKTIVNOSTI */}
          <View style={[styles.filterChipsContainer, isLandscape ? styles.filterChipsLandscape : styles.filterChipsPortrait]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
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

          {/* SEPARATOR */}
          {isLandscape ? (
            <View style={styles.verticalDivider} />
          ) : (
            <View style={styles.horizontalDivider} />
          )}

          {/* TRAJANJE */}
          <View style={[styles.filterChipsContainer, isLandscape ? styles.filterChipsLandscape : styles.filterChipsPortrait]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {(['ALL', 'SHORT', 'MEDIUM', 'LONG'] as const).map((durationOption) => (
                <TouchableOpacity key={durationOption} style={[styles.chip, selectedDuration === durationOption && styles.chipActive]}
                  onPress={() => setSelectedDuration(durationOption)}>
                  <Text style={[styles.chipText, selectedDuration === durationOption && styles.chipTextActive]}>
                    {t(`history.durationFilter.${durationOption}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </View>
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
          data={pagedActivities} keyExtractor={(item) => item.id!.toString()} 
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMoreToLoad ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadMoreText}>{t('history.loadingMore')}</Text>
            </View>
          ) : null}
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
          <FlatList data={pagedActivities} keyExtractor={(item) => item.id!.toString()}
            onEndReached={handleLoadMore} onEndReachedThreshold={0.5} ListFooterComponent={hasMoreToLoad ? (
              <View style={styles.loadMoreFooter}>
                <ActivityIndicator size='small' color={Colors.primary} />
                <Text style={styles.loadMoreText}>{t('history.loadingMore')}</Text>
              </View>
            ) : null}
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
  container: { flex: 1, backgroundColor: Colors.background, padding: 15, paddingBottom: 5 },
  controlsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlsCardLandscape: {
    paddingVertical: 8,
  },
  headerControls: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center', },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 13, paddingVertical: 8, marginLeft: 6 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { padding: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: Colors.primary },
  filtersWrapper: { width: '100%' },
  filtersWrapperPortrait: {
    flexDirection: 'column',
    gap: 4,
  },
  filtersWrapperLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipsContainer: {},
  filterChipsLandscape: {
    flex: 1,
    minWidth: 0,
  },
  filterChipsPortrait: {
    width: '100%',
  },
  verticalDivider: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  horizontalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.border,
    marginVertical: 1,
  },
  filterChips: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: 'bold' },
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  activityType: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  dateText: { color: Colors.textSecondary, fontSize: 13, marginTop: 1 },
  deleteButtonHeader: {
    padding: 5,
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
  loadMoreFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: { color: Colors.textSecondary, fontSize: 13 },
});