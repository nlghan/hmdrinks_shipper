import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import useWebSocket from '../utils/Socket';
import { useTranslation } from 'react-i18next';

type NotificationWS = {
    userId: number;
    shipmentId: number;
    message: string;
    time: string;
};

interface NotificationPopupProps {
    userId: number; // Thêm kiểu rõ ràng
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ userId }) => {
    const socketNotifications = useWebSocket(userId);
    const [notifications, setNotifications] = useState<NotificationWS[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const { t } = useTranslation();
    const isModalOpen = useRef(false);
    const lastNotificationTime = useRef<number | null>(null);

    useEffect(() => {
        if (socketNotifications.length === 0) return;

        const newNotification = socketNotifications[socketNotifications.length - 1];
        const newNotificationTime = Number(newNotification.time);

        // 🔹 Chỉ thêm thông báo mới nếu chưa hiển thị
        if (
            lastNotificationTime.current !== newNotificationTime && 
            !notifications.some(noti => Number(noti.time) === newNotificationTime)
        ) {
            lastNotificationTime.current = newNotificationTime;
            setNotifications((prev) => [...prev, newNotification]);

            // 🔹 Đảm bảo modal chỉ mở một lần
            if (!isModalOpen.current) {
                setModalVisible(true);
                isModalOpen.current = true;
            }
        }
    }, [socketNotifications]);

    const closeModal = () => {
        setModalVisible(false);
        isModalOpen.current = false; 
    };

    return (
        <View>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>{t('common.noti')}</Text>                        
                        <FlatList
                            data={notifications}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.notificationItem}>
                                    <Text style={styles.message}>{item.message}</Text>
                                    {/* <Text style={styles.time}>{item.time}</Text>                                     */}
                                </View>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Giữ hiệu ứng mờ nền
    },
    modalContent: {
        width: 320,
        backgroundColor: '#FFF6EE', // 🎨 Trắng ngả cam
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8, // Bóng đổ cho Android
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E35D11', // 🎨 Cam đậm để nổi bật
        marginBottom: 10,
    },
    notificationItem: {
        padding: 12,
        marginVertical: 6,
        backgroundColor: 'rgba(255, 232, 218, 0.87)', // 🎨 Cam nhạt đẹp mắt
        borderRadius: 6,
        width: '100%',
    },
    message: {
        fontSize: 16,
        color: '#333',
    },
    time: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'right',
    },
    closeButton: {
        marginTop: 15,
        backgroundColor: 'rgba(233, 102, 20, 0.87)', // 🎨 Giữ màu cam của nút đóng
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5, // Hiệu ứng bóng cho Android
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});


export default NotificationPopup;
