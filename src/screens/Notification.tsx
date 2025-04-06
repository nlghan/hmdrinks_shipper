import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import IconM from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { RouteProp, useRoute } from "@react-navigation/native";
import axiosInstance from "../utils/axiosInstance";
import UseWebSocket from '../utils/Socket';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/RootStackParamList";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Image } from "react-native";
import { FONTFAMILY } from "../theme/theme";



interface Notification {
  id: string;
  message: string;
  time: string;
  isRead: boolean;
  shipmentId: number;
}

type NotificationScreenRouteProp = RouteProp<RootStackParamList, "Notification">;

const NotificationScreen: React.FC = () => {
  const route = useRoute<NotificationScreenRouteProp>();
  const userId = route.params?.userId || 0;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const socketNotifications = UseWebSocket(userId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(true);
  const modalRef = useRef(null);
  const { t } = useTranslation()

  const fetchNotifications = async () => {
    if (!userId) return;
    const token = await AsyncStorage.getItem('access_token');
    try {
      const response = await axiosInstance.get(`/notifications/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      });
      const data: Notification[] = response.data.body?.notifications;
      setNotifications(data);
      setUnreadCount(data?.filter((noti) => !noti.isRead).length);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
    }
  };


  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      const newNotification =
        socketNotifications[socketNotifications.length - 1];
      if (
        newNotification &&
        typeof newNotification === "object" &&
        "message" in newNotification
      ) {
        fetchNotifications();
      } else {
        console.error("Dữ liệu thông báo không hợp lệ:", newNotification);
      }
    }
  }, [socketNotifications]);

  const handleNotificationClick = async (
    notificationId: string,
    shipmentId: number
  ) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axiosInstance.put(`/notifications/read/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      });
      fetchNotifications();
      navigation.navigate("ShipmentDetails", { shipmentId: Number(shipmentId) });
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo là đã đọc:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axiosInstance.put(`/notifications/read/all/${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo là đã đọc:", error);
    }
  };
  useEffect(() => {
    console.log("📢 Notifications đã cập nhật:", notifications);
  }, [notifications]);
  console.log("📌 showNotifications:", showNotifications);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.navigate('Main')}>
          <IconM name="arrow-back" size={20} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('common.noti')}</Text>
        <TouchableOpacity
        style={[styles.markAllButton, unreadCount === 0 && styles.markAllButton]}
        onPress={handleMarkAllAsRead}
        disabled={unreadCount === 0}
      >
        <IconM name="done-all" size={20} color="black" />
      </TouchableOpacity>
      </View>

      {/* Danh sách thông báo */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notificationItem, item.isRead && styles.read]}
            onPress={() => handleNotificationClick(item.id, item.shipmentId)}
          >
            <View style={styles.notificationContent}>
              <Image
                source={require("../assets/app_images/logomini.png")}
                style={styles.avatar}
              />

              <View style={styles.textContainer}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false} // Ẩn thanh cuộn dọc
        showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang (nếu có)
        ListEmptyComponent={<Text style={styles.emptyText}>{t('common.noNoti')}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA", // Màu nền sáng hiện đại
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 50,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backIcon: {
    position: "absolute",
    left: 5,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
   
  },
  headerTitle: {
    fontSize: 24,
    fontFamily:FONTFAMILY.lobster_regular,
    color: "#333",
  },
  markAllButton: {
    position: "absolute",
    right: 5,
    padding: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
   
  },
  markAllText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "white",
  },
  notificationItem: {
    padding: 15,
    backgroundColor: "#fdfcf0",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#FF9800",
  },
  read: {
    backgroundColor: "#fff",
    borderLeftColor: "#BDBDBD",
  },
  message: {
    fontSize: 24,
    fontFamily:FONTFAMILY.dongle_regular,
    lineHeight:22,
    color: "#424242",
  },
  time: {
    fontSize: 20,
    fontFamily:FONTFAMILY.dongle_light,
    color: "#757575",
    
  },
  emptyText: {
    textAlign: "center",
    fontSize: 26,
    color: "#9E9E9E",
    fontFamily:FONTFAMILY.dongle_regular,
  },
});

export default NotificationScreen;
