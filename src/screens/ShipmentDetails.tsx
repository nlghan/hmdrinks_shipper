import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, StyleSheet, Button } from 'react-native';
import {
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useShipperStore } from "../store/store";
import { t } from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosInstance';
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTFAMILY } from '../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/RootStackParamList";
import { useFetchData } from '../components/FetchDataContext';
import CustomModalConfirm from '../styles/CustomModalConfirm';
import NotificationModal from '../components/NotificationModal';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export interface OrderItem {
    cartItemId: string;
    proName: string;
    size: string;
    priceItem: number;
    quantity: number;
    totalPrice: number;
}

export interface Order {
    orderId: string;
    listItemOrders: OrderItem[];
}

export interface Payment {
    paymentId: string;
    orderId: string;
    paymentMethod: string;
    statusPayment: string;
    amount: number;
}

export interface Shipment {
    shipmentId: number;
    customerName: string;
    address: string;
    phoneNumber: string;
    status: 'WAITING' | 'SHIPPING' | 'SUCCESS' | 'CANCELLED';
    note?: string;
    dateCreated: string;
    dateCancelled?: string;
    paymentId: string;
}

const ShipmentDetails = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<{ params: { shipmentId: string } }, 'params'>>();
    const { shipmentId } = route.params;
    const { fetchData } = useFetchData();
    const { userId, language, setLanguage } = useShipperStore();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [payment, setPayment] = useState<Payment | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [error1, setError1] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [modalVisible1, setModalVisible1] = useState(false);
    const [confirmMessage1, setConfirmMessage1] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [note, setNote] = useState(shipment?.note || '');
    const [noteError, setNoteError] = useState(false);

    const fetchShipmentDetail = async () => {
        setError("");
        setLoading(true);

        try {
            // Lấy token từ AsyncStorage (hoặc SecureStore nếu dùng expo)
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                setError(
                    language === 'EN'
                        ? 'Please log in again.'
                        : 'Vui lòng đăng nhập lại.'
                );
                setLoading(false);
                return;
            }

            // Lấy chi tiết shipment
            const shipmentResponse = await axiosInstance.get(
                `/shipment/view/${shipmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const shipmentData = shipmentResponse.data;
            console.log('Shipment data:', shipmentData);
            setShipment(shipmentData);

            // Lấy thông tin thanh toán
            const paymentResponse = await axiosInstance.get(
                `/payment/view/${shipmentData.paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const paymentData = paymentResponse.data;
            setPayment(paymentData);

            // Lấy chi tiết đơn hàng
            const orderResponse = await axiosInstance.get(
                `/orders/detail-item/${paymentData.orderId}?language=${language}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const orderData = orderResponse.data;
            setOrder(orderData);

            setSelectedStatus(shipmentData.status); // Gán trạng thái ban đầu
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(
                language === 'EN'
                    ? 'Unable to load shipment details.'
                    : 'Không thể tải thông tin.'
            );
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipmentDetail();
    }, [shipmentId, language]);

    const handleStatusChange = async (
        shipmentId: number | undefined,
        newStatus: string,
        fetchShipmentDetail: () => void,
        setError: (error: string) => void
    ): Promise<boolean> => {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
            const msg = language === 'EN'
                ? 'Please log in again.'
                : 'Vui lòng đăng nhập lại.';
            setError(msg);
            return false;
        }

        if (!userId) {
            const msg = language === 'EN'
                ? 'Unable to identify UserId.'
                : 'Không thể xác định UserId.';
            setError(msg);
            return false;
        }

        // 🔴 Kiểm tra điều kiện: nếu chọn SUCCESS hoặc CANCELLED mà chưa phải SHIPPING → không cho tiếp tục
        if ((newStatus === 'SUCCESS' || newStatus === 'CANCELLED') && shipment?.status !== 'SHIPPING') {
            const msg = language === 'EN'
                ? 'You must set the status to SHIPPING before selecting SUCCESS or CANCELLED.'
                : 'Bạn phải chọn trạng thái Đang giao trước khi chọn Đã giao hoặc Hủy.';
            setConfirmMessage1(msg);
            setModalVisible1(true);
            return false; // báo lỗi và dừng
        }

        setNote(''); // Reset ghi chú

        try {
            let response;

            if (newStatus === 'SUCCESS') {
                response = await axiosInstance.post(
                    `/shipment/activate/success`,
                    { userId, shipmentId },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log('API response (SUCCESS):', response.data);
                fetchShipmentDetail();
            } else if (newStatus === 'CANCELLED') {
                response = await axiosInstance.post(
                    `/shipment/activate/cancel`,
                    { userId, shipmentId },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log('API response (CANCELLED):', response.data);
                fetchShipmentDetail();
            } else if (newStatus === 'SHIPPING') {
                response = await axiosInstance.post(
                    `/shipment/activate/shipping`,
                    { userId, shipmentId },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log('API response (SHIPPING):', response.data);
                fetchShipmentDetail();
            } else {
                response = await axiosInstance.put(
                    `/shipment/update-status/${shipmentId}`,
                    { status: newStatus },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log('Status updated:', response.data);
            }

            return true; // ✅ thành công
        } catch (error) {
            console.error(`Error updating status (${newStatus}):`, error);
            const msg = language === 'EN'
                ? 'Unable to update status of the order.'
                : 'Không thể cập nhật trạng thái đơn hàng.';
            setError(msg);
            return false; // ❌ lỗi
        }
    };


    const handleUpdateNote = async (
        shipmentId: number,
        note: string,
        setError: (error: string) => void,
        fetchShipmentDetail: () => void
    ) => {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
            setError(language === 'VN' ? 'Vui lòng đăng nhập lại.' : 'Please log in again.');
            return;
        }

        try {
            const response = await axiosInstance.post(
                `/shipment/update-note`,
                {
                    shipmentId,
                    note,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Note updated:', response.data);
            fetchShipmentDetail();
        } catch (error) {
            console.error('Error updating note:', error);
            setError(language === 'VN'
                ? 'Không thể cập nhật ghi chú.'
                : 'Unable to update note.');
        }
    };


    const handleConfirmStatus = () => {
        if (!selectedStatus) return;

        let confirmMessage = '';
        let successMessage = '';

        switch (selectedStatus) {
            case 'CANCELLED':
                confirmMessage = language === 'VN'
                    ? 'Bạn có chắc chắn muốn hủy đơn này?'
                    : 'Are you sure you want to cancel this order?';
                successMessage = language === 'VN'
                    ? 'Đơn hàng đã bị hủy.'
                    : 'The order has been canceled.';
                break;
            case 'SHIPPING':
                confirmMessage = language === 'VN'
                    ? 'Bạn có chắc chắn muốn giao đơn này?'
                    : 'Are you sure you want to ship this order?';
                successMessage = language === 'VN'
                    ? 'Đơn hàng đang được giao.'
                    : 'The order is being shipped.';
                break;
            case 'SUCCESS':
                confirmMessage = language === 'VN'
                    ? 'Bạn có chắc chắn đã hoàn thành đơn này?'
                    : 'Are you sure this order is completed?';
                successMessage = language === 'VN'
                    ? 'Đơn hàng đã hoàn thành.'
                    : 'The order is completed.';
                break;
            case 'WAITING':
                confirmMessage = language === 'VN'
                    ? 'Bạn có chắc chắn đang chờ giao đơn này?'
                    : 'Are you sure this order is waiting for shipment?';
                successMessage = language === 'VN'
                    ? 'Đơn hàng đang chờ giao.'
                    : 'The order is waiting for shipment.';
                break;
            default:
                return;
        }
        setConfirmMessage(confirmMessage);
        setSuccessMessage(successMessage);
        setCurrentStatus(selectedStatus);
        setModalVisible(true);
    };

    const statusColor = {
        SUCCESS: '#6fb380',
        SHIPPING: '#76a9e3',
        WAITING: '#c77ba6',
        CANCELLED: '#b3796f',
    };
    useEffect(() => {
        if (shipment?.note) {
            setNote(shipment.note);
        } else {
            setNote('');
        }
    }, [shipment]);


const handleModalConfirm = async () => {
    if (!currentStatus) return;

    if (currentStatus === 'CANCELLED' && note.trim() === '') {
        setNoteError(true);
        return;
    }
    setModalVisible(false); // ✅ Chỉ đóng khi thành công
    const success = await handleStatusChange(
        shipment?.shipmentId,
        currentStatus,
        fetchShipmentDetail,
        setError
    );

    if (!success) return; // ⛔ Không đóng modal nếu sai logic (ví dụ: đang ở WAITING mà chọn CANCELLED)



    if (currentStatus === 'CANCELLED' && shipment?.shipmentId) {
        await handleUpdateNote(
            shipment.shipmentId,
            note,
            setError,
            fetchShipmentDetail
        );
    }

    fetchData(1);
};



    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                            <Icon name="arrow-back" size={20} color="#FF9800" />
                        </TouchableOpacity>
                        <Text style={styles.header}>{t('orderInfo1')}</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#FFA983" />
                    ) : error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : (
                        <>
                            <View style={styles.card}>
                                <Text style={styles.title}>{t('orderDetail')}</Text>
                                <Text style={styles.text}>{t('order.orderCode')}: {order?.orderId}</Text>
                                <Text style={styles.text}>{t('order.customer')}: {shipment?.customerName}</Text>
                                <Text style={styles.text}>{t('address')}: {shipment?.address}</Text>
                                <Text style={styles.text}>{t('phone')}: {shipment?.phoneNumber}</Text>
                                <Text style={styles.text}>{t('order.deliveryCode')}: {shipment?.shipmentId}</Text>
                                <Text style={styles.text}>{t('shippingStatus')}: {shipment?.status}</Text>
                                <Text style={styles.text}>{t('order.orderDate')}: {shipment?.dateCreated}</Text>
                                <Text style={styles.text}>{t('note')}: {shipment?.note || t('order.noNote')}</Text>
                                {shipment?.status === 'CANCELLED' && shipment?.dateCancelled && (
                                    <Text>{t('order.cancelDate')}: {shipment.dateCancelled}</Text>
                                )}

                                <Text style={styles.title}>{t('infoPayment1')}</Text>
                                <Text style={styles.text}>{t('paymentMethod')}: {payment?.paymentMethod}</Text>
                                <Text style={styles.text}>{t('statusPayment')}: {payment?.statusPayment}</Text>
                                <Text style={styles.text}>{t('order.total')}: {payment?.amount} VND</Text>

                                <Text style={styles.title}>{t('common.proList')}</Text>
                                {order?.listItemOrders.map(item => (
                                    <View key={item.cartItemId} style={styles.itemBox}>
                                        <Text style={styles.text}>{t('product')}: {item.proName}</Text>
                                        <Text style={styles.text}>{t('size')}: {item.size}</Text>
                                        <Text style={styles.text}>{t('price')}: {item.priceItem} VND</Text>
                                        <Text style={styles.text}>{t('quantity')}: {item.quantity}</Text>
                                        <Text style={styles.text}>{t('order.orderDetail.sum')}: {item.totalPrice} VND</Text>
                                    </View>
                                ))}



                                {/* Trạng thái và xác nhận */}
                                <View style={{ marginTop: 16 }}>
                                    {shipment && (
                                        <Picker
                                            enabled={shipment.status !== 'SUCCESS' && shipment.status !== 'CANCELLED'}
                                            selectedValue={selectedStatus}
                                            onValueChange={(value) => {
                                                setSelectedStatus(value);
                                                // Reset ghi chú nếu không phải CANCELLED
                                                if (value !== 'CANCELLED') {
                                                    setNote('');
                                                }
                                            }}
                                            style={[styles.picker, {
                                                backgroundColor: statusColor[shipment.status] || 'pink',
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                            }]}
                                        >
                                            <Picker.Item label={t('orderContent.status.cancel')} value="CANCELLED" />
                                            <Picker.Item label={t('orderContent.status.ship')} value="SHIPPING" />
                                            <Picker.Item label={t('orderContent.status.complete')} value="SUCCESS" />
                                            <Picker.Item label={t('orderContent.status.wait')} value="WAITING" />
                                        </Picker>
                                    )}
                                    {shipment?.note && (
                                        <Text style={{ marginTop: 8, fontStyle: 'italic' }}>
                                            {t('order.currentNote')}{' '}
                                            {shipment?.note?.trim()
                                                ? shipment.note
                                                : language === 'VN'
                                                    ? 'Không có ghi chú'
                                                    : 'No note'}
                                        </Text>
                                    )}
                                    {/* Ô nhập ghi chú - chỉ hiện khi chọn CANCELLED hoặc nếu cần nhập ghi chú */}
                                    {/* Ô ghi chú */}
                                    {shipment?.status === 'SHIPPING' && (
                                        <View style={{ marginBottom: verticalScale(10) }}>
                                            <TextInput
                                                value={note}
                                                onChangeText={(text) => {
                                                    setNote(text);
                                                    if (text.trim() !== '') {
                                                        setNoteError(false);
                                                        setError('');
                                                    }
                                                }}
                                                placeholder={
                                                    noteError
                                                        ? (language === 'VN'
                                                            ? 'Vui lòng nhập ghi chú khi hủy đơn'
                                                            : 'Please enter cancellation note')
                                                        : t('order.enterNote')
                                                }
                                                placeholderTextColor={noteError ? 'red' : '#aaa'}
                                                style={{
                                                    borderColor: noteError ? 'red' : 'gray',
                                                    borderWidth: 1,
                                                    borderRadius: 8,
                                                    padding: 8,
                                                    backgroundColor: '#fff',
                                                    minHeight: 60,
                                                    textAlignVertical: 'top',
                                                }}
                                                multiline
                                            />
                                        </View>
                                    )}

                                    {/* {(shipment?.status === 'SUCCESS' || shipment?.status === 'CANCELLED') && (
                                        <View style={{ marginBottom: verticalScale(10) }}>
                                            <View
                                                style={{
                                                    borderColor: '#ccc',
                                                    borderWidth: 1,
                                                    borderRadius: 8,
                                                    padding: 8,
                                                    backgroundColor: '#f0f0f0',
                                                    minHeight: 60,
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ color: '#333' }}>
                                                    {shipment.note?.trim()
                                                        ? shipment.note
                                                        : (language === 'VN' ? 'Không có ghi chú' : 'No note')}
                                                </Text>
                                            </View>
                                        </View>
                                    )} */}

                                    {error1 && <Text style={styles.errorText}>{error1}</Text>}

                                    {shipment?.status !== 'SUCCESS' && shipment?.status !== 'CANCELLED' && (
                                        <Button
                                            title={t('order.orderDetail.confirm')}
                                            disabled={!selectedStatus || selectedStatus === shipment?.status}
                                            onPress={handleConfirmStatus}
                                            color="#4CAF50"

                                        />
                                    )}
                                </View>
                            </View>
                        </>
                    )}
                    <CustomModalConfirm
                        visible={modalVisible}
                        title={language === 'VN' ? 'Xác nhận' : 'Confirmation'}
                        message={confirmMessage}
                        onCancel={() => setModalVisible(false)}
                        onConfirm={handleModalConfirm}
                        cancelText={language === 'VN' ? 'Hủy' : 'Cancel'}
                        confirmText={language === 'VN' ? 'Xác nhận' : 'Confirm'}
                    />
                    <NotificationModal
                        visible={modalVisible1}
                        message={confirmMessage1}
                        onClose={() => setModalVisible1(false)}
                    />

                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default ShipmentDetails;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Căn giữa nội dung theo chiều ngang

        fontSize: 25,
        fontFamily: FONTFAMILY.lobster_regular,
        textAlign: 'center', // Căn giữa văn bản trong Text
    },
    card: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FF9800',
        marginVertical: 12,
        fontFamily: FONTFAMILY.lobster_regular,
    },
    text: {
        fontSize: 22,
        fontFamily: FONTFAMILY.dongle_regular,
    },
    itemBox: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#fff8f2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    label: {
        fontWeight: '500',
        color: '#333',
    },
    value: {
        color: '#555',
        fontWeight: '400',
    },
    backButton: {
        position: 'absolute',
        left: 10,
        top: 10
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    picker: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        color: '#fff',
        borderRadius: 20,
        marginBottom: 12,
    },
});

