import React, { useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type StatusType = 'WAITING' | 'SHIPPING' | 'SUCCESS' | 'CANCELLED';

interface StatusBarProps {
    selectedStatus: StatusType;
    onStatusChange: (status: StatusType) => void;
}

const statusConfig = [
    { status: 'WAITING', icon: 'hourglass-empty', title: 'Đơn hàng chờ giao' },
    { status: 'SHIPPING', icon: 'local-shipping', title: 'Đơn hàng cần giao' },
    { status: 'SUCCESS', icon: 'check-circle', title: 'Đơn hàng thành công' },
    { status: 'CANCELLED', icon: 'cancel', title: 'Đơn hàng đã hủy' },
] as const;

const StatusBar: React.FC<StatusBarProps> = ({ selectedStatus, onStatusChange }) => {
    const screenWidth = Dimensions.get('window').width;
    const tabWidth = screenWidth / statusConfig.length;
    // Slider sẽ có chiều rộng bằng 70% của tabWidth
    const sliderWidth = tabWidth * 0.7;
    // Offset để căn giữa slider trong tab
    const offset = (tabWidth - sliderWidth) / 2 - 0.1 * tabWidth;

    // Sử dụng animatedIndex để lưu trữ chỉ số trạng thái (0, 1, 2, 3)
    const animatedIndex = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const index = statusConfig.findIndex(item => item.status === selectedStatus);
        Animated.spring(animatedIndex, {
            toValue: index,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start();
    }, [selectedStatus, animatedIndex]);

    // Interpolate index sang vị trí pixel: vị trí = index * tabWidth + offset
    const translateX = animatedIndex.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange: [
            0 * tabWidth + offset,
            1 * tabWidth + offset - 0.1 * tabWidth,
            2 * tabWidth + offset - 0.15 * tabWidth,
            3 * tabWidth + offset - 0.25 * tabWidth,
        ],
        extrapolate: 'clamp',
    });


    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {statusConfig.map(item => {
                    const isActive = selectedStatus === item.status;
                    return (
                        <TouchableOpacity
                            key={item.status}
                            style={styles.tab}
                            onPress={() => onStatusChange(item.status)}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons
                                name={item.icon}
                                size={26}
                                style={[styles.icon, isActive && styles.activeIcon]}
                            />
                        </TouchableOpacity>
                    );
                })}
                <Animated.View
                    style={[
                        styles.slider,
                        {
                            width: sliderWidth,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    icon: {
        color: '#777',
    },
    activeIcon: {
        color: '#FFA983',
    },
    label: {
        fontSize: 11,
        color: '#777',
        marginTop: 4,
        fontWeight: '500',
    },
    activeLabel: {
        color: '#FFA983',
        fontWeight: '600',
    },
    slider: {
        height: '100%',
        position: 'absolute',
        backgroundColor: 'rgba(255, 169, 131, 0.2)',
        borderRadius: 50,
        top: 0,
        left: (Dimensions.get('window').width / statusConfig.length) * 0.05,
    },
    title: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default StatusBar;
