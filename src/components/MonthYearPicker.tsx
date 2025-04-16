import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

interface MonthYearPickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (month: number, year: number) => void;
  initialMonth?: number;
  initialYear?: number;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  visible,
  onClose,
  onApply,
  initialMonth = new Date().getMonth() + 1,
  initialYear = new Date().getFullYear(),
}) => {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const handleApply = () => {
    onApply(selectedMonth, selectedYear);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Chọn thời gian hiển thị</Text>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {/* <TouchableOpacity style={styles.tab}><Text style={styles.inactiveTabText}>Tuần</Text></TouchableOpacity> */}
            <TouchableOpacity style={[styles.tab, styles.activeTab]}><Text style={styles.activeTabText}>Tháng</Text></TouchableOpacity>
          </View>

          {/* Chọn năm */}
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)}>
              <Text style={styles.arrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity onPress={() => setSelectedYear(prev => prev + 1)}>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Grid tháng */}
          <View style={styles.monthGrid}>
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const isSelected = selectedMonth === month;
              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => setSelectedMonth(month)}
                  style={[styles.monthItem, isSelected && styles.monthItemSelected]}
                >
                  <Text style={isSelected ? styles.monthTextSelected : styles.monthText}>Tháng {month}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Nút hành động */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
                onClose();
              }}
            >
              <Text style={styles.resetText}>Xoá bộ lọc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '65%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fc9260',
  },
  activeTabText: {
    color: '#fc9260',
    fontWeight: 'bold',
  },
  inactiveTabText: {
    color: '#888',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrow: {
    fontSize: 20,
    paddingHorizontal: 16,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    alignItems: 'center',
  },
  monthItemSelected: {
    backgroundColor: '#fc9260',
  },
  monthText: {
    color: '#333',
    fontWeight: '500',
  },
  monthTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetText: {
    fontWeight: '600',
    color: '#999',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#fc9260',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyText: {
    fontWeight: '600',
    color: '#fff',
  },
});

export default MonthYearPicker;
