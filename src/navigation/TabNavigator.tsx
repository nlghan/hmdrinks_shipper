import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Info from '../screens/Info';
import Other from '../screens/Other';
import { COLORS, FONTFAMILY } from '../theme/theme';
import { BlurView } from '@react-native-community/blur';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { t } = useTranslation(); // ✅ Lấy function `t`

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBarStyle,
        tabBarActiveTintColor: COLORS.primaryGreenHex,
        tabBarInactiveTintColor: COLORS.primaryGray,
        tabBarLabelStyle: styles.labelStyle,
        tabBarBackground: () => (
          <BlurView overlayColor="" blurAmount={15} style={styles.blurStyle} />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: t('home1'), // ✅ Sử dụng trực tiếp `t('home1')`
          tabBarIcon: ({ focused }) => (
            <Icon
              name="home"
              size={24}
              color={focused ? COLORS.primaryGreenHex : COLORS.primaryGray}
            />
          ),
        }}
      />


      <Tab.Screen
        name="Info"
        component={Info}
        options={{
          tabBarLabel: t('info'), // ✅ Dịch "Khác"
          tabBarIcon: ({ focused }) => (
            <Icon
              name="person"
              size={24}
              color={focused ? COLORS.primaryGreenHex : COLORS.primaryGray}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Other"
        component={Other}
        options={{
          tabBarLabel: t('information.other'), // ✅ Dùng t() để lấy từ khóa dịch
          tabBarIcon: ({ focused }) => (
            <Icon
              name="menu"
              size={24}
              color={focused ? COLORS.primaryGreenHex : COLORS.primaryGray}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 60,
    position: 'absolute',
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 0,
    borderTopColor: 'transparent',
  },
  blurStyle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  labelStyle: {
    fontSize: 10,
    fontFamily: FONTFAMILY.lobster_regular,
    marginBottom: 5,
  },
});

export default TabNavigator;
