import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ==================== Root Stack (所有页面平级) ====================

export type RootStackParamList = {
  // 认证流程
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  // 主界面
  MainTabs: undefined;
  // 全屏子页面
  Detail: { collectId: number };
  CreateCollect: { initialUrl?: string };
  CategoryManage: undefined;
  TagManage: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// ==================== Auth Stack (保留兼容旧引用) ====================

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

// ==================== Main Tabs ====================

export type MainTabParamList = {
  HomeTab: undefined;
  ImportTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<'MainTabs'>
  >;

// ==================== 全局导航类型声明 ====================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
