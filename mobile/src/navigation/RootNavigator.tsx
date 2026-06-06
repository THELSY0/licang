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
    interface RootParamList extends RootStackParamList {
      Detail: { collectId: number };
      CreateCollect: { initialUrl?: string };
      CategoryManage: undefined;
      TagManage: undefined;
    }
  }
}

function AuthStack() {
  const AuthStackNav = createNativeStackNavigator();

  return (
    <AuthStackNav.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <AuthStackNav.Screen name="Splash" component={SplashScreen} />
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // 加载中 — 全屏loading
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
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />

            {/* 全屏子页面 — 在Tab之上push */}
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
          </>
        ) : (
          <RootStack.Screen name="AuthStack" component={AuthStack} />
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
