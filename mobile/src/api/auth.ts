import apiClient from './client';
import { ApiResponse, AuthTokens, User } from '../types';

/**
 * 注册
 * @param phone    手机号
 * @param code     短信验证码
 * @param password 密码
 */
export async function register(phone: string, code: string, password: string): Promise<AuthTokens> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/register', {
    phone,
    code,
    password,
  });
  return response.data.data;
}

/**
 * 密码登录
 */
export async function login(phone: string, password: string): Promise<AuthTokens> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', {
    phone,
    password,
  });
  return response.data.data;
}

/**
 * 短信验证码登录
 */
export async function loginWithCode(phone: string, code: string): Promise<AuthTokens> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login/code', {
    phone,
    code,
  });
  return response.data.data;
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/user/info');
  return response.data.data;
}

/**
 * 更新用户信息
 */
export async function updateUserInfo(data: Partial<User>): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>('/user/info', data);
  return response.data.data;
}

/**
 * 发送短信验证码
 */
export async function sendSmsCode(phone: string): Promise<void> {
  await apiClient.post('/auth/sms/code', { phone });
}

/**
 * 重置密码
 */
export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/password/reset', { phone, code, newPassword });
}
