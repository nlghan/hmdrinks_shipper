import React, { createContext, useContext, useState } from 'react';
import NotificationModal from './NotificationModal';

interface NotificationContextProps {
  showNotificationModal: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showNotificationModal = (msg: string) => {
    setMessage(msg);
    setVisible(true);
  };

  const closeNotificationModal = () => {
    setVisible(false);
    setMessage('');
  };

  return (
    <NotificationContext.Provider value={{ showNotificationModal}}>
      {children}
      <NotificationModal
        visible={visible}
        message={message}
        onClose={closeNotificationModal}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
