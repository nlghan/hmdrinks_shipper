import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useNavigation } from '@react-navigation/native';
import { useShipperStore } from "../store/store";
import Header from "../components/Header";
import { useTranslation } from 'react-i18next';
import { COLORS, FONTFAMILY } from "../theme/theme";
import { Picker } from '@react-native-picker/picker';
import SelectBox from '../components/SelectBox';


type Month = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';

type MonthData = Record<Month, number | ((year: number) => number)>;

const monthData: Record<'vi', MonthData> = {
  vi: {
    '01': 31,
    '02': (year: number) => (year % 4 === 0 ? 29 : 28),
    '03': 31,
    '04': 30,
    '05': 31,
    '06': 30,
    '07': 31,
    '08': 31,
    '09': 30,
    '10': 31,
    '11': 30,
    '12': 31
  }
};


const Analytics = ({ month = '04', year = 2025, language = 'vi' }) => {
  const [successfulShipments, setSuccessfulShipments] = useState<number[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<number[]>([]);
  const [percentages, setPercentages] = useState<number[]>([]);
  const { userId } = useShipperStore();
  const [combinedData, setCombinedData] = useState<{ label: string; orders: number; revenue: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Month>('04');
  const [selectedYear, setSelectedYear] = useState<number>(2025);


  useEffect(() => {
    fetchShipmentCounts();
    fetchShipments(selectedMonth, selectedYear, language);
  }, [selectedMonth, selectedYear]);

  const fetchShipmentCounts = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      console.log('Token testtttt', token);
      if (!token) return;
      const statuses = ['WAITING', 'SHIPPING', 'SUCCESS', 'CANCELLED'];

      const counts = await Promise.all(statuses.map(async status => {
        try {
          const res = await axiosInstance.get(`/shipment/shipper/listShippment`, {
            params: { page: 1, limit: 100, status, userId },
            headers: { Authorization: `Bearer ${token}` },
          });
          return res.data.total || 0;
        } catch {
          return 0;
        }
      }));

      const total = counts.reduce((a, b) => a + b, 0);
      const percentArray = counts.map(count => (total > 0 ? (count / total) * 100 : 0));
      setPercentages(percentArray);
      console.log('Counts:', typeof counts);
      console.log('Percentages:', percentArray);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShipments = async (month: string, year: number, language: string) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const lang = language as 'vi';
      const m = month as Month;

      const value = monthData[lang][m];
      const daysInMonth = typeof value === 'function' ? value(year) : value;

      const shipmentCounts = Array(daysInMonth).fill(0);
      const paymentTotals = Array(daysInMonth).fill(0);
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const res = await axiosInstance.get(`/shipment/shipper/listShippment`, {
          params: { page: currentPage, limit: 100, status: 'SUCCESS', userId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const shipments = res.data.listShipment || [];
        totalPages = res.data.totalPages || 1;

        for (const shipment of shipments) {
          const date = new Date(shipment.dateCreated);
          if (date.getFullYear() === year && date.getMonth() + 1 === parseInt(month)) {
            const day = date.getDate() - 1;
            shipmentCounts[day] += 1;
            if (shipment.paymentId) {
              await fetchPaymentDetails(shipment.paymentId, day, paymentTotals, token);
            }
          }
        }

        currentPage++;
      }

      setSuccessfulShipments(shipmentCounts);
      setPaymentAmounts(paymentTotals);
      const combinedChartData = shipmentCounts.map((count, index) => ({
        label: `${index + 1}`,
        orders: count,
        revenue: paymentTotals[index],
      }));
      setCombinedData(combinedChartData);
      console.log('Combined Chart Data:', combinedChartData);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentDetails = async (paymentId: string, dayIndex: number, paymentAmounts: number[], token: string) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await axiosInstance.get(`/payment/view/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 && res.data.amount) {
        paymentAmounts[dayIndex] += res.data.amount;
      }
      console.log(`Payment ID ${paymentId}:`, res.data.amount);
    } catch (error) {
      console.error(`Lỗi với paymentId ${paymentId}:`, error);
    }
  };

  const chartWidth = Dimensions.get('window').width - 32;
  const maxOrders = Math.max(...combinedData.map(item => item.orders));
  const maxRevenue = Math.max(...combinedData.map(item => item.revenue));
  const normalizedRevenue = combinedData.map(item => ({
    ...item,
    revenueScaled: item.revenue / 60000 // chia theo max để về cùng thang
  }));
  const maxCombined = Math.max(maxOrders, ...normalizedRevenue.map(i => i.revenueScaled));
  const roundedMax = Math.ceil(maxCombined);

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
      <ScrollView style={{ padding: 16, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 135 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Biểu đồ đơn hàng thành công & doanh thu</Text>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <SelectBox
            label="Chọn tháng"
            value={`Tháng ${selectedMonth}`}
            options={Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))}
            onSelect={(value) => setSelectedMonth(value as Month)}

          />
          <View style={{ width: 8 }} />
          <SelectBox
            label="Chọn năm"
            value={`Năm ${selectedYear}`}
            options={Array.from({ length: 6 }, (_, i) => (2023 + i).toString())}
            onSelect={(value) => setSelectedYear(value as unknown as number)}
          />
        </View>
        {combinedData.length === 0 || combinedData.every(item => item.orders === 0) ? (
          <Text style={{ textAlign: 'center', marginTop: 24, fontSize: 16, color: '#888' }}>
            Tháng này không có đơn hàng thành công
          </Text>
        ) : (
          <>

            <BarChart
              barWidth={20}
              spacing={8}
              height={250}
              width={chartWidth}
              yAxisThickness={1}
              xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
              noOfSections={roundedMax}  // 👈 Số đoạn chia trục Y
              maxValue={roundedMax}      // 👈 Đảm bảo các giá trị không vượt quá trục
              stepValue={1}              // 👈 Hiển thị trục Y theo bước 1: 0,1,2,...
              data={combinedData.map(item => ({
                value: item.orders,
                label: item.label,
              }))}
              lineData={normalizedRevenue.map(item => ({
                value: item.revenueScaled,
              }))}
              frontColor="#4CAF50"
              lineConfig={{
                color: "#f44336",
                thickness: 2,
                curved: true,
                hideDataPoints: false,
                dataPointsColor: '#f44336',
                isAnimated: true,
                animationDuration: 1000,
              }}
              yAxisTextStyle={{ color: '#444' }}
              yAxisLabelSuffix=" ĐH"
            />
            <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50', marginRight: 4 }} />
                <Text>Đơn hàng thành công</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#f44336', marginRight: 4 }} />
                <Text>Doanh thu (VNĐ)</Text>
              </View>
            </View>

          </>
        )}

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Phần trăm trạng thái đơn hàng</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 13 }}>
          {/* Chú thích bên trái */}
          <View style={{ flex: 1 }}>
            {[
              { color: '#FF9800', label: 'Chờ xử lý' },
              { color: '#2196F3', label: 'Đang giao' },
              { color: '#4CAF50', label: 'Thành công' },
              { color: '#F44336', label: 'Hủy' },
            ].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: item.color,
                    marginRight: 8,
                    borderRadius: 3,
                  }}
                />
                <Text style={{ fontSize: 14 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Pie Chart bên phải */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <PieChart
              data={[
                { value: percentages[0], color: '#FF9800', text: 'Chờ xử lý' },
                { value: percentages[1], color: '#2196F3', text: 'Đang giao' },
                { value: percentages[2], color: '#4CAF50', text: 'Thành công' },
                { value: percentages[3], color: '#F44336', text: 'Hủy' },
              ]}
              donut
              focusOnPress
              radius={80}
              textColor="black"
              textSize={14}
              strokeWidth={2}
              strokeColor="#fff"
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default Analytics;
