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
import LinearGradient from 'react-native-linear-gradient';


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
  const [selectedMonth, setSelectedMonth] = useState<Month>('12');
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  const statusList = [
    { label: 'Chờ xử lý', colors: ['#FFA726', '#FB8C00'], percent: percentages[0] },
    { label: 'Đang giao', colors: ['#42A5F5', '#1E88E5'], percent: percentages[1] },
    { label: 'Thành công', colors: ['#66BB6A', '#388E3C'], percent: percentages[2] },
    { label: 'Hủy', colors: ['#EF5350', '#C62828'], percent: percentages[3] },
  ];


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
          const dateRaw = shipment.dateCreated;
          const date = new Date(dateRaw);
          console.log(`Raw: ${dateRaw} | Parsed: ${date.toISOString()}`);

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

  const chartWidth = Dimensions.get('window').width - 16;

  // Lấy max và min của đơn hàng và doanh thu
  const maxOrders = Math.max(...combinedData.map(item => item.orders));
  const maxRevenue = Math.max(...combinedData.map(item => item.revenue));
  const minRevenue = Math.min(...combinedData.map(item => item.revenue));  // Tính toán minValue từ dữ liệu

  // Tính toán bước tự động cho trục Y
  const noOfSections = 5;  // Số sections trên trục Y
  const range = maxRevenue - minRevenue;  // Phạm vi giữa giá trị lớn nhất và nhỏ nhất
  let stepValue = Math.ceil(range / noOfSections);

  // Đảm bảo stepValue là bội số của 50,000 và không mất số 0
  if (stepValue % 50000 !== 0) {
    stepValue = Math.ceil(stepValue / 50000) * 50000;  // Làm tròn stepValue về bội số của 50,000
  }

  // Đảm bảo stepValue không quá nhỏ so với dữ liệu, có thể thay đổi tùy theo yêu cầu
  if (stepValue < 50000) {
    stepValue = 50000;  // Đảm bảo rằng stepValue không nhỏ hơn 50,000
  }

  const adjustedMaxValue = Math.ceil(maxRevenue / stepValue) * stepValue + stepValue;


  console.log(stepValue);  // In ra giá trị của stepValue để kiểm tra

  // Tính toán ordersScaled cho từng item trong dữ liệu
  const combinedChartData = combinedData.map(item => ({
    ...item,
    ordersScaled: maxOrders > 0 ? (item.orders / maxOrders) * maxRevenue : 0,  // Scale orders để match với revenue
  }));




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
            onSelect={(value) => setSelectedYear(parseInt(value))}
          />
        </View>
        {combinedData.length === 0 || combinedData.every(item => item.orders === 0) ? (
          <Text style={{ textAlign: 'center', marginTop: 24, fontSize: 16, color: '#888' }}>
            Tháng này không có đơn hàng thành công
          </Text>
        ) : (
          <View style={{ padding: 20 }}>
            <View style={{ position: 'relative' }}>
              {/* Biểu đồ cột & đường */}
              <BarChart
                data={combinedChartData.map(item => ({
                  value: item.revenue, // 🟩 Cột là doanh thu
                  label: item.label,
                  frontColor: '#4CAF50',
                  topLabelComponent: () =>
                    item.orders > 0 ? (
                      < View style={{ width: 60, alignItems: 'center', position: 'absolute', bottom: 5 }}>
                        <Text
                          style={{
                            fontSize: 9,
                            color: '#333',
                            textAlign: 'center',
                            flexWrap: 'wrap',
                            marginBottom: 11,
                          }}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.orders.toLocaleString()} đơn
                        </Text>
                      </View>
                    ) : null,
                  lineData: {
                    value: item.ordersScaled, // 🔴 Line là số đơn (đã scale)
                  },
                }))}
                barWidth={30}
                initialSpacing={8}
                spacing={15}
                barBorderRadius={6}
                showGradient
                yAxisThickness={1}
                xAxisType="dashed"
                xAxisColor="lightgray"
                yAxisTextStyle={{ color: 'gray', fontSize: 11, marginLeft: -20 }}
                xAxisLabelTextStyle={{ color: 'gray', textAlign: 'center' }}
                maxValue={adjustedMaxValue}
                stepValue={stepValue}
                noOfSections={noOfSections}
                labelWidth={20}
                showLine
                lineConfig={{
                  color: '#f44336',
                  thickness: 2,
                  curved: true,
                  hideDataPoints: false,
                  dataPointsColor: '#f44336',
                  shiftY: 9,
                  initialSpacing: 8,
                  isAnimated: true,
                }}
                yAxisLabelSuffix="₫"
              />

            </View>

            {/* Chú thích biểu đồ */}
            <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50', marginRight: 4 }} />
                <Text style={{ fontSize: 13 }}>Doanh thu (VNĐ)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#f44336', marginRight: 4 }} />
                <Text style={{ fontSize: 13 }}>Số đơn thành công</Text>
              </View>
            </View>
          </View>
        )}


        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Phần trăm trạng thái đơn hàng</Text>

        <View style={{ flexDirection: 'row', paddingHorizontal: 13, paddingVertical: 16 }}>
          {/* Legend */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {statusList.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <LinearGradient
                  colors={item.colors}
                  style={{ width: 16, height: 16, borderRadius: 4, marginRight: 10 }}
                />
                <Text style={{ fontSize: 14, color: '#333' }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Pie Chart */}
          <View style={{ padding: 10, alignItems: 'center' }}>
            <PieChart
              data={statusList
                .map(item => ({
                  value: item.percent,
                  color: item.colors[0], // lấy màu đầu tiên làm đại diện
                  text: `${item.percent?.toFixed(1)}%`,
                }))
                .filter(item => item.value > 0)}
              donut
              focusOnPress
              radius={85}
              innerRadius={10}
              showText
              showValuesAsLabels
              labelsPosition="mid"
              textColor="#000"
              textSize={12}
              strokeWidth={3}
              strokeColor="#fff"
              centerLabelComponent={() => (
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}></Text>
              )}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default Analytics;
