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
import { format, isSameDay, differenceInDays, parseISO } from 'date-fns';
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
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [workingDays, setWorkingDays] = useState<Date[]>([]);
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
    useEffect(() => {
        const fetchAbsenceRequests = async () => {
            if (!userId || !token) return;
            try {
                let url = `/absence-request/view/all/${userId}?page=1&limit=50`;
                if (selectedStatus !== 'ALL') {
                    url = `/absence-request/view/status/${userId}?status=${selectedStatus}&page=1&limit=5`;
                }
                const response = await axiosInstance.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAbsenceRequests(response.data.listAbsence || []);
            } catch (err) {
                setError('Không thể lấy danh sách đơn nghỉ phép');
            }
        };
        fetchAbsenceRequests();
    }, [userId, token, selectedStatus]);

    // Giả lập ngày làm việc
    useEffect(() => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const days: Date[] = [];
        for (let d = startOfYear; d <= today; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        setWorkingDays(days);
    }, []);

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
    // Xác định ngày hôm nay
    const today = format(new Date(), 'yyyy-MM-dd');

    // Tạo custom style cho ngày
    const getCustomStyle = (color: string) => ({
        container: {
            backgroundColor: color,
            borderRadius: 20,
        },
        text: {
            color: '#000',
            fontSize: 14
        },
    });

    const markedDates = workingDays.reduce((acc: any, date: Date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');

        // Nếu là hôm nay -> dùng dot
        if (formattedDate === today) {
            acc[formattedDate] = {
                marked: true,
                dotColor: '#f39c12',
            };
        } else {
            acc[formattedDate] = {
                customStyles: getCustomStyle('#72f2be54'), // ngày làm việc
            };
        }

        return acc;
    }, {});

    // Thêm ngày nghỉ phép
    absenceRequests.forEach((request) => {
        const start = parseISO(request.startDate);
        const end = parseISO(request.endDate);
        let currentDate = start;
        while (currentDate <= end) {
            const formattedDate = format(currentDate, 'yyyy-MM-dd');

            // Tránh ghi đè dot của hôm nay
            if (formattedDate !== today) {
                const bgColor =
                    request.status === 'WAITING'
                        ? '#fff48454'
                        : request.status === 'APPROVED'
                            ? '#84beff54'
                            : '#ff918454';

                markedDates[formattedDate] = {
                    customStyles: getCustomStyle(bgColor),
                };
            }

            currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        }
    });

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
                            <View style={[styles.legendColor, { backgroundColor: '#72f2be54' }]} />
                            <Text style={styles.legendText}>Ngày làm việc   </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#fff48454' }]} />
                            <Text style={styles.legendText}>Đang chờ duyệt</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#84beff54' }]} />
                            <Text style={styles.legendText}>Ngày nghỉ phép</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#ff918454' }]} />
                            <Text style={styles.legendText}>Bị từ chối</Text>
                        </View>
                    </View>
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