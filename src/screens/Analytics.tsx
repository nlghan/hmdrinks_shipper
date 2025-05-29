import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, Button, TouchableOpacity } from 'react-native';
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import Svg, { Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useShipperStore } from "../store/store";
import Header from "../components/Header";
import { useTranslation } from 'react-i18next';
import { COLORS, FONTFAMILY } from "../theme/theme";
import { Picker } from '@react-native-picker/picker';
import SelectBox from '../components/SelectBox';
import LinearGradient from 'react-native-linear-gradient';
import MonthYearPicker from '../components/MonthYearPicker';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ActivityIndicator } from 'react-native';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string;
}
type Month = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';

type MonthData = Record<Month, number | ((year: number) => number)>;

const monthData: Record<'VN' | 'EN', MonthData> = {
  VN: {
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
    '12': 31,
  },
  EN: {
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
    '12': 31,
  },
};


const radius = 85;
const innerRadius = 40;

const Analytics = ({ month = '04', year = 2025 }) => {
  const { t } = useTranslation();
  const [successfulShipments, setSuccessfulShipments] = useState<number[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<number[]>([]);
  const [percentages, setPercentages] = useState<number[]>([]);
  const { userId } = useShipperStore();
  const [combinedData, setCombinedData] = useState<{ label: string; orders: number; revenue: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Month>('04');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading1, setIsLoading1] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { language } = useShipperStore();
  const [selectedBarInfo, setSelectedBarInfo] = useState<{
    date: string;
    orders: number;
    revenue: number;
  } | null>(null);


  const statusList = [
    { label: t('ana.waiting'), colors: ['#FFE0B2', '#FFCC80'], percent: percentages[0], icon: '⏳' },
    { label: t('ana.shipping'), colors: ['#B3E5FC', '#81D4FA'], percent: percentages[1], icon: '🚚' },
    { label: t('ana.success'), colors: ['#C8E6C9', '#A5D6A7'], percent: percentages[2], icon: '✅' },
    { label: t('ana.cancel'), colors: ['#FFCDD2', '#EF9A9A'], percent: percentages[3], icon: '❌' },
  ];

  const total = statusList.reduce((sum, item) => sum + item.percent, 0);
  const centerX = radius + 10;
  const centerY = radius + 10;

  let angleOffset = 0;

  const chartData = statusList.map((item) => {
    const value = item.percent;
    const angle = (value / total) * 360;
    const midAngle = angleOffset + angle / 2;
    const rad = (midAngle * Math.PI) / 180;
    const labelX = centerX + (radius + 16) * Math.cos(rad);
    const labelY = centerY + (radius + 16) * Math.sin(rad);
    const lineX = centerX + radius * Math.cos(rad);
    const lineY = centerY + radius * Math.sin(rad);

    const result = {
      value, // ✅ Thêm dòng này để đúng với kiểu pieDataItem
      color: item.colors[1],
      midAngle,
      labelX,
      labelY,
      lineX,
      lineY,
      text: `${item.percent?.toFixed(1)}%`,
      label: item.label,
      colors: item.colors,
      percent: item.percent,
      icon: item.icon,
    };

    angleOffset += angle;
    return result;
  });


  useEffect(() => {
    fetchShipmentCounts();
    fetchShipments(selectedMonth, selectedYear, language);
  }, [selectedMonth, selectedYear]);

  const fetchShipmentCounts = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShipments = async (month: string, year: number, language: string) => {
    try {
      setIsLoading1(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const m = month as Month;
      console.log('Fetching shipments for:', { month, year, language, m });
      console.log('Month Data:', monthData[language][m]);

      const value = monthData[language][m];
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
      if (err instanceof Error) {
        console.log('Error in fetchShipments:', err.message);
        console.log('Stack:', err.stack);
      } else {
        console.log('Unknown error in fetchShipments:', err);
      }
    } finally {
      setIsLoading1(false);
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
    } catch (err) {
      if (err instanceof Error) {
        console.log(`Error with paymentId ${paymentId}:`, err.message);
        console.log('Stack:', err.stack);
      } else {
        console.log(`Unknown error with paymentId ${paymentId}:`, err);
      }
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

  const handleApply = (month: number, year: number) => {
    setSelectedMonth(month.toString().padStart(2, '0') as Month);
    setSelectedYear(year);
    setSelectedBarInfo(null);  // Đặt lại selectedBarInfo về null
    setShowModal(false);
  };

  const monthToEnglish = (month: any) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

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
      <ScrollView style={{ padding: 8, backgroundColor: '#f5f5f5f5' }} contentContainerStyle={{ paddingBottom: 135 }}>

        <View style={{ padding: 8, backgroundColor: 'white', borderRadius: 8, }} >
          <Text style={{ fontSize: moderateScale(23), fontWeight: '600', color: 'black', marginBottom: 8, fontFamily: FONTFAMILY.lobster_regular, textAlign: 'center' }}>
            {t('ana.revenueChart')}</Text>
          <View style={{ flex: 1, paddingBottom: 5 }}>
            {/* Button chọn tháng năm */}
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{
                backgroundColor: '#fff4ef',
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#fc9260', // Border xanh lá cây sáng
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
                marginBottom: 5,
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(16),
                  fontWeight: '600',
                  color: '#333',
                  fontFamily: FONTFAMILY.lobster_regular,
                }}
              >
                {selectedBarInfo
                  ? language === 'vi'
                    ? `📅 Ngày: ${selectedBarInfo.date}`
                    : `📅 Date: ${selectedBarInfo.date}`
                  : language === 'vi'
                    ? `📅 Tháng ${selectedMonth} - Năm ${selectedYear}`
                    : `📅 ${monthToEnglish(selectedMonth)} - ${selectedYear}`}
              </Text>

            </TouchableOpacity>

            {/* Modal chọn tháng năm */}
            <MonthYearPicker
              visible={showModal}
              onClose={() => setShowModal(false)}
              onApply={handleApply}
            />
          </View>
          {selectedBarInfo && (
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginBottom: 12,
              }}
            >
              {/* Ô 1: Ngày + Số đơn */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'white', // Màu nền nhẹ, dễ nhìn
                  padding: 16,
                  borderRadius: 12,
                  borderColor: '#fc9260', // Border xanh lá cây sáng
                  borderWidth: 1.5, // Độ rộng của border tăng lên
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3, // Tăng độ cao của shadow
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: moderateScale(16), color: '#388E3C', marginBottom: 4, fontFamily: FONTFAMILY.lobster_regular }}>
                  📦 {t('ana.orderNumber')}
                </Text>
                <Text style={{ fontSize: moderateScale(15), fontWeight: 'bold', color: 'black' }}>
                  {selectedBarInfo.orders} {t('ana.orders')}
                </Text>
              </View>

              {/* Ô 2: Doanh thu */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: 12,
                  borderColor: '#fc9260',
                  borderWidth: 1.5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                  alignItems: 'center', // Center theo chiều ngang
                  justifyContent: 'center', // Center theo chiều dọc
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(16),
                    color: '#388E3C',
                    marginBottom: 4,
                    fontFamily: FONTFAMILY.lobster_regular
                  }}
                >
                  💰 {t('ana.totalRevenue')}
                </Text>
                <Text
                  style={{
                    fontSize: moderateScale(15),
                    fontWeight: 'bold',
                    color: 'black',
                  }}
                >
                  {selectedBarInfo.revenue.toLocaleString()}₫
                </Text>
              </View>

            </View>
          )}
          {combinedData.length === 0 || combinedData.every(item => item.orders === 0) ? (
            <Text style={{ textAlign: 'center', marginTop: 24, fontSize: moderateScale(14), color: '#888' }}>
              {t('ana.noData')}
            </Text>
          ) : (
            <View style={{ padding: scale(16) }}>
              <View style={{ position: 'relative' }}>
                {isLoading ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: scale(20) }}>
                    <ActivityIndicator size="large" color="#f79539" />
                    <Text style={{ marginTop: 10, color: '#666' }}>{t('ana.loading')}</Text>
                  </View>
                ) : (
                  <>
                    {/* Biểu đồ cột & đường */}
                    <BarChart
                      data={combinedChartData.map(item => ({
                        value: item.revenue / 1000, // 🟩 Cột là doanh thu
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
                                  marginBottom: verticalScale(10),
                                }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {item.orders.toLocaleString()}
                              </Text>
                            </View>
                          ) : null,
                        lineData: {
                          value: item.ordersScaled, // 🔴 Line là số đơn (đã scale)
                        },
                        onPress: () => {
                          const selectedDate = `${item.label}/${selectedMonth}/${selectedYear}`;
                          setSelectedBarInfo({
                            date: selectedDate,
                            orders: item.orders,
                            revenue: item.revenue,
                          });
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
                      maxValue={adjustedMaxValue / 1000}
                      stepValue={stepValue / 1000}
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
                      yAxisLabelSuffix="K"
                    />
                  </>)}
              </View>

              {/* Chú thích biểu đồ */}
              <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <View style={{ width: scale(12), height: verticalScale(12), backgroundColor: '#4CAF50', marginRight: 4 }} />
                  <Text style={{ fontSize: moderateScale(13) }}>{t('ana.totalRevenueVND')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: scale(12), height: verticalScale(12), backgroundColor: '#f44336', marginRight: 4 }} />
                  <Text style={{ fontSize: moderateScale(13) }}>{t('ana.orderSuccess')}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{
          padding: 5,
          backgroundColor: '#fff',
          borderRadius: 16,
          marginTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0,
          shadowRadius: 2,
          elevation: 1,
        }}>

          <Text style={{ fontSize: moderateScale(23), fontWeight: '600', color: 'black', marginTop: 20, fontFamily: FONTFAMILY.lobster_regular, textAlign: 'center' }}>
            {t('ana.orderPer')}</Text>

          <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 12 }}>

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


            <View style={{ padding: scale(10), alignItems: 'center' }}>
              {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: scale(20) }}>
                  <ActivityIndicator size="large" color="#f79539" />
                  <Text style={{ marginTop: 10, color: '#666' }}>{t('ana.loading')}</Text>
                </View>
              ) : (
                <>
                  <PieChart
                    data={statusList
                      .map(item => ({
                        value: item.percent,
                        color: item.colors[1],
                        text: `${item.percent?.toFixed(1)}%`,
                      }))
                      .filter(item => item.value > 0)}
                    donut
                    radius={85}
                    innerRadius={20}
                    showText
                    showValuesAsLabels
                    labelsPosition="outward"
                    textColor="#333"
                    textSize={12}
                    strokeWidth={6}
                    strokeColor="#fff"
                    focusOnPress
                    centerLabelComponent={() => (
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#999' }}></Text>
                    )}
                  />
                </>
              )}
            </View>
          </View>


        </View>

      </ScrollView>
    </View>
  );
};

export default Analytics;
