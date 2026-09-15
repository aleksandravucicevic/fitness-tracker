import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { RippleTouchable } from './RippleTouchable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Colors, CardElevation } from '../utils/theme';

interface DatePickerModalProps {
  visible: boolean;
  date: Date;
  maximumDate?: Date;
  onClose: () => void;
  onSelectDate: (selectedDate: Date) => void;
}

const cyrillicToLatin = (text: string): string => {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e',
    'ж': 'ž', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj',
    'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
    'т': 't', 'ћ': 'ć', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'č',
    'џ': 'dž', 'ш': 'š',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E',
    'Ж': 'Ž', 'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj',
    'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S',
    'Т': 'T', 'Ћ': 'Ć', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Č',
    'Џ': 'Dž', 'Ш': 'Š',
  };

  return text.split('').map(char => map[char] || char).join('');
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  date,
  maximumDate = new Date(),
  onClose,
  onSelectDate,
}) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

  if (!visible) return null;

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const startingOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(newMonth);
  };

  const handleDaySelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (maximumDate && selected > maximumDate) return;
    onSelectDate(selected);
    onClose();
  };

  const gridItems = [];
  for (let i = 0; i < startingOffset; i++) {
    gridItems.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridItems.push(i);
  }

  const weekDays = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <RippleTouchable style={styles.overlay} onPress={onClose}>
        <RippleTouchable style={styles.card}>
          {/* Zaglavlje sa mjesecima */}
          <View style={styles.header}>
            <RippleTouchable style={styles.navBtn} onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </RippleTouchable>
            <Text style={styles.monthTitle}>
              {cyrillicToLatin(currentMonth.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }))}
            </Text>
            <RippleTouchable style={styles.navBtn} onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </RippleTouchable>
          </View>

          {/* Dani u sedmici */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Mreža sa danima */}
          <View style={styles.grid}>
            {gridItems.map((item, index) => {
              if (item === null) {
                return <View key={index} style={styles.dayCell} />;
              }

              const itemDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), item);
              const isSelected =
                itemDate.getDate() === date.getDate() &&
                itemDate.getMonth() === date.getMonth() &&
                itemDate.getFullYear() === date.getFullYear();

              const isDisabled = maximumDate && itemDate > maximumDate;

              return (
                <RippleTouchable
                  key={index}
                  disabled={isDisabled}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDayCell,
                    isDisabled && styles.disabledDayCell,
                  ]}
                  onPress={() => handleDaySelect(item)}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isDisabled && styles.disabledDayText,
                  ]}>
                    {item}
                  </Text>
                </RippleTouchable>
              );
            })}
          </View>

          <RippleTouchable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('picker.cancel') ?? t('picker.close')}</Text>
          </RippleTouchable>
        </RippleTouchable>
      </RippleTouchable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CardElevation,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    width: 36,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: Colors.primary,
  },
  disabledDayCell: {
    opacity: 0.3,
  },
  dayText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#000',
    fontWeight: 'bold',
  },
  disabledDayText: {
    color: Colors.textSecondary,
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});