import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Home from '../screens/Home';
import Login from '../screens/Login';
import Info from '../screens/Info';
import Other from '../screens/Other';
import TabNavigator from './TabNavigator';
import LanguageChange from '../screens/LanguagChange';


// ✅ Định nghĩa kiểu cho danh sách các màn hình
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Info: undefined;
  Other: undefined;
  Main: undefined;
  LanguageChange:  undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const { t } = useTranslation(); // ✅ Đặt trong function component

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false, animation:'slide_from_right' }} />
      {/* <Stack.Screen name="Register" component={Register} options={{ headerShown: false, animation:'slide_from_right' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false, animation:'slide_from_right' }} /> */}
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{
          headerShown: false,
          animation: 'slide_from_right'  // Thử đổi thành 'slide_from_right' hoặc 'fade'
        }}
      />
      <Stack.Screen name="Info" component={Info} options={{ headerShown: false }} />    
      <Stack.Screen name="Other" component={Other} options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="LanguageChange" component={LanguageChange} options={{ headerShown: false, animation: 'slide_from_right' }} />
      
    </Stack.Navigator>
  );
};

export default StackNavigator;
