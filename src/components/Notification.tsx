import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface NotificationProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 2000);
    }
  }, [visible]);

  return visible ? (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: '5%',
      left: '10%',
      right: '10%',
      backgroundColor: 'rgb(255, 249, 243)', // Màu cam nhạt
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8, // Bo góc mềm mại
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 8, // Tạo hiệu ứng nổi trên Android
      zIndex: 1000,
    },
    text: {
      color: 'rgb(33, 19, 6)', // Màu chữ trắng
      fontSize: 14,
      fontWeight: '600',
    },
  });  

export default Notification;
