import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as authApi from '../api/auth';
import { setStoredTokens, clearStoredTokens } from '../api/client';

const TOKEN_KEY = '@licang:accessToken';
const REFRESH_TOKEN_KEY = '@licang:refreshToken';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  loginWithCode: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (phone: string, password: string) => {
    const tokens = await authApi.login(phone, password);
    await setStoredTokens(tokens.accessToken, tokens.refreshToken);
    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
    // 加载用户信息
    const user = await authApi.getUserInfo();
    set({ user });
  },

  register: async (phone: string, code: string, password: string) => {
    const tokens = await authApi.register(phone, code, password);
    await setStoredTokens(tokens.accessToken, tokens.refreshToken);
    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
    const user = await authApi.getUserInfo();
    set({ user });
  },

  loginWithCode: async (phone: string, code: string) => {
    const tokens = await authApi.loginWithCode(phone, code);
    await setStoredTokens(tokens.accessToken, tokens.refreshToken);
    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
    const user = await authApi.getUserInfo();
    set({ user });
  },

  logout: async () => {
    await clearStoredTokens();
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      set({ token, refreshToken });

      const user = await authApi.getUserInfo();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await clearStoredTokens();
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await setStoredTokens(accessToken, refreshToken);
    set({
      token: accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
