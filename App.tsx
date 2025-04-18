import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NotificationProvider } from './src/components/NotificationContext';
import StackNavigator from './src/navigation/StackNavigator';
import './src/i18n/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from 'react-native';


const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </GestureHandlerRootView>

  );
};

export default App;
