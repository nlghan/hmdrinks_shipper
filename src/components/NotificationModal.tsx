import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface NotificationModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ visible, message, onClose }) => {
  const { t } = useTranslation();

  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{t('common.noti')}</Text>

            <View style={styles.notificationItem}>
              <Text style={styles.message}>{message}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#FFF6EE',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E35D11',
    marginBottom: 10,
  },
  notificationItem: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: 'rgba(255, 232, 218, 0.87)',
    borderRadius: 6,
    width: '100%',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: 'rgba(233, 102, 20, 0.87)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationModal;
