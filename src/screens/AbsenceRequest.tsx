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
                const response = await axiosInstance.get(`http://localhost:1010/api/user/info/${userId}`, {
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
                let url = `http://localhost:1010/api/absence-request/view/all/${userId}?page=1&limit=50`;
                if (selectedStatus !== 'ALL') {
                    url = `http://localhost:1010/api/absence-request/view/status/${userId}?status=${selectedStatus}&page=1&limit=5`;
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
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
            if (endDate && isSameDay(selectedDate, endDate)) {
                setEndDate(null);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    // Tùy chỉnh lịch
    const markedDates = workingDays.reduce((acc: any, date: Date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        acc[formattedDate] = { marked: true, dotColor: 'green' };
        return acc;
    }, {});

    absenceRequests.forEach((request) => {
        const start = parseISO(request.startDate);
        const end = parseISO(request.endDate);
        let currentDate = start;
        while (currentDate <= end) {
            const formattedDate = format(currentDate, 'yyyy-MM-dd');
            markedDates[formattedDate] = {
                marked: true,
                dotColor:
                    request.status === 'WAITING'
                        ? 'orange'
                        : request.status === 'APPROVED'
                            ? 'blue'
                            : 'red',
            };
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
                'http://localhost:1010/api/absence-request/create-absence',
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSuccess('Yêu cầu nghỉ phép đã được gửi thành công!');
            setReason('');
            setStartDate(null);
            setEndDate(null);

            let url = `http://localhost:1010/api/absence-request/view/all/${userId}?page=1&limit=5`;
            if (selectedStatus !== 'ALL') {
                url = `http://localhost:1010/api/absence-request/view/status/${userId}?status=${selectedStatus}&page=1&limit=5`;
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
                        markedDates={markedDates}
                        theme={{
                            todayTextColor: '#FF5733',
                            arrowColor: '#FF5733',
                        }}
                    />
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: 'green' }]} />
                            <Text>Ngày làm việc</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: 'orange' }]} />
                            <Text>Đang chờ duyệt</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: 'blue' }]} />
                            <Text>Đã duyệt</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
                            <Text>Bị từ chối</Text>
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
                                            {startDate ? format(startDate, 'yyyy-MM-dd') : 'Chọn ngày'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showStartDatePicker && (
                                        <DateTimePicker
                                            value={startDate || new Date()}
                                            mode="date"
                                            display="default"
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
                                            {endDate ? format(endDate, 'yyyy-MM-dd') : 'Chọn ngày'}
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
                            {absenceRequests.map((request) => (
                                <View key={request.requestId} style={styles.tableRow}>
                                    <Text style={styles.tableCell}>{request.requestId}</Text>
                                    <Text style={styles.tableCell}>{request.reason}</Text>
                                    <Text style={styles.tableCell}>{request.startDate}</Text>
                                    <Text style={styles.tableCell}>{request.endDate}</Text>
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
                                                : 'Bị từ chối'}
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
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 2,
        marginRight: 4,
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
        borderRadius: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ccc',
        padding: 8,
    },
    tableCell: {
        flex: 1,
        fontSize: 12,
        textAlign: 'center',
    },
    'status-waiting': {
        color: 'orange',
    },
    'status-approved': {
        color: 'green',
    },
    'status-rejected': {
        color: 'red',
    },
});

export default AbsenceRequest;