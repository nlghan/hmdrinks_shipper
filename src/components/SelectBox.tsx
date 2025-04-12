import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface SelectBoxProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
}

const SelectBox: React.FC<SelectBoxProps> = ({ label, value, options, onSelect }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={{ marginBottom: 12, flex: 1 }}>
            <Text style={{ marginBottom: 4, fontSize: 14 }}>{label}</Text>
            <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setVisible(true)}
            >
                <Text style={{ fontSize: 14 }}>{value}</Text>
            </TouchableOpacity>

            {visible && (
                <Modal transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                        <View style={styles.overlay}>
                            <View style={styles.modal}>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.option,
                                                item === value && { backgroundColor: '#e6f7ff' }
                                            ]}
                                            onPress={() => {
                                                onSelect(item);
                                                setVisible(false);
                                            }}
                                        >
                                            <Text style={{ fontSize: 16 }}>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    selectBox: {
        backgroundColor: '#fff9f0',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d6b17a',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', // Mờ nền khi mở modal
    },
    modal: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        maxHeight: 300,
        paddingVertical: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: {
        backgroundColor: '#fff',
        maxHeight: '50%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SelectBox;
