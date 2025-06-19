import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { Button } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useShipperStore } from '../store/store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StatusBar from '../components/StatusBar';
import { FONTFAMILY } from '../theme/theme';
import { useNotification } from '../components/NotificationContext';
import Header from '../components/Header';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/RootStackParamList";
import NotificationPopup from '../components/NotificationPopup';
import Notification from '../components/Notification';
import { useFetchData } from '../components/FetchDataContext';
import EmptyListAnimation from '../components/EmptyListAnimation';
import axios from 'axios';

// Định nghĩa interface cho Shipment
interface Shipment {
  shipmentId: string;
  orderId?: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  status: 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED' | string;
  dateCreated: string;
  isGroup?: boolean;
}

// Kiểu cho tham số API
interface FetchParams {
  page: number;
  limit: number;
  status: string;
  userId?: string;
}
const HomeShipper = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<Shipment[]>([]);
  const [filteredData, setFilteredData] = useState<Shipment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED'>('WAITING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const userId = useShipperStore();
  const limit = 5;
  const [notification, setNotification] = useState({ message: '', visible: false });

  // Định nghĩa màu sắc cho status với key được gán kiểu rõ ràng
  const statusColors: { [key in 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED']: string } = {
    SUCCESS: '#6fb380',
    SHIPPING: '#76a9e3',
    WAITING: '#c77ba6',
    CANCELLED: '#b3796f',
  };
  const statusConfig = [
    { status: 'WAITING', icon: 'hourglass-empty', title: t('order.title2') },
    { status: 'SHIPPING', icon: 'local-shipping', title: t('order.title1') },
    { status: 'SUCCESS', icon: 'check-circle', title: t('anaContent.complete') },
    { status: 'CANCELLED', icon: 'cancel', title: t('order.title3') },
  ] as const;

  const fetchData = async (page: number, status: string = selectedStatus, type: string = 'shipment') => {
    setLoading(true);
    setError(null);

    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setError('Vui lòng đăng nhập lại.');
      setLoading(false);
      return { data: [], totalPage: 1 };
    }

    const baseUrl = type === 'shipment-group' ? '/shipment-group' : '/shipment';
    let url = `${baseUrl}/shipper/listShippment`;
    const params: FetchParams = { page, limit, status };

    if (status !== 'WAITING') {
      if (!userId || !userId.userId) {
        setError('Không thể xác định UserId.');
        setLoading(false);
        return { data: [], totalPage: 1 };
      }
      params.userId = String(userId.userId);
    } else {
      url = `${baseUrl}/view/listByStatus`;
    }

    try {
      console.log('Fetching data from API with params:', params);
      console.log('URL:', url);
      console.log('Token:', token);
      console.log('UserId:', userId);
      const response = await axiosInstance.get(url, {
        params,
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${token}`,
        },
      });

      const { listShipment, totalPage } = response.data;
      const shipmentsWithType: Shipment[] = (listShipment || []).map((shipment: Shipment) => ({
        ...shipment,
        isGroup: type === 'shipment-group',
      }));

      console.log('listShipment:', listShipment);
      console.log('shipmentsWithType:', shipmentsWithType);
      console.log('totalPage:', totalPage);

      setData(shipmentsWithType);
      setTotalPage(totalPage || 1);
      setCurrentPage(page);
      setLoading(false);

      return { data: shipmentsWithType, totalPage: totalPage || 1 };
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Không thể tải dữ liệu.');
      setLoading(false);
      return { data: [], totalPage: 1 };
    }
  };
  const fetchAllData = async (page: number, status: string = selectedStatus) => {
    setLoading(true);
    setError(null);

    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setError('Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    try {
      const shipmentResponse = await fetchData(page, status, 'shipment');
      const groupResponse = await fetchData(page, status, 'shipment-group');
      console.log('shipmentResponse:', shipmentResponse);
      console.log('groupResponse:', groupResponse);

      const combinedData = [
        ...(shipmentResponse.data || []),
        ...(groupResponse.data || []),
      ];
      console.log('combinedData:', combinedData);

      setData(combinedData);
      setTotalPage(Math.max(shipmentResponse.totalPage || 1, groupResponse.totalPage || 1));
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchAllData:', err);
      setError('Không thể tải dữ liệu.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(currentPage, selectedStatus);
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    setFilteredData(data.filter((item) => item.status === selectedStatus));
  }, [data, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchAllData(1, selectedStatus);
      }
    }, [userId, selectedStatus])
  );
  const handleStatusChange = (status: 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED') => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchData(1, status);
  };

  const handleMapDirection = (shipmentId: string, status: string, isGroup?: boolean) => {
    const id = Number(shipmentId);
    if (!isNaN(id)) {
      if (isGroup) {
        navigation.navigate('DirectionGroupScreen', {
          shipmentId: id,
          status: status,
        });
      } else {
        navigation.navigate('DirectionScreen', {
          shipmentId: id,
          status: status,
        });
      }
    }
  };

  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  const checkAvailabilityStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token || !userId?.userId) return;

      const response = await axiosInstance.get(
        `/shipper-attendance/get-status?userId=${userId.userId}`,
        {
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
          responseType: 'text', // 👈 Quan trọng: để nhận response dạng text
        }
      );

      const status = response.data?.trim(); // "available" hoặc "busy"
      setIsAvailable(status === 'available');
      console.log('Shipper status:', status);
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra trạng thái sẵn sàng:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  };

  useEffect(() => {
  checkAvailabilityStatus();
}, [selectedStatus]);



  const activateAvailable = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const payload = { id: userId.userId }; // ✅ ĐÚNG: chỉ gửi số userId

      const response = await axiosInstance.post(
        '/shipper-attendance/activate-available',
        payload,
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Kích hoạt thành công:', response.data);
      setIsAvailable(true);
      fetchAllData(1, selectedStatus);
    } catch (error: any) {
      console.error('Lỗi khi gọi activateAvailable:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

    }
  };




  const renderShipment = (shipment: Shipment) => {
    const color = statusColors[shipment.status as 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED'] || '#ddd';

    return (
      <TouchableOpacity
        key={shipment.shipmentId}
        onPress={() => {
          const shipmentId = Number(shipment.shipmentId); // Chuyển shipmentId thành số (number)
          if (!isNaN(shipmentId) && shipment.isGroup) {
            navigation.navigate('ShipmentGroupDetails', { shipmentId });
          } else if (!shipment.isGroup) {
            navigation.navigate('ShipmentDetails', { shipmentId });


          } else {
            console.error('Invalid shipmentId');
          }
        }}
        style={[styles.card, { borderColor: color }]}>
        <View style={[styles.headerBox, { backgroundColor: color, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={styles.headerText}>
            {t('order.orderCode')}: {shipment?.orderId || 'N/A'}
          </Text>
          {shipment?.isGroup && (
            <Text style={[styles.headerText, { color: '#e91e63', fontWeight: 'bold', marginLeft: 8 }]}>
              {t('grOrderTitle')}
            </Text>
          )}
        </View>

        <Text style={styles.shipmentText}>{t('order.customer')}: {shipment.customerName}</Text>
        <Text style={styles.shipmentText}>{t('address')}: {shipment.address}</Text>
        <Text style={styles.shipmentText}>{t('phone')}: {shipment.phoneNumber}</Text>
        <Text style={styles.shipmentText}>{t('shipmentStatus')}: {shipment.status}</Text>
        <Text style={styles.shipmentText}>{t('order.orderDate')}: {shipment.dateCreated}</Text>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            style={[styles.containedButton, { backgroundColor: color }]}
            textColor="#fff"
            labelStyle={{ fontFamily: FONTFAMILY.lobster_regular}}
            onPress={() => navigation.navigate('ChatWithUser', { shipmentId: Number(shipment?.shipmentId) })}
          >
            {t('chat.title')}
          </Button>
          <Button
            mode="outlined"
            style={[styles.outlinedButton, { borderColor: color }]}
            textColor={color}
            onPress={() => handleMapDirection(shipment.shipmentId, shipment.status, shipment.isGroup)}
          >
            {t('route')}
          </Button>
        </View>
      </TouchableOpacity>
    );
  };


  const currentStatusConfig = statusConfig.find(item => item.status === selectedStatus);
  return (
    <View>
      <Header
        style={{
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 10,
          marginBottom: 10,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        }}
      />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        <Notification message={notification.message} visible={notification.visible} onHide={() => setNotification({ ...notification, visible: false })} />
        {userId && <NotificationPopup userId={Number(userId.userId)} onPress={() => fetchData(1)} />}
        {/* Thanh icon */}
        <StatusBar
          selectedStatus={selectedStatus}
          onStatusChange={(newStatus) => {
            setSelectedStatus(newStatus);
            // Thực hiện fetch dữ liệu hoặc cập nhật trạng thái đơn hàng tương ứng
            fetchData(1, newStatus);
          }}
        />


        {/* Tiêu đề hiển thị theo trạng thái */}
        <Text style={styles.headerTitle}>
          {currentStatusConfig ? currentStatusConfig.title : ''}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFA983" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredData.length === 0 ? (
          !isAvailable ? (
            <TouchableOpacity onPress={activateAvailable}>
              <EmptyListAnimation title={t('active')} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>{t('dashboardContent.noOrder')}</Text>
          )
        ) : (
          filteredData.map(renderShipment)
        )}

        {/* Simple Pagination */}
        {filteredData.length > 0 && !loading && !error && (
          <View style={styles.pagination}>
            {totalPage > 6 ? (
              <>
                {/* Nút đầu tiên */}
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage === 1 && styles.activePage
                  ]}
                  onPress={() => setCurrentPage(1)}
                >
                  <Text>1</Text>
                </TouchableOpacity>

                {/* Dấu ... nếu cần */}
                {currentPage > 4 && <Text style={styles.dots}>...</Text>}

                {/* Các trang quanh currentPage */}
                {Array.from({ length: totalPage }, (_, i) => i + 1)
                  .filter(page =>
                    page !== 1 &&
                    page !== totalPage &&
                    (
                      (currentPage <= 4 && page <= 5) || // đầu danh sách
                      (currentPage >= totalPage - 3 && page >= totalPage - 4) || // cuối danh sách
                      (page >= currentPage - 1 && page <= currentPage + 1) // giữa danh sách
                    )
                  )

                  .map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[
                        styles.pageButton,
                        currentPage === page && styles.activePage
                      ]}
                      onPress={() => setCurrentPage(page)}
                    >
                      <Text>{page}</Text>
                    </TouchableOpacity>
                  ))}

                {/* Dấu ... nếu cần */}
                {currentPage < totalPage - 3 && <Text style={styles.dots}>...</Text>}

                {/* Nút cuối cùng */}
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage === totalPage && styles.activePage
                  ]}
                  onPress={() => setCurrentPage(totalPage)}
                >
                  <Text>{totalPage}</Text>
                </TouchableOpacity>
              </>
            ) : (
              Array.from({ length: totalPage }, (_, i) => i + 1).map(page => (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.pageButton,
                    currentPage === page && styles.activePage
                  ]}
                  onPress={() => setCurrentPage(page)}
                >
                  <Text>{page}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5f5', flexGrow: 1 },
  headerContainer: {
    paddingHorizontal: 5,
    paddingTop: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Dành cho Android
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  activeIconButton: {
    backgroundColor: '#FFA983',
  },
  icon: {
    color: '#000',
  },
  headerTitle: {
    marginTop: 10,
    fontSize: 22,
    fontFamily: FONTFAMILY.lobster_regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2, // Thêm viền thay vì màu nền toàn card
    backgroundColor: '#fff', // giữ trắng cho nội dung
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  headerBox: {
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
  },

  headerText: {
    color: '#fff',
    fontFamily: FONTFAMILY.lobster_regular,
    fontSize: 15,
    textAlign: 'center',
  },
  shipmentText: {
    fontFamily: FONTFAMILY.dongle_light,
    fontSize: 22,
    lineHeight: 26,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  containedButton: {
    marginRight: 10,
    borderRadius: 15,
  },

  outlinedButton: {
    borderWidth: 2,
    borderRadius: 15,
  },

  statusButton: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 20 },
  activeStatus: { backgroundColor: '#FFA983' },
  statusText: { fontWeight: 'bold' },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  pageButton: { padding: 10, margin: 5, backgroundColor: '#eee', borderRadius: 10 },
  activePage: { backgroundColor: '#FFA983' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
  dots: {
    paddingHorizontal: 5,
    fontSize: 18,
    alignSelf: 'center',
  },

});

export default HomeShipper;
