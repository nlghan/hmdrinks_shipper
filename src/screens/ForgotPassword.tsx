import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Animated, Easing } from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import { useNavigation } from '@react-navigation/native';

type NavigationProps = {
    navigate: (screen: string) => void;
};
const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigation = useNavigation<NavigationProps>();

    const handleSubmitChange = async () => {
        if (!isOtpSent) {
            if (email) {
                try {
                    setIsLoading(true);
                    const response = await axiosInstance.post(`/public/password/forget/send`, {
                        email: email
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'accept': '*/*'
                        }
                    });
                    setMessage(response.data.message || "Vui lòng kiểm tra email của bạn để nhận mã OTP.");
                    setError('');
                    setIsOtpSent(true);
                } catch (err: any) {
                    setError(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
                    setMessage('');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setError("Vui lòng nhập địa chỉ email của bạn.");
            }
        } else {
            if (otp) {
                try {
                    setIsLoading(true);
                    const response = await axiosInstance.post(`/public/password/acceptOtp`, {
                        email: email,
                        otp: otp
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'accept': '*/*'
                        }
                    });
                    setMessage(response.data.message || "Xác thực mã OTP thành công.");
                    setError('');
                    setTimeout(() => {
                        setIsLoading(false);
                        navigation.navigate('Login');
                    }, 2000);
                } catch (err: any) {
                    setError(err.response?.data?.message || "Đã xảy ra lỗi khi xác thực OTP. Vui lòng thử lại.");
                    setMessage('');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setError("Vui lòng nhập mã OTP.");
            }
        }
    };
    const colorAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(colorAnimation, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: false, // Vì animate màu sắc không dùng native driver được
                }),
                Animated.timing(colorAnimation, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    // Tạo màu sắc loang
    const textColor = colorAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FF4500', '#FFA07A'], // Chuyển từ cam đậm sang cam nhạt
    });

    const shadowColor = colorAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FF7F50', '#FF4500'], // Tạo hiệu ứng bóng chuyển động
    });

    const floatingAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(floatingAnimation, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const floatingInterpolate = floatingAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quên Mật Khẩu</Text>
            <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#FF7F50"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            {isOtpSent && (
                <TextInput
                    style={styles.input}
                    placeholder="Nhập mã OTP"
                    placeholderTextColor="#FF7F50"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                />
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}
            <TouchableOpacity style={styles.loginButton} onPress={handleSubmitChange} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>{isOtpSent ? "Xác nhận OTP" : "Gửi OTP"}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton1} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText1}>Quay lại trang đăng nhập.</Text>            
            </TouchableOpacity>
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    styles.floatingCircle,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    styles.floatingCircle1,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    styles.floatingCircle2,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5EE',
        padding: 20,
    },
    animatedTitle: {
        fontSize: 50,
        fontWeight: 'bold',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF4500',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#FF7F50',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
        color: '#333',
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#FF7F24',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
    },
    loginText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginButton1: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
    },
    loginText1: {
        color: '#FF4500',
        fontSize: 15,
        fontWeight: 'bold',
    },
    successText: {
        color: 'green',
        fontSize: 16,
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
    floatingCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF7F50',
        opacity: 0.3,
        top: 50,
        right: 50,
    },
    floatingCircle1: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 120,
        backgroundColor: '#FF7F50',
        opacity: 0.3,
        top: 20,
        right: 300,
    },
    floatingCircle2: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 130,
        backgroundColor: '#FF7F50',
        opacity: 0.3,
        bottom: -180,
        right: -80,
    },
});


export default ForgotPassword;
