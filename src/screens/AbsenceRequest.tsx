import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from "../utils/axiosInstance";
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format, isSameDay, differenceInDays, parseISO, subMonths, addMonths } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import Header from "../components/Header";

interface AbsenceRequest {
    requestId: number;
    reason: string;
    startDate: string;
    endDate: string;
    status: 'WAITING' | 'APPROVED' | 'REJECTED';
}
interface ApiErrorResponse {
    message: string;
}
interface ShipperAttendance {
    id: number;
    userId: number;
    attendanceDate: string; // yyyy-MM-dd
    isPresent: boolean | null;
    checkInTime: string | null; // yyyy-MM-dd HH:mm:ss
    note: string | null;
    status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'NONE';
    createdAt: string;
    updatedAt: string;
}

const AbsenceRequest = () => {
    const { t } = useTranslation();

    // Lấy userId từ token
    const getUserIdFromToken = (token: string) => {
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            return decodedPayload.UserId;
        } catch (error) {
            console.error('Cannot decode token:', error);
            return null;
        }
    };

    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem('access_token');
            setToken(storedToken);
        };
        fetchToken();
    }, []);

    const userIdStr = token ? getUserIdFromToken(token) : null;
    const userId = userIdStr === 'null' ? null : parseInt(userIdStr, 10);

    // State
    const [userInfo, setUserInfo] = useState<any>(null);
    const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
    const [attendanceData, setAttendanceData] = useState<ShipperAttendance[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [error1, setError1] = useState('');
    const [success1, setSuccess1] = useState('');
    const [workingDays, setWorkingDays] = useState<Date[]>([]);
    const [checkInNote, setCheckInNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Lấy thông tin người dùng
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!userId || !token) return;
            try {
                const response = await axiosInstance.get(`/user/info/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserInfo(response.data);
            } catch (err) {
                setError('Không thể lấy thông tin người dùng');
            }
        };
        fetchUserInfo();
    }, [userId, token]);

    // Lấy danh sách đơn nghỉ phép
    const fetchAbsenceRequests = async (month: number, year: number) => {
        if (!userId || !token) return;
        try {
            const startDate = format(subMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM-dd'); // Tháng trước
            const endDate = format(addMonths(new Date(year, month - 1, 1), 2), 'yyyy-MM-dd'); // Tháng sau
            let url = `/absence-request/view/all/${userId}?page=1&limit=50&startDate=${startDate}&endDate=${endDate}`;
            if (selectedStatus !== 'ALL') {
                url = `/absence-request/view/status/${userId}?status=${selectedStatus}&page=1&limit=50&startDate=${startDate}&endDate=${endDate}`;
            }
            const response = await axiosInstance.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAbsenceRequests(response.data.listAbsence || []);
        } catch (err) {
            setError('Không thể lấy danh sách đơn nghỉ phép');
        }
    };

    // Lấy dữ liệu điểm danh
    const fetchMonthlyAttendanceRange = async (userId: number, month: number, year: number) => {
        if (!userId) return;
        const requests = [];
        for (let offset = -1; offset <= 1; offset++) {
            const targetDate = new Date(year, month + offset, 1);
            const m = targetDate.getMonth() + 1;
            const y = targetDate.getFullYear();
            const request = axiosInstance.get('/shipper-attendance/attendance/full-month', {
                params: { userId, month: m, year: y },
                headers: { Authorization: `Bearer ${token}` },
            });
            requests.push(request);
        }
        try {
            const results = await Promise.all(requests);
            const mergedAttendance = results.flatMap((res) => res.data.shipperAttendanceList || []);
            setAttendanceData(mergedAttendance);
        } catch (error) {
            const err = error as AxiosError;
            setError(err.response?.data as string || 'Không thể lấy dữ liệu điểm danh');
        }
    };

    // Gọi API khi thay đổi tháng hoặc userId
    useEffect(() => {
        if (userId && token) {
            const month = currentDate.getMonth(); // 0-based
            const year = currentDate.getFullYear();
            fetchMonthlyAttendanceRange(userId, month, year);
            fetchAbsenceRequests(month + 1, year);
        }
    }, [userId, token, selectedStatus, currentDate]);

    // Check-in
    const handleCheckIn = async () => {
        if (!userId || !token) return;
        try {
            const response = await axiosInstance.post(
                '/shipper-attendance/checkin',
                { id: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data; // object kiểu CRUDShipperAttendance
            console.log('Check-in response:', data);
            if (data.status === 'LATE') {
                setSuccess1('Điểm danh trễ');
            } else {
                setSuccess1('Check-in thành công!');
            }

            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            fetchMonthlyAttendanceRange(userId, month, year);

        } catch (error) {
            const err = error as AxiosError;
            const message = err.response?.data as string;
            if (message === 'Đã điểm danh hôm nay') {
                setError1('Bạn đã điểm danh hôm nay');
            } else {
                setError1(message || 'Check-in thất bại');
            }
        }
    };


    // Cập nhật ghi chú
    const handleUpdateNote = async () => {
        if (!userId || !token) return;
        if (!checkInNote.trim()) {
            setError1('Ghi chú không được để trống');
            return;
        }
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const attendance = attendanceData.find((att) => att.attendanceDate === today);
            if (!attendance || attendance.id === 0) {
                setError1('Không tìm thấy bản ghi điểm danh hôm nay');
                return;
            }
            await axiosInstance.post(
                '/shipper-attendance/update-note',
                {
                    id: attendance.id,
                    note: checkInNote,
                    userId: userId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess1('Cập nhật ghi chú thành công!');
            setCheckInNote('');
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            fetchMonthlyAttendanceRange(userId, month, year);
        } catch (error) {
            const err = error as AxiosError;
            setError1(err.response?.data as string || 'Cập nhật ghi chú thất bại');
        }
    };

    // Xử lý chọn ngày
    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            setStartDate(selectedDate);
            if (endDate && isSameDay(selectedDate, endDate)) {
                setEndDate(null);
            }
        }
        setShowStartDatePicker(false);
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            setEndDate(selectedDate);
        }
        setShowEndDatePicker(false);
    };


    // Tùy chỉnh lịch
    const today = format(new Date(), 'yyyy-MM-dd');
    const markedDates = attendanceData.reduce((acc: any, att) => {
        acc[att.attendanceDate] = {
            customStyles: {
                container: {
                    backgroundColor:
                        att.status === 'ON_TIME' ? '#2ecc71' :
                            att.status === 'LATE' ? '#ffd970' :
                                att.status === 'ABSENT' ? '#e74c3c' :
                                    att.status === 'ON_LEAVE' ? '#9b59b6' :
                                        '#e6eaed',
                },
                text: { color: '#000', fontSize: 14 },
            },
        };
        return acc;
    }, {});

    absenceRequests.forEach((request) => {
        const start = parseISO(request.startDate);
        const end = parseISO(request.endDate);
        let currentDate = start;
        while (currentDate <= end) {
            const formattedDate = format(currentDate, 'yyyy-MM-dd');
            if (formattedDate !== today) {
                markedDates[formattedDate] = {
                    customStyles: {
                        container: {
                            backgroundColor:
                                request.status === 'WAITING' ? '#fff48454' :
                                    request.status === 'APPROVED' ? '#84beff54' :
                                        '#ff918454',
                        },
                        text: { color: '#000', fontSize: 14 },
                    },
                };
            }
            currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        }
    });

    if (markedDates[today]) {
        markedDates[today].marked = true;
        markedDates[today].dotColor = '#f39c12';
    } else {
        markedDates[today] = { marked: true, dotColor: '#f39c12' };
    }


    // Gửi yêu cầu nghỉ phép
    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!startDate || !endDate) {
            setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
            return;
        }

        if (differenceInDays(endDate, startDate) > 5) {
            setError('Không được chọn quá 5 ngày nghỉ liên tục.');
            return;
        }

        if (endDate < startDate) {
            setError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
            return;
        }

        if (!reason.trim()) {
            setError('Vui lòng nhập lý do nghỉ phép.');
            return;
        }

        const payload = {
            userId,
            reason,
            startDate: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
            endDate: format(endDate, 'yyyy-MM-dd HH:mm:ss'),
        };

        try {
            const response = await axiosInstance.post(
                '/absence-request/create-absence',
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSuccess('Yêu cầu nghỉ phép đã được gửi thành công!');
            setReason('');
            setStartDate(null);
            setEndDate(null);

            let url = `/absence-request/view/all/${userId}?page=1&limit=5`;
            if (selectedStatus !== 'ALL') {
                url = `/absence-request/view/status/${userId}?status=${selectedStatus}&page=1&limit=5`;
            }
            const updatedRequests = await axiosInstance.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAbsenceRequests(updatedRequests.data.listAbsence || []);
        } catch (err) {
            const error = err as AxiosError<ApiErrorResponse>;
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
        }
    };

    return (
        <View style={styles.container}>
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Lịch */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lịch tháng</Text>
                    <Calendar
                        markingType={'custom'}
                        markedDates={markedDates}
                        onMonthChange={(date) => setCurrentDate(new Date(date.dateString))}
                        theme={{
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#b6c1cd',
                            todayTextColor: '#f39c12',
                            dayTextColor: '#2d4150',
                            textDisabledColor: '#d9e1e8',
                            arrowColor: '#f39c12',
                            monthTextColor: '#000',
                            textMonthFontWeight: '600',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 14,
                        }}
                    />


                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                            <Text style={styles.legendText}>{t('absence.onTime')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#ffd970' }]} />
                            <Text style={styles.legendText}>{t('absence.late')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                            <Text style={styles.legendText}>{t('absence.absent')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#9b59b6' }]} />
                            <Text style={styles.legendText}>{t('absence.onLeave')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#fff48454' }]} />
                            <Text style={styles.legendText}>{t('absence.waiting')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#84beff54' }]} />
                            <Text style={styles.legendText}>{t('absence.approved')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#ff918454' }]} />
                            <Text style={styles.legendText}>{t('absence.rejected')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#e6eaed' }]} />
                            <Text style={styles.legendText}>{t('absence.notWorking')}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
      <Text style={styles.sectionTitleCheck}>{t('absence.checkIn')}</Text>
      <LinearGradient
        colors={['#1e88e5', '#42a5f5']}
        style={styles.checkInButton}
      >
        <TouchableOpacity onPress={handleCheckIn} style={styles.checkInButtonInner}>
          <Icon name="access-time" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonTextCheck}>{t('absence.checkIn')}</Text>
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.inputContainer}>
        <Icon name="edit" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.inputCheck}
          placeholder={t('absence.notePlaceholder')}
          placeholderTextColor="#999"
          value={checkInNote}
          onChangeText={setCheckInNote}
        />
      </View>
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateNote}>
        <Icon name="update" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonTextCheck}>{t('absence.updateNote')}</Text>
      </TouchableOpacity>
    </View>

                {/* Form xin nghỉ phép */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đơn xin nghỉ phép</Text>
                    {userInfo ? (
                        <View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userInfoText}>
                                    <Text style={styles.bold}>Họ tên:</Text> {userInfo.fullName}
                                </Text>
                                <Text style={styles.userInfoText}>
                                    <Text style={styles.bold}>Email:</Text> {userInfo.email}
                                </Text>
                                <Text style={styles.userInfoText}>
                                    <Text style={styles.bold}>Số điện thoại:</Text> {userInfo.phone}
                                </Text>
                            </View>
                            <View style={styles.datePickerContainer}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Ngày bắt đầu:</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowStartDatePicker(true)}
                                        style={styles.dateInput}
                                    >
                                        <Text>
                                            {startDate ? format(startDate, 'dd-MM-yyyy') : 'Chọn ngày'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showStartDatePicker && (
                                        <DateTimePicker
                                            value={startDate || new Date()}
                                            mode="date"
                                            display={Platform.OS === 'android' ? 'calendar' : 'default'}
                                            onChange={handleStartDateChange}
                                        />

                                    )}
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Ngày kết thúc:</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowEndDatePicker(true)}
                                        style={styles.dateInput}
                                    >
                                        <Text>
                                            {endDate ? format(endDate, 'dd-MM-yyyy') : 'Chọn ngày'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showEndDatePicker && (
                                        <DateTimePicker
                                            value={endDate || new Date()}
                                            mode="date"
                                            display="default"
                                            onChange={handleEndDateChange}
                                            minimumDate={startDate || undefined}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text>Đang tải thông tin người dùng...</Text>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Lý do nghỉ phép:</Text>
                        <TextInput
                            style={styles.textArea}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Nhập lý do nghỉ phép"
                            multiline
                        />
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {success ? <Text style={styles.success}>{success}</Text> : null}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                    </TouchableOpacity>
                </View>

                {/* Danh sách đơn nghỉ phép */}
                <View style={styles.section}>
                    <View style={styles.listHeader}>
                        <Text style={styles.sectionTitle}>Danh sách đơn nghỉ phép</Text>
                        <View style={styles.statusFilter}>
                            <Picker
                                selectedValue={selectedStatus}
                                onValueChange={(itemValue) => setSelectedStatus(itemValue)}
                                style={styles.select}
                            >
                                <Picker.Item label="Tất cả" value="ALL" />
                                <Picker.Item label="Đang chờ" value="WAITING" />
                                <Picker.Item label="Đã duyệt" value="APPROVED" />
                                <Picker.Item label="Bị từ chối" value="REJECTED" />
                            </Picker>
                        </View>
                    </View>
                    {absenceRequests.length > 0 ? (
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 0.5 }]}>STT</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Lý do</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Bắt đầu</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Kết thúc</Text>
                                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Trạng thái</Text>
                            </View>
                            {absenceRequests.map((request, index) => (
                                <View key={request.requestId} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                                    <Text style={styles.tableCell}>{request.reason}</Text>
                                    <Text style={styles.tableCell}>{format(new Date(request.startDate), 'dd-MM-yyyy')}</Text>
                                    <Text style={styles.tableCell}>{format(new Date(request.endDate), 'dd-MM-yyyy')}</Text>

                                    <Text
                                        style={[
                                            styles.tableCell,
                                            styles[`status-${request.status.toLowerCase()}` as keyof typeof styles],
                                        ]}
                                    >
                                        {request.status === 'WAITING'
                                            ? 'Đang chờ'
                                            : request.status === 'APPROVED'
                                                ? 'Đã duyệt'
                                                : 'Từ chối'}
                                    </Text>
                                </View>
                            ))}
                        </View>

                    ) : (
                        <Text>Chưa có đơn nghỉ phép nào.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionTitleCheck: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
      },
      checkInButton: {
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden', // Đảm bảo gradient không tràn ra ngoài
      },
      checkInButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
      },
      buttonIcon: {
        marginRight: 8,
      },
      buttonTextCheck: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        marginBottom: 16,
      },
      inputIcon: {
        marginLeft: 12,
      },
      inputCheck: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 16,
        color: '#333',
      },
      updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4caf50',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 10,
    },
    legendColor: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#ccc', // hoặc bất kỳ màu nào bạn muốn
    },

    legendText: {
        fontSize: 14,
        color: '#34495e',
    },
    userInfo: {
        marginBottom: 16,
    },
    userInfoText: {
        fontSize: 14,
        marginBottom: 4,
    },
    bold: {
        fontWeight: '600',
    },
    datePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    formGroup: {
        flex: 1,
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        justifyContent: 'center',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        height: 80,
        textAlignVertical: 'top',
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: 8,
    },
    success: {
        color: 'green',
        fontSize: 12,
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: '#FF5733',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusFilter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    select: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
    },
    table: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableHeader: {
        backgroundColor: '#f1f1f1',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#eee',
        paddingVertical: 8,
        paddingHorizontal: 2,
    },
    tableCell: {
        flex: 1,
        paddingHorizontal: 2,
        fontSize: 12,
        color: '#333',
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#000',
    },
    'status-waiting': {
        color: '#f39c12',
        fontWeight: 'bold',
    },
    'status-approved': {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    'status-rejected': {
        color: '#c0392b',
        fontWeight: 'bold',
    },
});

export default AbsenceRequest;