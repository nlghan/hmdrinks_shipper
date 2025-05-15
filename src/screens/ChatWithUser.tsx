import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axiosInstance from '../utils/axiosInstance';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useShipperStore } from "../store/store";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { useTranslation } from 'react-i18next';
import { FONTFAMILY } from '../theme/theme';

interface Message {
    senderId: number;
    receiverId: number;
    message: string;
    shipmentId: string;
    createdAt: number;
}

const ChatWithUser = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [customerId, setCustomerId] = useState<number>(0);
    const [nameShipper, setnameShipper] = useState('');
    const [customerName, setcustomerName] = useState('');
    const [status, setStatus] = useState('');
    const [senderIdUse, setSenderIdUse] = useState<number>(0);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const route = useRoute();
    const { shipmentId } = route.params as { shipmentId: string | number };
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { userId } = useShipperStore();
    const { t } = useTranslation();

    const flatListRef = useRef<FlatList<Message> | null>(null);


    interface NotificationWS {
        userId: number;
        shipmentId: number;
        message: string;
        time: string;
    }

    const [notifications, setNotifications] = useState<NotificationWS[]>([]);
    //     if (!userId || socketRef.current) return;
    //     console.log('🔗 Connecting WebSocket with userId:', userId);

    //     const connectWebSocket = async () => {
    //         try {
    //             if (socketRef.current) {
    //                 console.log('⚠️ Đóng kết nối cũ trước khi tạo mới');
    //                 socketRef.current.close();
    //                 socketRef.current = null;
    //             }
    //             const token = await AsyncStorage.getItem('access_token');
    //             if (!token) {
    //                 console.log('⚠️ Không tìm thấy token, hủy kết nối WebSocket.');
    //                 return;
    //             }

    //             console.log('🔑 Token được sử dụng:', token);

    //             const encodedToken = encodeURIComponent(token);  // Encode token để tránh lỗi URL
    //             const ws = new WebSocket(`ws://192.168.9.195:1010/ws-raw?token=${encodedToken}&userId=${userId}`);

    //             socketRef.current = ws;

    //             ws.onopen = () => {
    //                 console.log('✅ WebSocket connected!');
    //                 ws.send(JSON.stringify({ userId, token })); 
    //                 startHeartbeat(); // Bắt đầu gửi ping giữ kết nối
    //             };

    //             ws.onerror = (error) => {
    //                 console.log('❌ WebSocket error:', error);
    //             };

    //             ws.onclose = (event) => {
    //                 console.log(`⚠️ WebSocket disconnected! Code: ${event.code}, Reason: ${event.reason}`);
    //                 stopHeartbeat();
    //                 if (!event.wasClean) {
    //                     console.log('🔄 Đang thử kết nối lại sau 5 giây...');
    //                     // reconnectRef.current = setTimeout(connectWebSocket, 5000);
    //                 }
    //             };

    //             ws.onmessage = (event) => {
    //                 console.log('📩 Nhận được tin nhắn từ server:', event.data);
    //                 try {
    //                     const message = JSON.parse(event.data);
    //                     console.log('🚀 ~ WebSocket Message:', message);

    //                 if (message.type === "NEW_MESSAGE") {
    //                     setMessages((prev) => [...prev, message]);
    //                     console.log('📩 Tin nhắn mới mới:', message.message);
    //                 }
    //                 } catch (error) {
    //                     console.log('❌ Lỗi khi parse JSON:', error);
    //                 }
    //             };
    //         } catch (error) {
    //             console.log('🚨 Lỗi khi lấy token:', error);
    //         }
    //     };

    //     const startHeartbeat = () => {
    //         stopHeartbeat(); // Xóa timer cũ nếu có
    //         heartbeatRef.current = setInterval(() => {
    //             if (socketRef.current?.readyState === WebSocket.OPEN) {
    //                 socketRef.current.send(JSON.stringify({ type: 'PING' }));
    //             }
    //         }, 10000); // Gửi ping mỗi 10 giây
    //     };

    //     const stopHeartbeat = () => {
    //         if (heartbeatRef.current) {
    //             clearInterval(heartbeatRef.current);
    //             heartbeatRef.current = null;
    //         }
    //     };

    //     connectWebSocket();

    //     return () => {
    //         console.log('🔌 Đóng kết nối WebSocket...');
    //         stopHeartbeat();
    //         if (socketRef.current) {
    //             socketRef.current.close();
    //         }
    //         if (reconnectRef.current) {
    //             clearTimeout(reconnectRef.current);
    //             reconnectRef.current = null;
    //         }
    //     };
    // }, [userId]);

    // useEffect(() => {
    //     const connectWebSocket = async () => {
    //         if (socketRef.current) return;
    //         const token = await AsyncStorage.getItem('access_token');
    //         if (!token) {
    //             console.log('⚠️ Không tìm thấy token, hủy kết nối WebSocket.');
    //             return;
    //         }

    //         console.log('🔑 Token được sử dụng:', token);

    //         const encodedToken = encodeURIComponent(token);  // Encode token để tránh lỗi URL
    //         const ws = new WebSocket(`ws://192.168.9.195:1010/ws-raw?token=${encodedToken}&userId=${userId}`);

    //         socketRef.current = ws;

    //         ws.onopen = () => {
    //             console.log('✅ WebSocket connected!');
    //             ws.send(JSON.stringify({ userId, token })); 
    //             startHeartbeat(); // Bắt đầu gửi ping giữ kết nối
    //         };
    //         ws.onmessage = (event) => {
    //             console.log('📩 Tin nhắn event:', event);
    //             try {
    //                 const message = JSON.parse(event.data);
    //                 console.log('📩 Tin nhắn test:', message);
    //                 if (message.type === "NEW_MESSAGE" && message.shipmentId === shipmentId) {
    //                     setMessages((prev) => [...prev, message]);
    //                 }
    //             } catch (error) {
    //                 console.error('❌ Lỗi parse JSON:', error);
    //             }
    //         };
    //     };

    //     connectWebSocket();
    //     return () => socketRef.current?.close();
    // }, [shipmentId]);

    const startHeartbeat = () => {
        stopHeartbeat(); // Xóa timer cũ nếu có
        heartbeatRef.current = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'PING' }));
            }
        }, 10000); // Gửi ping mỗi 10 giây
    };
    const stopHeartbeat = () => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    };
    useEffect(() => {
        const fetchShipperId = async () => {
            try {
                const token = await AsyncStorage.getItem('access_token');
                if (!token) return;
                const response = await axiosInstance.get(`/shipment/view/${shipmentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCustomerId(response.data.customerId);
                setnameShipper(response.data.nameShipper);
                setcustomerName(response.data.customerName);
                setStatus(response.data.status);
    
                return response.data.customerId; // Trả về shipperId để sử dụng tiếp theo
            } catch (error) {
                console.log("❌ Lỗi lấy shipperId:", error);
                return null;
            }
        };
    
        const fetchMessages = async (shipperId : number) => {
            if (!shipperId) return;
            try {
                const response = await axiosInstance.get(`/chat/messages/shipment/${shipmentId}`);
                if (response.data.length === 0) {
                    // Nếu không có tin nhắn, gửi tin nhắn hệ thống tự động
                    const systemMessage = {
                        senderId: userId,
                        receiverId: customerId,
                        shipmentId,
                        message: "Đơn hàng của bạn đã được tiếp nhận, chúng tôi sẽ giao đơn cho bạn sớm nhất có thể!",
                        messageType: "text",
                        attachments: [],
                    };
    
                    console.log('📩 systemMessage:', systemMessage);
    
                    const sendResponse = await axiosInstance.post('/chat/send', systemMessage);
                    setMessages([sendResponse.data]);
                } else {
                    setMessages(response.data);
                }
            } catch (error) {
                console.log('❌ Lỗi khi tải tin nhắn:', error);
            }
        };
    
        const connectWebSocket = async () => {
            if (socketRef.current) return;
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;
            const ws = new WebSocket(`ws://192.168.9.196:1010/ws-raw?token=${encodeURIComponent(token)}&userId=${userId}`);
    
            socketRef.current = ws;
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.shipmentId === shipmentId) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                ...message,
                                createdAt: message.time || Date.now(), // Đổi `time` thành `createdAt`
                            }
                        ]);
                        setTimeout(scrollToBottom, 100);
                        console.log('📩 Tin nhắn mới:', message.message);
                    }
                } catch (error) {
                    console.error('❌ Lỗi parse JSON:', error);
                }
            };
        };
    
        const init = async () => {
            const shipperId = await fetchShipperId();
            await fetchMessages(shipperId);
            connectWebSocket();
        };
    
        init();
        return () => socketRef.current?.close();
    }, [shipmentId]);
    

    const sendMessage = async () => {
        if (!newMessage.trim() || !customerId) return;
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        const messageData = {
            senderId: userId,
            receiverId: customerId,
            shipmentId,
            message: newMessage,
            messageType: "text",
            attachments: [],
        };

        try {
            const response = await axiosInstance.post('/chat/send', messageData);
            setMessages((prev) => [...prev, response.data]);
            socketRef.current?.send(JSON.stringify(response.data));
            setNewMessage('');
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('❌ Lỗi gửi tin nhắn:', error);
        }
    };

    const scrollToBottom = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerText}>{t('chat.withUser')}</Text>
            </View>

            {/* Danh sách tin nhắn */}
            <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageContainer,
                            item.senderId.toString() === userId?.toString() ? styles.sent : styles.received,
                        ]}
                    >
                        <Text style={styles.senderName}>
                            {item.senderId.toString() === userId?.toString() ? `🚚 ${nameShipper}` : `🧑 ${customerName}`}
                        </Text>
                        <Text style={styles.messageText}>{item.message}</Text>
                        <Text style={styles.timestamp}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}

            />

            {/* Input tin nhắn */}
            <View style={styles.inputContainer}>
                {status !== "SHIPPING" ? (
                    <Text style={styles.lockedMessage}>
                        {t('chat.disable')}
                    </Text>
                ) : (
                    <TextInput
                        style={[styles.input, status !== "SHIPPING" && styles.disabledInput]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder={t('chat.input')}
                        placeholderTextColor="#888"
                        editable={status === "SHIPPING"}
                    />
                )}
                <TouchableOpacity
                    style={[styles.sendButton, status !== "SHIPPING" && styles.disabledButton]}
                    onPress={sendMessage}
                    disabled={status !== "SHIPPING" || !customerId}
                >
                    <Icon name="send" size={24} color="white" />
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF9F0' },
    header: {
        flexDirection: "row",
        alignItems: "center",
        alignContent: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: "#f8a192",
        elevation: 5,
    },
    backIcon: {
        position: "absolute",
        top: 16,
        left: 10,
    },
    headerText: {
        fontSize: 24,
        fontFamily: FONTFAMILY.lobster_regular,
        textAlign: 'center',
        color: '#333',
    },
    messageContainer: {
        padding: 10,
        borderRadius: 15,
        marginVertical: 5,
        maxWidth: "80%",
    },
    sent: {
        alignSelf: 'flex-end',
        backgroundColor: '#f8a192',
        marginRight: 10,
        padding: 12,
        color:'white'
    },
    received: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: "#f8a192",
        marginLeft: 10,
        padding: 12,
    },
    senderName: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 3,
    },
    messageText: {
        fontSize: 16,
        color: "#333",
        marginBottom: 2,
    },
    timestamp: {
        fontSize: 12, // Nhỏ hơn nội dung tin nhắn
        color: "#777", // Màu nhẹ hơn để không nổi bật quá
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ff6347',
        borderRadius: 25,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: 'white',
    },
    sendButton: {
        backgroundColor: '#ff6347',
        padding: 12,
        borderRadius: 25,
        marginLeft: 10,
    },
    disabledInput: {
        backgroundColor: '#E0E0E0',
        borderColor: '#BDBDBD',
        color: '#9E9E9E',
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
    },
    lockedMessage: {
        flex: 1,
        textAlign: "center",
        fontSize: 14,
        color: "#9E9E9E",
        paddingVertical: 10,
    },
});

export default ChatWithUser;
