import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>栗藏</Text>
      <Text style={styles.subtitle}>测试页面 - 如果看到此页面，底层运行正常</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1890FF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
});
