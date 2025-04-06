import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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

// Định nghĩa interface cho Shipment
interface Shipment {
  shipmentId: string;
  orderId?: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  status: 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED' | string;
  dateCreated: string;
  // Thêm các thuộc tính khác nếu cần
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
  const [selectedStatus, setSelectedStatus] = useState<'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED'>('SHIPPING');
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
    { status: 'WAITING', icon: 'hourglass-empty', title: 'Đơn hàng chờ giao' },
    { status: 'SHIPPING', icon: 'local-shipping', title: 'Đơn hàng được phân công' },
    { status: 'SUCCESS', icon: 'check-circle', title: 'Đơn hàng thành công' },
    { status: 'CANCELLED', icon: 'cancel', title: 'Đơn hàng đã hủy' },
  ] as const;

  const fetchData = async (page: number, status: string = selectedStatus) => {
    setLoading(true);
    setError(null);

    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setError("Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    let url = `/shipment/shipper/listShippment`;
    const params: FetchParams = { page, limit, status };

    if (status !== 'WAITING') {
      if (!userId || !userId.userId) {
        setError('Không thể xác định UserId.');
        setLoading(false);
        return;
      }
      params.userId = String(userId.userId);
    } else {
      url = `/shipment/view/listByStatus`;
    }

    try {
      console.log("Fetching data from API with params:", params);
      console.log("URL:", url);
      console.log("Token:", token);
      console.log("UserId:", userId);
      const response = await axiosInstance.get(url, {
        params,
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${token}`,
        },
      });
      const { listShipment, totalPage } = response.data;
      setData(listShipment || []);
      setTotalPage(totalPage || 1);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải dữ liệu.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setFilteredData(data.filter((item) => item.status === selectedStatus));
  }, [data, selectedStatus]);

  const handleStatusChange = (status: 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED') => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchData(1, status);
  };

  const handleMapDirection = (shipmentId: string, address: string) => {
    // navigation.navigate('MapScreen', { shipmentId, address });
  };

  const renderShipment = (shipment: Shipment) => {
    const color = statusColors[shipment.status as 'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED'] || '#ddd';

    return (
      <TouchableOpacity
        key={shipment.shipmentId}
        onPress={() => {
          const shipmentId = Number(shipment.shipmentId); // Chuyển shipmentId thành số (number)
          if (!isNaN(shipmentId)) {
            navigation.navigate('ShipmentDetails', { shipmentId });
          } else {
            console.error('Invalid shipmentId');
          }
        }}
        style={[styles.card, { borderColor: color }]}>
        <View style={[styles.headerBox, { backgroundColor: color }]}>
          <Text style={styles.headerText}>
            {t('order.orderCode')}: {shipment?.orderId || "N/A"}
          </Text>
        </View>

        <Text>{t('order.customer')}: {shipment.customerName}</Text>
        <Text>{t('address')}: {shipment.address}</Text>
        <Text>{t('phone')}: {shipment.phoneNumber}</Text>
        <Text>{t('shipmentStatus')}: {shipment.status}</Text>
        <Text>{t('order.receiveDate')}: {shipment.dateCreated}</Text>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            style={[styles.containedButton, { backgroundColor: color }]}
            textColor="#fff"
            onPress={() => navigation.navigate('ChatWithUser', { shipmentId: Number(shipment?.shipmentId) })}
          >
            {t('chat.title')}
          </Button>
          <Button
            mode="outlined"
            style={[styles.outlinedButton, { borderColor: color }]}
            textColor={color}
            onPress={() => handleMapDirection(shipment.shipmentId, shipment.address)}
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
      <Header style={styles.headerContainer} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
      <Notification message={notification.message} visible={notification.visible} onHide={() => setNotification({ ...notification, visible: false })} />
      <NotificationPopup userId={Number(userId) ?? 0} />
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
          <Text style={styles.emptyText}>{t('dashboardContent.noOrder')}</Text>
        ) : (
          filteredData.map(renderShipment)
        )}

        {/* Simple Pagination */}
        {filteredData.length > 0 && !loading && !error && (
          <View style={styles.pagination}>
            {[...Array(totalPage)].map((_, index) => (
              <TouchableOpacity
                key={index + 1}
                style={[
                  styles.pageButton,
                  currentPage === index + 1 && styles.activePage
                ]}
                onPress={() => setCurrentPage(index + 1)}
              >
                <Text>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
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
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  pageButton: { padding: 10, margin: 5, backgroundColor: '#eee', borderRadius: 10 },
  activePage: { backgroundColor: '#FFA983' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
});

export default HomeShipper;
