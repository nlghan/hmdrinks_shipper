import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { decode as atob } from 'base-64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosInstance';
import loginStyles from '../styles/loginStyles';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';
import { Buffer } from 'buffer';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next'; // Import hook useTranslation
import { useShipperStore } from '../store/store';



type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const getUserIdFromToken = (token: string) => {
    try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

        console.log('Decoded Payload:', decodedPayload); // Kiểm tra nội dung payload
        return parseInt(decodedPayload.UserId, 10);
    } catch (error) {
        console.error('Cannot decode token:', error);
        return null;
    }
};

const Login: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const setUserId = useShipperStore((state) => state.setUserId);  // Lấy setUserId từ Zustand

    const handleLogin = async () => {
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        if (!username || !password) {
            setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
            setLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.post('/v1/auth/authenticate', {
                userName: username,
                password: password,
            });

            if (response.status === 200 && response.data.access_token) {
                await AsyncStorage.setItem('access_token', response.data.access_token);
                if (response.data.refresh_token) {
                    await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
                }
                const role = getRoleFromToken(response.data.access_token);
                const userId = getUserIdFromToken(response.data.access_token);
                setUserId(userId);

                setSuccessMessage('Đăng nhập thành công!');
                setLoading(false); // 🔥 Đặt loading về false ngay trước khi điều hướng


                if (role.includes('SHIPPER')) {
                    setLoading(false);

                    navigation.replace('Main'); // 🔄 replace() để tránh quay lại màn hình login
                }
            } else {
                setErrorMessage(response.data.message || 'Sai tài khoản hoặc mật khẩu');
                setLoading(false); // 🔥 Đảm bảo loading tắt khi lỗi
            }
        } catch (error) {
            setErrorMessage((error as any).response?.data?.message || 'Không thể kết nối đến máy chủ');
            setLoading(false);
        } finally {
            setLoading(false)
        }
    };



    const getRoleFromToken = (token: string): string => {
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            return decodedPayload.Roles || '';
        } catch {
            return '';
        }
    };


    const handleLoginGG = async () => {
        try {
            const response = await axiosInstance.get('/v1/auth/social-login/google', {
                headers: { 'accept': '*/*' },
            });
            if (response.data) {
                const loginUrl = response.data;
                if (await InAppBrowser.isAvailable()) {
                    const result = await InAppBrowser.open(loginUrl, {
                        dismissButtonStyle: 'close',
                        preferredBarTintColor: '#FFFFFF',
                        preferredControlTintColor: '#000000',
                        showTitle: true,
                        enableUrlBarHiding: true,
                        enableDefaultShare: false,
                    });
                    if (result.type !== 'cancel' && result.type !== 'dismiss') {
                        console.log('Google Login thành công:', result);
                        navigation.navigate('Home'); // Điều hướng sau khi đăng nhập
                    }
                } else {
                    console.error('InAppBrowser không khả dụng');
                }
            } else {
                console.error('Không nhận được URL đăng nhập từ API');
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu Google login:', error);
        }
    };

    useEffect(() => {
        const handleDeepLink = (event: any) => {
            const { url } = event;
            if (url) {
                console.log('Deep link nhận được:', url);
                const token = extractTokenFromUrl(url);
                if (token) {
                    console.log('Access Token:', token);
                    navigation.navigate('Home'); // Điều hướng sau khi login
                }
            }
        };

        // Thêm listener
        const linkingListener = Linking.addEventListener('url', handleDeepLink);

        return () => {
            // Gỡ listener khi unmount
            linkingListener.remove();
        };
    }, []);

    const extractTokenFromUrl = (url: any) => {
        const match = url.match(/access_token=([^&]*)/);
        return match ? match[1] : null;
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
        <View style={loginStyles.container}>
            <View style={loginStyles.languageContainer}>
                <LanguageSwitcher />
            </View>
            {/* Hiệu ứng tiêu đề */}
            <Animated.Text style={[loginStyles.animatedTitle, { color: textColor, textShadowColor: shadowColor, textAlign: 'center' }]}>
                HMDRINKS
            </Animated.Text>
            <Text style={loginStyles.title}>{t('login')}</Text>

            {successMessage ? <Text style={loginStyles.successText}>{successMessage}</Text> : null}
            {errorMessage ? <Text style={loginStyles.errorText}>{errorMessage}</Text> : null}

            <TextInput
                style={loginStyles.input}
                placeholder={t('userName')}
                placeholderTextColor="#FFA07A"
                value={username}
                onChangeText={setUsername}
            />

            <TextInput
                style={loginStyles.input}
                placeholder={t('password')}
                placeholderTextColor="#FFA07A"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={loginStyles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={loginStyles.loginText}>{t('login')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={loginStyles.googleButton} onPress={handleLoginGG}>
                <Image source={require('../assets/app_images/gg.png')} style={loginStyles.googleIcon}/>
                <Text style={loginStyles.googleText}>{t('gg')}</Text>
            </TouchableOpacity>

            {/* Thêm phần đăng ký */}
        
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={loginStyles.registerText}>
                    <Text style={loginStyles.registerLink}>{t('forget')}</Text>
                </Text>
            </TouchableOpacity>
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    loginStyles.floatingCircle,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    loginStyles.floatingCircle1,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
            {/* Họa tiết động */}
            <Animated.View
                style={[
                    loginStyles.floatingCircle2,
                    { transform: [{ rotate: floatingInterpolate }] },
                ]}
            />
        </View>
    );
};

export default Login;