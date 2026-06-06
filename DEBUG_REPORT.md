# 栗藏移动端 Expo 闪屏问题 — 诊断报告与修复方案

## 1. 问题现象

- 最简 App.tsx（只有 View + Text）→ 正常显示
- 加上 SafeAreaProvider + QueryClientProvider + RootNavigator（带 useAuth）→ 扫码后反复闪屏，无法进入登录页
- `newArchEnabled` 已设为 `false`，metro.config.js 已配置

---

## 2. 读取的关键文件

| 文件 | 路径 |
|------|------|
| App.tsx | `mobile/App.tsx` |
| RootNavigator | `mobile/src/navigation/RootNavigator.tsx` |
| useAuth hook | `mobile/src/hooks/useAuth.ts` |
| authStore (Zustand) | `mobile/src/store/authStore.ts` |
| API client (Axios) | `mobile/src/api/client.ts` |
| MainTabNavigator | `mobile/src/navigation/MainTabNavigator.tsx` |
| SplashScreen | `mobile/src/screens/SplashScreen.tsx` |
| LoginScreen | `mobile/src/screens/auth/LoginScreen.tsx` |
| RegisterScreen | `mobile/src/screens/auth/RegisterScreen.tsx` |
| HomeScreen | `mobile/src/screens/home/HomeScreen.tsx` |
| ProfileScreen | `mobile/src/screens/profile/ProfileScreen.tsx` |
| SearchScreen | `mobile/src/screens/search/SearchScreen.tsx` |
| ImportScreen | `mobile/src/screens/import/ImportScreen.tsx` |
| 类型定义 | `mobile/src/navigation/types.ts` |
| API 模块 | `mobile/src/api/auth.ts`, `client.ts`, `index.ts` |
| 配置文件 | `package.json`, `app.json`, `metro.config.js`, `babel.config.js` |

---

## 3. 根本原因分析

### 3.1 主因：`useAuth` 中的 `loadUser()` 与条件渲染形成无限挂载/卸载循环

这是导致**持续反复闪屏**的核心 Bug。

**触发链：**

```
┌──────────────────────────────────────────────────────────────────┐
│  RootNavigator 条件渲染:                                         │
│    isLoading ? <Spinner/> : <Navigator><AuthStack/></Navigator> │
│                                                                  │
│  AuthStack 内的 LoginScreen/RegisterScreen 使用 useAuth()       │
│    → useAuth 的 useEffect 调用 store.loadUser()                  │
│    → loadUser() 开头执行 set({ isLoading: true })                │
│    → RootNavigator 检测到 isLoading=true → 切回 Spinner         │
│    → AuthStack+LoginScreen 被卸载                                │
│    → loadUser() 异步完成 → set({ isLoading: false })             │
│    → RootNavigator 检测到 isLoading=false → 显示 Navigator      │
│    → LoginScreen 重新挂载 → useEffect → store.loadUser()        │
│    → 无限循环 ← 闪屏！                                           │
└──────────────────────────────────────────────────────────────────┘
```

**关键代码段：**

`useAuth.ts` 第 24-27 行：
```typescript
useEffect(() => {
    store.loadUser();  // ← 每次挂载都调用
}, []);
```

`authStore.ts` 第 82-83 行：
```typescript
loadUser: async () => {
    try {
      set({ isLoading: true });  // ← 重新将 isLoading 设为 true！
      const token = await AsyncStorage.getItem(TOKEN_KEY);
```

**为什么 `loadUser` 每次开头都设 `isLoading: true` 会致命？**

因为 RootNavigator 用 `isLoading` 做条件渲染。任何子组件（LoginScreen / RegisterScreen / ProfileScreen）只要使用 `useAuth()`，挂载时就会触发 `loadUser()`，而 `loadUser()` 第一行就把 `isLoading` 翻回 `true`，导致整个导航树被卸载。等异步操作完成，`isLoading` 回到 `false`，导航树重新挂载，子组件的 `useEffect` 再次触发…形成死循环。

### 3.2 次因：缺少 `QueryClientProvider`

当前磁盘上的 `App.tsx` **没有** `QueryClientProvider`：

```typescript
// App.tsx — 当前代码
export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />   // ← 缺少 QueryClientProvider
    </SafeAreaProvider>
  );
}
```

但以下组件**全部依赖** TanStack Query 的 Provider：

