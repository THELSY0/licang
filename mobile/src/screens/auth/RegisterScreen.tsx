import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import * as authApi from '../../api/auth';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
  const { register } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const isCodeValid = code.length === 6;
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = password === confirmPassword && password.length > 0;
  const canSubmit = isPhoneValid && isCodeValid && isPasswordValid && isConfirmValid && !submitting;

  const handleSendCode = async () => {
    if (!isPhoneValid || sendingCode) return;
    setSendingCode(true);
    try {
      await authApi.sendSmsCode(phone.trim());
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || '发送验证码失败';
      Alert.alert('提示', message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await register(phone.trim(), code.trim(), password);
      // 成功后自动跳转主页
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || '注册失败，请重试';
      Alert.alert('注册失败', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{'< 返回'}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>注册账号</Text>
          <Text style={styles.subtitle}>创建栗藏账号，开启收藏之旅</Text>
        </View>

        <View style={styles.form}>
          {/* 手机号 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>手机号</Text>
            <TextInput
              style={[styles.input, !isPhoneValid && phone.length > 0 && styles.inputError]}
              placeholder="请输入手机号"
              placeholderTextColor="#BFBFBF"
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* 验证码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>验证码</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput, !isCodeValid && code.length > 0 && styles.inputError]}
                placeholder="6位验证码"
                placeholderTextColor="#BFBFBF"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity
                style={[styles.codeButton, (!isPhoneValid || countdown > 0) && styles.codeButtonDisabled]}
                onPress={handleSendCode}
                disabled={!isPhoneValid || sendingCode || countdown > 0}
                activeOpacity={0.8}
              >
                {sendingCode ? (
                  <ActivityIndicator color="#1890FF" size="small" />
                ) : (
                  <Text style={[styles.codeButtonText, countdown > 0 && styles.codeButtonTextDisabled]}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>设置密码</Text>
            <TextInput
              style={[styles.input, !isPasswordValid && password.length > 0 && styles.inputError]}
              placeholder="至少6位密码"
              placeholderTextColor="#BFBFBF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* 确认密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>确认密码</Text>
            <TextInput
              style={[styles.input, !isConfirmValid && confirmPassword.length > 0 && styles.inputError]}
              placeholder="再次输入密码"
              placeholderTextColor="#BFBFBF"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {!isConfirmValid && confirmPassword.length > 0 && (
              <Text style={styles.errorText}>两次密码输入不一致</Text>
            )}
          </View>

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.registerButton, !canSubmit && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={!canSubmit || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>注册</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            已有账号?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              立即登录
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#1890FF',
    fontWeight: '500',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8C8C8C',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#595959',
  },
  input: {
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputError: {
    borderColor: '#FF4D4F',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D4F',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
  },
  codeButton: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  codeButtonDisabled: {
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1890FF',
  },
  codeButtonTextDisabled: {
    color: '#BFBFBF',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#1890FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#91D5FF',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  footerLink: {
    color: '#1890FF',
    fontWeight: '600',
  },
});
