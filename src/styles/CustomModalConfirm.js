import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CustomModalConfirm = ({ visible, title, message, onCancel, onConfirm, cancelText, confirmText }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    cancelButton: {
        marginRight: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#ccc',
        borderRadius: 8,
    },
    confirmButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FF9900',
        borderRadius: 8,
    },
    cancelText: {
        color: '#000',
        fontWeight: 'bold',
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default CustomModalConfirm;
