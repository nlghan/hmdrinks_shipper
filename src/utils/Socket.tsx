import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWebSocket = (userId: number) => {
    interface NotificationWS {
        userId: number;
        shipmentId: number;
        message: string;
        time: string;
    }

    const [notifications, setNotifications] = useState<NotificationWS[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!userId || socketRef.current) return;
        console.log('🔗 Connecting WebSocket with userId:', userId);

        const connectWebSocket = async () => {
            try {
                if (socketRef.current) {
                    console.log('⚠️ Đóng kết nối cũ trước khi tạo mới');
                    socketRef.current.close();
                    socketRef.current = null;
                }
                const token = await AsyncStorage.getItem('access_token');
                if (!token) {
                    console.log('⚠️ Không tìm thấy token, hủy kết nối WebSocket.');
                    return;
                }

                console.log('🔑 Token được sử dụng:', token);

                const encodedToken = encodeURIComponent(token);  // Encode token để tránh lỗi URL
                const ws = new WebSocket(`ws://192.168.9.195:1010/ws-raw?token=${encodedToken}&userId=${userId}`);

                socketRef.current = ws;

                ws.onopen = () => {
                    console.log('✅ WebSocket connected!');
                    ws.send(JSON.stringify({ userId, token }));
                    startHeartbeat(); // Bắt đầu gửi ping giữ kết nối
                };

                ws.onerror = (error) => {
                    console.log('❌ WebSocket error:', error);
                };

                ws.onclose = (event) => {
                    console.log(`⚠️ WebSocket disconnected! Code: ${event.code}, Reason: ${event.reason}`);
                    stopHeartbeat();
                    if (!event.wasClean) {
                        console.log('🔄 Đang thử kết nối lại sau 5 giây...');
                        // reconnectRef.current = setTimeout(connectWebSocket, 5000);
                    }
                };

                ws.onmessage = (event) => {
                    console.log('📩 Nhận được tin nhắn từ server:', event.data);
                    try {
                        const message = JSON.parse(event.data);
                        console.log('🚀 ~ WebSocket Message:', message);

                        if (message.type === 'NEW_NOTIFICATION') {
                            setNotifications((prev) => {
                                const isDuplicate = prev.some(noti => Number(noti.time) === Number(message.time));
                                return isDuplicate ? prev : [...prev, {
                                    userId: message.userId,
                                    shipmentId: message.shipmentId,
                                    message: message.message,
                                    time: message.time,
                                },
                                ];
                            });
                        }
                    } catch (error) {
                        console.log('❌ Lỗi khi parse JSON:', error);
                    }
                };
            } catch (error) {
                console.log('🚨 Lỗi khi lấy token:', error);
            }
        };

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

        connectWebSocket();

        return () => {
            console.log('🔌 Đóng kết nối WebSocket...');
            stopHeartbeat();
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectRef.current) {
                clearTimeout(reconnectRef.current);
                reconnectRef.current = null;
            }
        };
    }, [userId]);

    return notifications;
};

export default useWebSocket;
