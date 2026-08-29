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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../utils/theme';
import { getAllActivities, deleteActivity } from '../db/activityRepository';
import { Activity, ActivityType } from '../models/Activity';

export const HistoryScreen = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const loadActivities = async () => {
    try {
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
    Alert.alert('Brisanje aktivnosti', 'Da li ste sigurni da želite obrisati aktivnost?', [
      { text: 'Otkazati', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(id);
          loadActivities();
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds/60);
    const secs = seconds % 60;
    return `${mins} min ${secs < 10 ? '0' : ''}${secs} s`;
  };

  const filteredActivities = activities.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesSearch = item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          new Date(item.date).toLocaleDateString('sr-RS').includes(searchQuery);
    return matchesType && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* SEARCH, FILTER, LIST/TABLE VIEW */}
      <View style={styles.headerControls}>
        {/* SEARCH */}
        <View style={styles.searchBar}>
          <Ionicons name='search-outline' size={18} color={Colors.textSecondary} />
          <TextInput style={styles.searchInput} placeholder='Pretraga po datumu ili tipu...'
                    placeholderTextColor={Colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
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
      <View style={styles.filterChips}>
        {['ALL', 'RUNNING', 'WALKING', 'CYCLING'].map((type) => (
          <TouchableOpacity key={type} style={[styles.chip, selectedType === type && styles.chipActive]}
            onPress={() => setSelectedType(type)}>
            <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
              {type === 'ALL' ? 'Sve' : type === 'RUNNING' ? 'Trčanje' : type === 'WALKING' ? 'Hodanje' : 'Bicikl'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SADRŽAJ LISTE/TABELE */}
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nema pronađenih aktivnosti.</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList data={filteredActivities} keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.activityType}>
                {item.type === 'RUNNING' ? 'Trčanje' : item.type === 'WALKING' ? 'Hodanje' : 'Bicikl'}
              </Text>

              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('sr-RS')}
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Distanca</Text>
                <Text style={styles.metricValue}>{(item.distance/1000).toFixed(2)} km</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Trajanje</Text>
                <Text style={styles.metricValue}>{formatTime(item.duration)}</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Prosjek</Text>
                <Text style={styles.metricValue}>{item.averageSpeed} km/h</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id!)}>
              <Ionicons name='trash-outline' size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          )}
        />
      ) : (
        /* ZAGLAVLJE TABELE */
        <ScrollView horizontal style={styles.tableScrollView}>
          <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, {width: 90}]}>Tip</Text>
            <Text style={[styles.th, {width: 90}]}>Datum</Text>
            <Text style={[styles.th, {width: 80}]}>Distanca</Text>
            <Text style={[styles.th, {width: 80}]}>Trajanje</Text>
            <Text style={[styles.th, {width: 80}]}>Brzina</Text>
            <Text style={[styles.th, {width: 50, textAlign: 'center'}]}>Akcija</Text>
          </View>

          {/* TIJELO TABELE*/}
          <FlatList data={filteredActivities} keyExtractor={(item) => item.id!.toString()}
            renderItem={({item, index}) => (
            <View style={[styles.tableRow, index % 2 === 1 && {backgroundColor: Colors.cardBackground},]}>
              <Text style={[styles.td, {width: 90, fontWeight: 'bold'}]}>
                {item.type === 'RUNNING' ? 'Trčanje' : item.type === 'WALKING' ? 'Hodanje' : 'Bicikl'}
              </Text>

              <Text style={[styles.td, {width: 90}]}>
                {new Date(item.date).toLocaleDateString('sr-RS')}
              </Text>

              <Text style={[styles.td, {width: 80}]}>
                {(item.distance/1000).toFixed(2)} km
              </Text>

              <Text style={[styles.td, {width: 80}]}>
                {formatTime(item.duration)}
              </Text>

              <Text style={[styles.td, {width: 80}]}>
                {item.averageSpeed} km/h
              </Text>

              <TouchableOpacity style={{width: 50, alignItems: 'center'}}
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
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  headerControls: { flexDirection: 'row', gap: 10, marginBottom: 12 },
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
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { padding: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: Colors.primary },
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
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  activityType: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  dateText: { color: Colors.textSecondary, fontSize: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30 },
  metric: { alignItems: 'flex-start' },
  metricLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 2 },
  metricValue: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  deleteButton: { position: 'absolute', bottom: 16, right: 16, padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  tableScrollView: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
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