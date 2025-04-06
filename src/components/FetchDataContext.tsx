import React, { createContext, useState, useContext, ReactNode } from 'react';
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
interface FetchDataContextType {
    fetchData: (page: number, status?: string) => void;
    setFetchData: React.Dispatch<React.SetStateAction<any>>; // Nếu cần thay đổi dữ liệu
}
interface FetchParams {
    page: number;
    limit: number;
    status: string;
    userId?: string;
}
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
const FetchDataContext = createContext<FetchDataContextType | undefined>(undefined);

export const FetchDataProvider = ({ children }: { children: ReactNode }) => {
    const [fetchDataState, setFetchData] = useState<any>(null);
    const [data, setData] = useState<Shipment[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<'SUCCESS' | 'SHIPPING' | 'WAITING' | 'CANCELLED'>('SHIPPING');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPage, setTotalPage] = useState<number>(1);
    const userId = useShipperStore();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { t } = useTranslation();
    const limit = 5;

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

    return (
        <FetchDataContext.Provider value={{ fetchData, setFetchData }}>
            {children}
        </FetchDataContext.Provider>
    );
};

export const useFetchData = () => {
    const context = useContext(FetchDataContext);
    if (!context) {
        throw new Error("useFetchData must be used within a FetchDataProvider");
    }
    return context;
};
