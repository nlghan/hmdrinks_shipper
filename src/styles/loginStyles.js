import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8FF', // Màu nền nhẹ nhàng
        padding: 20,
    },
    languageContainer: {
        position: "absolute",
        top: 10,
        right: 20,
        zIndex: 10, // Đảm bảo hiển thị trên các thành phần khác
        
    },
    animatedTitle: {
        fontSize: 50,
        fontWeight: 'bold',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF8247', // Màu cam đậm
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#FF7F50', // Viền cam nhạt
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
        color: '#000',
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#FF7F24', // Màu cam đậm
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
    registerText: {
        marginTop: 15,
        fontSize: 15,
        color: '#333',
    },
    registerLink: {
        color: '#FF4500',
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

export default styles;
