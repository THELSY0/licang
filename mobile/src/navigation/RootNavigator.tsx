import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// 全屏跳转子页面
import DetailScreen from '../screens/detail/DetailScreen';
import CreateCollectScreen from '../screens/create/CreateCollectScreen';
import CategoryManageScreen from '../screens/manage/CategoryManageScreen';
import TagManageScreen from '../screens/manage/TagManageScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // 加载中 — 全屏 loading（NavigationContainer 之外）
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          /* 未登录 → 认证流程 */
          <RootStack.Group screenOptions={{ animation: 'slide_from_right' }}>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </RootStack.Group>
        ) : (
          /* 已登录 → 主界面 */
          <RootStack.Group>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />

            <RootStack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="CreateCollect"
              component={CreateCollectScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen
              name="CategoryManage"
              component={CategoryManageScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="TagManage"
              component={TagManageScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </RootStack.Group>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
