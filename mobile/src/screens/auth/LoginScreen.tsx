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

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const { login, isLoading } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPhoneValid = /^1\d{10}$/.test(phone);
  const isPasswordValid = password.length >= 6;
  const canSubmit = isPhoneValid && isPasswordValid && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await login(phone.trim(), password);
      // 成功后 RootNavigator 会自动切换到 MainTabs
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || '登录失败，请重试';
      Alert.alert('登录失败', message);
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
        <View style={styles.header}>
          <Text style={styles.welcome}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录栗藏账号，同步你的收藏</Text>
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
              autoFocus
            />
            {!isPhoneValid && phone.length > 0 && (
              <Text style={styles.errorText}>请输入有效的11位手机号</Text>
            )}
          </View>

          {/* 密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={[styles.input, !isPasswordValid && password.length > 0 && styles.inputError]}
              placeholder="请输入密码 (至少6位)"
              placeholderTextColor="#BFBFBF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {!isPasswordValid && password.length > 0 && (
              <Text style={styles.errorText}>密码至少6位</Text>
            )}
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!canSubmit || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>登录</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 底部操作 */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>
              没有账号? <Text style={styles.footerLinkHighlight}>立即注册</Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    marginBottom: 40,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8C8C8C',
    lineHeight: 22,
  },
  form: {
    gap: 20,
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
  loginButton: {
    height: 50,
    backgroundColor: '#1890FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#91D5FF',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerLink: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  footerLinkHighlight: {
    color: '#1890FF',
    fontWeight: '600',
  },
});
