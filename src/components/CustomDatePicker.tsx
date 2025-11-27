/**
 * CustomDatePicker - Expo-compatible date picker
 * Simple date picker using Modal and ScrollView (no native modules)
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CustomDatePickerProps {
  visible: boolean;
  value: Date;
  maximumDate?: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function CustomDatePicker({
  visible,
  value,
  maximumDate = new Date(),
  minimumDate,
  onConfirm,
  onCancel,
}: CustomDatePickerProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(value);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onConfirm(newDate);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelButton}>
                {t('common.cancel', { defaultValue: 'Hủy' })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('photoHistory.filters.selectDate', { defaultValue: 'Chọn ngày' })}
            </Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={[styles.cancelButton, styles.confirmButton]}>
                {t('common.confirm', { defaultValue: 'Xong' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          <View style={styles.pickersRow}>
            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Ngày</Text>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.pickerItemTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Tháng</Text>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {months.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.pickerItem,
                      selectedMonth === month && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(month);
                      // Adjust day if current day doesn't exist in new month
                      const newDaysInMonth = getDaysInMonth(selectedYear, month);
                      if (selectedDay > newDaysInMonth) {
                        setSelectedDay(newDaysInMonth);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedMonth === month && styles.pickerItemTextSelected,
                      ]}
                    >
                      {monthNames[month]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Năm</Text>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      // Adjust day if current day doesn't exist in new year/month combo
                      const newDaysInMonth = getDaysInMonth(year, selectedMonth);
                      if (selectedDay > newDaysInMonth) {
                        setSelectedDay(newDaysInMonth);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Selected Date Preview */}
          <View style={styles.previewContainer}>
            <Ionicons name="calendar" size={20} color="#4CAF50" />
            <Text style={styles.previewText}>
              {selectedDay}/{selectedMonth + 1}/{selectedYear}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#999',
  },
  confirmButton: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  pickersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  picker: {
    height: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  pickerContent: {
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
  },
  pickerItemTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    gap: 8,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

