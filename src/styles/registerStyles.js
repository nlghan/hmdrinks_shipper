import { StyleSheet } from 'react-native';

const registerStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8FF',
        padding: 20,
    },
    languageContainer: {
        position: "absolute",
        top: 10,
        right: 20,
        zIndex: 10, // Đảm bảo hiển thị trên các thành phần khác
        
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#FF7F50', // Cam đậm cho tiêu đề nổi bật
    },
    input: {
        width: '100%',
        height: 45,
        borderColor: '#FFA07A', // Viền cam nhạt
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#FFF5EE', // Màu nền cam rất nhạt
        color: '#333',
        fontSize: 16,
    },
    animatedTitle: {
        fontSize: 50,
        fontWeight: 'bold',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    registerButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#FF7F24', // Nút cam đậm
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5, // Hiệu ứng đổ bóng cho Android
    },
    registerText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    successText: {
        color: '#32CD32', // Màu xanh lá cây cho thông báo thành công
        marginBottom: 10,
        fontWeight: '600',
    },
    errorText: {
        color: '#FF4500', // Màu cam đỏ cho thông báo lỗi
        marginBottom: 10,
        fontWeight: '600',
    },
    loginText: {
        marginTop: 15,
        fontSize: 16,
        color: '#333',
    },
    loginText1: {
        marginTop: 15,
        fontSize: 15,
        color: '#333',
    },
    loginLink: {
        color: '#FF6347', // Link màu cam đậm
        fontWeight: 'bold',
    },
    googleButton: {
        flexDirection: 'row', // Hiển thị icon và text nằm ngang
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#FFF',// Hoặc màu nền tùy thích
        borderRadius: 5,
        marginTop: 10,
        borderRadius: 12,
        width: '100%',
        height: 50,
        borderColor: '#FFA07A',
        borderWidth: 1,
    },
    googleText: {
        fontSize: 16,
        color: '#000', // Hoặc màu chữ tùy thích
    },

    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 8, // Khoảng cách giữa icon và text
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

export default registerStyles;
