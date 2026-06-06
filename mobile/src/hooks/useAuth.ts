import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth';

/**
 * useAuth — 封装 authStore + TanStack Query
 * 
 * 自动在挂载时调用 loadUser() 恢复session
 */
export function useAuth() {
  const store = useAuthStore();

  // 用户信息查询 (仅登录后启用)
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getUserInfo,
    enabled: store.isAuthenticated && !!store.token,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 挂载时自动恢复session
  useEffect(() => {
    store.loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // 状态 — isLoading只看store，不看userQuery
    user: store.user ?? userQuery.data ?? null,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,

    // 认证操作
    login: store.login,
    register: store.register,
    loginWithCode: store.loginWithCode,
    logout: store.logout,
    loadUser: store.loadUser,

    // 查询控制
    refetchUser: userQuery.refetch,
    isUserStale: userQuery.isStale,
  };
}
