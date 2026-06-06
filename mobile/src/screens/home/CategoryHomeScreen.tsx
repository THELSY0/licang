import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { categoriesApi } from '../../api';
import { Category } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_PADDING = 16;
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;

// ==================== Category Emoji Map ====================

const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  default: { icon: 'folder-outline', color: '#1890FF' },
};

function getCategoryVisual(icon: string | undefined) {
  if (!icon) return CATEGORY_ICONS.default;
  // 如果是emoji 直接返回文本
  if (/^[\u{1F000}-\u{1FFFF}]/u.test(icon)) {
    return { emoji: icon, color: '#1890FF' };
  }
  return { icon: icon as keyof typeof Ionicons.glyphMap, color: '#1890FF' };
}

// ==================== Component ====================

export default function CategoryHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // ---- 获取分类列表 ----
  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  // ---- 下拉刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ---- 渲染分类网格项 ----
  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const visual = getCategoryVisual(item.icon);

      return (
        <Pressable
          style={({ pressed }) => [
            styles.categoryCard,
            pressed && styles.categoryCardPressed,
          ]}
          onPress={() => {
            // 导航到分类筛选列表 (后续实现)
            navigation.navigate('HomeTab', {
              screen: 'CategoryCollects',
              params: { categoryId: item.id, categoryName: item.name },
            });
          }}
        >
          {/* 图标 */}
          <View style={[styles.categoryIconContainer, { backgroundColor: (item.color || '#1890FF') + '15' }]}>
            {'emoji' in visual ? (
              <Text style={styles.categoryEmoji}>{visual.emoji}</Text>
            ) : (
              <Ionicons
                name={(visual as any).icon}
                size={28}
                color={item.color || '#1890FF'}
              />
            )}
          </View>

          {/* 名称 */}
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>

          {/* 数量 */}
          <Text style={styles.categoryCount}>{item.collectCount} 条收藏</Text>
        </Pressable>
      );
    },
    [navigation],
  );

  // ---- 空状态 ----
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="folder-open-outline" size={56} color="#D9D9D9" />
        </View>
        <Text style={styles.emptyTitle}>暂无分类</Text>
        <Text style={styles.emptySubtitle}>创建你的第一个分类，开始整理收藏</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            // TODO: 导航到创建分类
          }}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.emptyButtonText}>创建分类</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部栏 ---- */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.greeting}>我的收藏</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // TODO: 快速创建收藏
            }}
          >
            <Ionicons name="add" size={24} color="#1890FF" />
          </TouchableOpacity>
        </View>

        {/* 搜索栏 */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('SearchTab');
          }}
        >
          <Ionicons name="search" size={18} color="#BFBFBF" />
          <Text style={styles.searchPlaceholder}>搜索收藏、标签...</Text>
        </TouchableOpacity>
      </View>

      {/* ---- 分类网格 ---- */}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.gridContent,
          categories.length === 0 && styles.gridContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1890FF"
            colors={['#1890FF']}
          />
        }
      />
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // ---- 顶部栏 ----
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- 搜索栏 ----
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#BFBFBF',
  },

  // ---- 分类网格 ----
  gridContent: {
    padding: GRID_PADDING,
    paddingBottom: 32,
  },
  gridContentEmpty: {
    flexGrow: 1,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  // ---- 分类卡片 ----
  categoryCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    // 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardPressed: {
    opacity: 0.8,
    shadowOpacity: 0.02,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: '#8C8C8C',
  },

  // ---- 空状态 ----
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#595959',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1890FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
    marginTop: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