| 组件 | 使用的 Hook |
|------|-------------|
| HomeScreen | `useQuery` |
| SearchScreen | `useQuery`, `useInfiniteQuery`, `useQueryClient` |
| ImportScreen | `useMutation` |
| LoginScreen | `useAuth()` → 内部 uses `useQuery` |
| RegisterScreen | `useAuth()` → 内部 uses `useQuery` |
| ProfileScreen | `useAuth()` → 内部 uses `useQuery` |

缺少 `QueryClientProvider` 时，任何 `useQuery` 调用都会抛出：
```
Error: No QueryClient set, use QueryClientProvider to set one
```

这个未捕获的异常会导致 React 组件树崩溃，在 Expo Go 中表现为白屏/闪屏循环。

### 3.3 从因：`useAuthStore()` 无选择器导致全量订阅

`useAuth.ts` 第 12 行：
```typescript
const store = useAuthStore();  // 订阅整个 store，任何字段变化都触发重渲染
```

Zustand v5 中不带选择器的 `useAuthStore()` 会在 store 中**任何**字段变化时触发重渲染。`loadUser()` 一次执行会触发 2~3 次 `set()`，每次都导致所有使用 `useAuth()` 的组件重渲染，加剧了循环问题。

### 3.4 从因：RootNavigator 未注册 Auth 流程页面

类型定义 `RootStackParamList` 声明了 `Splash`、`Login`、`Register` 等页面（`types.ts` 第 8-19 行），但当前 `RootNavigator.tsx` 只注册了 `MainTabs`：

```typescript
// RootNavigator.tsx — 当前代码
<RootStack.Navigator screenOptions={{ headerShown: false }}>
  <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
  {/* 缺少: Splash, Login, Register, Detail, CreateCollect, ... */}
</RootStack.Navigator>
```

即使解决了循环问题，登录流程也无法正常显示。

### 3.5 从因：SplashScreen 导航类型不匹配

`SplashScreen.tsx` 第 9 行将导航类型标注为 `AuthStackParamList`：
```typescript
type SplashNavProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
```

而 `RootStackParamList` 中也定义了 `Splash`（类型不同但字段相同），这会导致 TypeScript 类型不兼容警告，虽然运行时不影响。

---

## 4. 精确修复方案

### 修复 1（关键）：断开 `loadUser` 中的 `isLoading` 循环

**文件：** `D:/projectsme/licang/mobile/src/store/authStore.ts`

**第 83 行，删除：**
```typescript
set({ isLoading: true });
```

`loadUser` 的 `isLoading: true` 是多余的——store 初始状态已经是 `isLoading: true`（第 32 行）。首次调用不需要重新设置它。删除后，子组件挂载时调用 `loadUser()` 不会再触发父组件条件渲染切换。

**同时需要在 `loadUser` 中加防重入保护：**

```typescript
// 在 authStore 的 State 接口中添加
isLoading: boolean;
isInitialized: boolean;  // 新字段

// loadUser 改为：
loadUser: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;  // 已经初始化过，跳过
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!token) {
        set({ isLoading: false, isAuthenticated: false, isInitialized: true });
        return;
      }
      set({ token, refreshToken });
      const user = await authApi.getUserInfo();
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch {
      await clearStoredTokens();
      set({ token: null, refreshToken: null, user: null,
            isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
```

### 修复 2（关键）：在 App.tsx 中添加 QueryClientProvider

**文件：** `D:/projectsme/licang/mobile/App.tsx`

当前内容改为：

