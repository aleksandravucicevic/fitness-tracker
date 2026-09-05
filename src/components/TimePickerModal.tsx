import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../utils/theme';

interface TimePickerModalProps {
  visible: boolean;
  date: Date;
  onClose: () => void;
  onSelectTime: (selectedTime: Date) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  date,
  onClose,
  onSelectTime,
}) => {
  const { t } = useTranslation();
  const [selectedHour, setSelectedHour] = useState(date.getHours());
  const [selectedMinute, setSelectedMinute] = useState(date.getMinutes());

  if (!visible) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const updated = new Date(date);
    updated.setHours(selectedHour, selectedMinute);
    onSelectTime(updated);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>{t('picker.time')}</Text>

          <View style={styles.pickerContainer}>
            {/* Sati */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>{t('picker.hours')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeItem, selectedHour === h && styles.selectedItem]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[styles.timeText, selectedHour === h && styles.selectedTimeText]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.colon}>:</Text>

            {/* Minuti */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>{t('picker.minutes')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timeItem, selectedMinute === m && styles.selectedItem]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text style={[styles.timeText, selectedMinute === m && styles.selectedTimeText]}>
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('picker.cancel') ?? t('picker.close')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>{t('picker.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    maxWidth: 300,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 180,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  scroll: {
    width: '100%',
  },
  timeItem: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: Colors.primary,
  },
  timeText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTimeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  colon: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 10,
    marginTop: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },
});