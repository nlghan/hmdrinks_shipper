import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootStackParamList';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DirectionRouteProp = RouteProp<RootStackParamList, 'DirectionScreen'>;

interface StepDetail {
    step_id: number;
    instruction: string;
    distance: string;
    duration: string;
    latitude: number;
    longitude: number;
}

const DirectionScreen = () => {
    const route = useRoute<DirectionRouteProp>();
    const { shipmentId, status } = route.params;

    const [htmlContent, setHtmlContent] = useState('');
    const [steps, setSteps] = useState<StepDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const overlayHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.3)).current;
    const webViewRef = useRef<WebView>(null);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            return isVerticalGesture && Math.abs(gestureState.dy) > 10;
        },
        onPanResponderMove: (_, gestureState) => {
            const newHeight = SCREEN_HEIGHT * 0.6 - gestureState.dy;
            if (newHeight >= SCREEN_HEIGHT * 0.2 && newHeight <= SCREEN_HEIGHT * 0.9) {
                overlayHeight.setValue(newHeight);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            const shouldExpand = gestureState.dy < 0;
            Animated.spring(overlayHeight, {
                toValue: shouldExpand ? SCREEN_HEIGHT * 0.8 : SCREEN_HEIGHT * 0.3,
                useNativeDriver: false,
            }).start();
        },
    });


    const cleanHtmlString = (htmlString: string): string => {
        try {
            let cleaned = htmlString
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"')
                .replace(/\\t/g, '\t')
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\'/g, "'")
                .replace(/\\\//g, '/');

            return cleaned.replace(/\\u([\dA-Fa-f]{4})/g, (_, unicode) =>
                String.fromCharCode(parseInt(unicode, 16))
            );
        } catch (err) {
            console.error('Lỗi xử lý chuỗi HTML:', err);
            return htmlString;
        }
    };

    const injectScriptIntoHtml = (html: string): string => {
        const script = `
            <script>
                let marker;
                document.addEventListener("message", function(event) {
                    if (event.data && typeof event.data === 'string') {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === "updateMarker") {
                                const { latitude, longitude } = data;
                                updateMarkerOnMap(latitude, longitude);
                            }
                        } catch (e) {
                            console.error('Invalid JSON:', e);
                        }
                    }
                });

                function updateMarkerOnMap(lat, lng) {
                    if (window.map) {
                        window.map.panTo({ lat, lng });
                        if (!marker) {
                            marker = new google.maps.Marker({
                                position: { lat, lng },
                                map: window.map
                            });
                        } else {
                            marker.setPosition({ lat, lng });
                        }
                    }
                }
            </script>
        `;
        return html.includes('</body>') ? html.replace('</body>', script + '</body>') : html + script;
    };

    const fetchDirection = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                setError('Vui lòng đăng nhập lại.');
                return;
            }

            const response = await axiosInstance.get(`/shipment/view/map_direction/${shipmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const { mapRouteHTML, listStepDetail, polyline } = response.data;

            if (!mapRouteHTML || !polyline) {
                setError('Thiếu dữ liệu bản đồ hoặc tuyến đường.');
                return;
            }

            let cleanHtml = cleanHtmlString(mapRouteHTML);
            cleanHtml = cleanHtml.replace(
                /var encodedPolyline = "(.*?)";/,
                `var encodedPolyline = ${JSON.stringify(polyline)};`
            );
            cleanHtml = injectScriptIntoHtml(cleanHtml);

            setHtmlContent(cleanHtml);
            setSteps(listStepDetail || []);
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu bản đồ:', err);
            setError('Không thể tải lộ trình.');
        } finally {
            setLoading(false);
        }
    };

    const handleStepClick = (latitude: number, longitude: number) => {
        const dataToSend = {
            type: 'updateMarker',
            latitude,
            longitude,
        };
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify(dataToSend));
        }
    };

    useEffect(() => {
        fetchDirection();
    }, []);

    if (loading) return <ActivityIndicator style={{ marginTop: 30 }} size="large" color="#FFA983" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                pointerEvents="box-none"
            />

            <Animated.View
                style={[styles.overlay, { height: overlayHeight, zIndex: 10 }]}
                pointerEvents="auto"
                {...panResponder.panHandlers}
            >
                <View style={{ alignItems: 'center', padding: 10 }}>
                    <View style={{ width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 2.5 }} />
                </View>

                <FlatList
                    ListHeaderComponent={
                        <>
                            <View style={styles.statusBox}>
                                <Text style={styles.statusTitle}>
                                    Trạng thái giao hàng
                                </Text>
                                <View style={styles.statusLine}>
                                    {[...Array(3)].map((_, i) => (
                                        <React.Fragment key={i}>
                                            {/* Dot */}
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:
                                                            status === 'SUCCESS'
                                                                ? '#1ABC9C'
                                                                : status === 'SHIPPING'
                                                                    ? i < 2
                                                                        ? '#1ABC9C'
                                                                        : '#ccc'
                                                                    : '#ccc',
                                                    },
                                                ]}
                                            />
                                            {/* Divider (line) */}
                                            {i < 2 && (
                                                <View
                                                    style={[
                                                        styles.statusDivider,
                                                        {
                                                            backgroundColor:
                                                                status === 'SUCCESS'
                                                                    ? '#1ABC9C'
                                                                    : status === 'SHIPPING' && i === 0
                                                                        ? '#1ABC9C'
                                                                        : '#ccc',
                                                        },
                                                    ]}
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </View>

                                <View style={styles.statusLabels}>
                                    <Text style={styles.statusLabel}>Đã vận chuyển</Text>
                                    <Text style={styles.statusLabel}>Đang giao hàng</Text>
                                    <Text style={styles.statusLabel}>Đã giao hàng</Text>
                                </View>
                            </View>
                            <Text style={styles.stepHeader}>Các bước hướng dẫn:</Text>
                        </>
                    }
                    data={steps}
                    keyExtractor={(item) => item.step_id.toString()}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            onPress={() => handleStepClick(item.latitude, item.longitude)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.stepItem}>
                                <Text style={styles.stepIndex}>{index + 1}.</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.instruction}>{item.instruction}</Text>
                                    <Text style={styles.detail}>
                                        {item.distance} - {item.duration}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        overflow: 'hidden',
    },
    statusBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 12,
        padding: 12,
        elevation: 2,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    statusLine: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    statusDivider: {
        flex: 1,
        height: 2,
        backgroundColor: '#1ABC9C',
        marginHorizontal: 4,
    },
    statusLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    statusLabel: {
        fontSize: 12,
        color: '#555',
    },
    stepHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        padding: 12,
        backgroundColor: '#f2f2f2',
    },
    stepItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 10,
        elevation: 1,
    },
    stepIndex: {
        fontWeight: 'bold',
        marginRight: 10,
        color: '#FFA983',
    },
    instruction: {
        fontSize: 15,
    },
    detail: {
        fontSize: 13,
        color: '#888',
    },
    errorText: {
        textAlign: 'center',
        color: 'red',
        marginTop: 20,
    },
});

export default DirectionScreen;