```typescript
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

### 修复 3（重要）：重构 RootNavigator 添加完整路由和认证流

**文件：** `D:/projectsme/licang/mobile/src/navigation/RootNavigator.tsx`

```typescript
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DetailScreen from '../screens/detail/DetailScreen';
import CreateCollectScreen from '../screens/create/CreateCollectScreen';
import CategoryManageScreen from '../screens/manage/CategoryManageScreen';
import TagManageScreen from '../screens/manage/TagManageScreen';
import { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // ⚠️ NavigationContainer 必须在条件渲染外层，避免卸载重载循环
  return (
    <NavigationContainer>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1890FF" />
        </View>
      ) : (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            // 已登录 → 主界面
            <>
              <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
              <RootStack.Screen name="Detail" component={DetailScreen} />
              <RootStack.Screen name="CreateCollect" component={CreateCollectScreen} />
              <RootStack.Screen name="CategoryManage" component={CategoryManageScreen} />
              <RootStack.Screen name="TagManage" component={TagManageScreen} />
            </>
          ) : (
            // 未登录 → 认证流程
            <>
              <RootStack.Screen name="Splash" component={SplashScreen} />
              <RootStack.Screen name="Login" component={LoginScreen} />
              <RootStack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

### 修复 4（优化）：`useAuthStore` 使用选择器

**文件：** `D:/projectsme/licang/mobile/src/hooks/useAuth.ts`

第 12 行改为使用选择器，避免全量订阅：

```typescript
// 原来（全量订阅，任何字段变化都重渲染）：
const store = useAuthStore();

// 改为选择器：
const token = useAuthStore((s) => s.token);
const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const isLoading = useAuthStore((s) => s.isLoading);
const storeActions = useAuthStore((s) => ({
  login: s.login,
  register: s.register,
  loginWithCode: s.loginWithCode,
  logout: s.logout,
  loadUser: s.loadUser,
}));
```

注意：动作函数引用稳定（Zustand 保证），不会导致额外重渲染。

### 修复 5（优化）：SplashScreen 导航类型修正

**文件：** `D:/projectsme/licang/mobile/src/screens/SplashScreen.tsx`

第 6-7、9 行改为使用 `RootStackParamList`：

```typescript
// 原来：
import type { AuthStackParamList } from '../navigation/types';
type SplashNavProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

// 改为：
import type { RootStackParamList } from '../navigation/types';
type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;
```

---

## 5. 修复优先级

| 优先级 | 修复项 | 影响 |
|--------|--------|------|
| **P0 紧急** | 修复 1: 移除 `loadUser` 中的 `set({ isLoading: true })` + 加 `isInitialized` 防重入 | **解除无限闪屏循环** |
| **P0 紧急** | 修复 2: App.tsx 添加 `QueryClientProvider` | **防止 useQuery crash** |
| **P1 重要** | 修复 3: 重构 RootNavigator 添加完整路由 + 认证流 | **恢复正常导航功能** |
| **P2 优化** | 修复 4: useAuthStore 使用选择器 | **减少不必要的重渲染** |
| **P3 建议** | 修复 5: SplashScreen 类型修正 | **消除类型警告** |

---

## 6. 完整闪屏循环时序图

```
时间轴 →

T0: App 挂载
    RootNavigator.useAuth() → isLoading=true (初始值)
    → 渲染 <Spinner />

T1: useEffect → store.loadUser()
    loadUser 内 set({ isLoading: true })  ← 多余但此时无影响
    AsyncStorage 查询中...

T2: AsyncStorage 返回 null（无 token）
    set({ isLoading: false, isAuthenticated: false })

T3: RootNavigator 重渲染
    isLoading=false → 渲染 <NavigationContainer><AuthStack>
    AuthStack 内 SplashScreen 挂载

T4: SplashScreen setTimeout 2s 后 → navigation.replace('Login')

T5: LoginScreen 挂载
    LoginScreen 调用 useAuth()
    → useEffect → store.loadUser()  ← 第二次调用！
    → loadUser 内 set({ isLoading: true })  ← 🔴 致命！
    
T6: RootNavigator 检测到 isLoading=true
    → 切回 <Spinner />
    → NavigationContainer 内的 AuthStack 被卸载
    → LoginScreen 被卸载
    
T7: loadUser() 的 AsyncStorage 查询完成（仍无 token）
    set({ isLoading: false, isAuthenticated: false })

T8: RootNavigator 再次渲染 AuthStack
    → SplashScreen 再次挂载
    
T9: 2s 后 → navigation.replace('Login')
    → LoginScreen 再次挂载 → useAuth → useEffect → loadUser()
    → set({ isLoading: true })  ← 回到 T5，无限循环！
```

---

## 7. 附加建议

1. **移除 `useAuth` 中的 `/eslint-disable-next-line react-hooks/exhaustive-deps`**（`useAuth.ts` 第 26 行）——这是危险的实践，应该保留 deps 警告以便发现潜在问题。

2. **为 `expo-splash-screen` 添加显式控制**——当前 `app.json` 中注册了 `expo-splash-screen` 插件但代码中未调用 `SplashScreen.preventAutoHideAsync()` / `SplashScreen.hideAsync()`，建议在 App.tsx 中显式控制原生闪屏的隐藏时机。

3. **`expo-linear-gradient` 可能导致 Android 闪屏**——如果 SplashScreen 中的 `LinearGradient` 在低端设备上渲染缓慢，可能造成白屏闪烁。确保 SplashScreen 中不包含 `LinearGradient`，或为原生闪屏背景色设置与渐变起始色一致的颜色（已在 `app.json` 中设为 `#1890FF`，与渐变起始色一致 ✓）。

---

*报告生成时间: 2026-06-06*
*分析范围: D:/projectsme/licang/mobile/* 全部源码文件
