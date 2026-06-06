import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ==================== Root Stack ====================

export type RootStackParamList = {
  // 认证流程
  Splash: undefined;
  Login: undefined;
  Register: undefined;

  // 主界面
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Detail: { collectId: number };
  CreateCollect: { initialUrl?: string };
  CategoryManage: undefined;
  TagManage: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// ==================== Auth Stack ====================

// 已合并到 RootStack，保留导出以兼容外部引用
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

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

// ==================== 推导导航props的便捷类型 ====================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
