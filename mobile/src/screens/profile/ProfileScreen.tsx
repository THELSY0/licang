import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

// ==================== 菜单项定义 ====================

interface MenuSection {
  title: string;
  items: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    label: string;
    badge?: string;
    onPress: () => void;
  }>;
}

// ==================== Component ====================

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  // ---- 登出 ----
  const handleLogout = useCallback(() => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  }, [logout]);

  // ---- 菜单配置 ----
  const menuSections: MenuSection[] = [
    {
      title: '内容管理',
      items: [
        {
          icon: 'folder-open-outline',
          iconColor: '#1890FF',
          label: '分类管理',
          onPress: () => navigation.navigate('CategoryManage'),
        },
        {
          icon: 'pricetags-outline',
          iconColor: '#722ED1',
          label: '标签管理',
          onPress: () => navigation.navigate('TagManage'),
        },
        {
          icon: 'archive-outline',
          iconColor: '#FA8C16',
          label: '归档',
          badge: '0',
          onPress: () => {},
        },
      ],
    },
    {
      title: '数据管理',
      items: [
        {
          icon: 'cloud-upload-outline',
          iconColor: '#52C41A',
          label: '同步与备份',
          onPress: () => {},
        },
        {
          icon: 'download-outline',
          iconColor: '#13C2C2',
          label: '导入数据',
          onPress: () => navigation.navigate('ImportTab'),
        },
        {
          icon: 'share-outline',
          iconColor: '#EB2F96',
          label: '导出数据',
          onPress: () => {},
        },
      ],
    },
    {
      title: '设置',
      items: [
        {
          icon: 'settings-outline',
          iconColor: '#595959',
          label: '偏好设置',
          onPress: () => {},
        },
        {
          icon: 'notifications-outline',
          iconColor: '#595959',
          label: '通知设置',
          onPress: () => {},
        },
        {
          icon: 'shield-checkmark-outline',
          iconColor: '#595959',
          label: '隐私与安全',
          onPress: () => {},
        },
        {
          icon: 'information-circle-outline',
          iconColor: '#595959',
          label: '关于栗藏',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ---- 用户信息卡片 ---- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{user?.nickname || '未设置昵称'}</Text>
            <Text style={styles.phone}>{user?.phone || ''}</Text>
          </View>

          <TouchableOpacity style={styles.editProfileBtn}>
            <Ionicons name="create-outline" size={18} color="#1890FF" />
            <Text style={styles.editProfileText}>编辑</Text>
          </TouchableOpacity>
        </View>

        {/* ---- 统计卡片 ---- */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>分类</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>标签</Text>
          </View>
        </View>

        {/* ---- 菜单分组 ---- */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>

            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>

                  <Text style={styles.menuLabel}>{item.label}</Text>

                  <View style={styles.menuRight}>
                    {item.badge !== undefined && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#D9D9D9" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ---- 登出按钮 ---- */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4D4F" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* ---- 版本信息 ---- */}
        <Text style={styles.versionText}>栗藏 v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ---- 用户信息 ----
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  phone: {
    fontSize: 13,
    color: '#8C8C8C',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    gap: 3,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1890FF',
  },

  // ---- 统计 ----
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262626',
  },
  statLabel: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
  },

  // ---- 菜单 ----
  menuSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C8C8C',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#262626',
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  menuBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },

  // ---- 登出 ----
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF1F0',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF4D4F',
  },

  // ---- 版本 ----
  versionText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    color: '#D9D9D9',
  },
});
