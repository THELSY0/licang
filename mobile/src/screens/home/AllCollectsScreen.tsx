import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import CollectCard from '../../components/CollectCard';
import { collectsApi } from '../../api';
import { Collect, CollectType } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FILTER_ITEMS: Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'all', label: '全部', icon: 'apps-outline' },
  { key: 'article', label: '文章', icon: 'document-text-outline' },
  { key: 'video', label: '视频', icon: 'videocam-outline' },
  { key: 'image', label: '图片', icon: 'image-outline' },
  { key: 'link', label: '链接', icon: 'link-outline' },
  { key: 'note', label: '笔记', icon: 'document-outline' },
];

// ==================== Component ====================

export default function AllCollectsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // ---- 无限查询: 分页获取收藏 ----
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['collects', selectedFilter],
    queryFn: ({ pageParam = 1 }) =>
      collectsApi.getCollects(pageParam, 20, {
        type: selectedFilter === 'all' ? undefined : (selectedFilter as CollectType),
        status: 'active',
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  // 展平所有页面的items
  const allCollects: Collect[] = data?.pages.flatMap((page) => page.items) ?? [];

  // ---- 下拉刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ---- 触底加载更多 ----
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---- 收藏卡片事件 ----
  const handlePress = useCallback(
    (collect: Collect) => {
      navigation.navigate('Detail', { collectId: collect.id });
    },
    [navigation],
  );

  const handleToggleTop = useCallback(
    async (collect: Collect) => {
      try {
        await collectsApi.toggleTop(collect.id, !collect.isTop);
        queryClient.invalidateQueries({ queryKey: ['collects'] });
      } catch {}
    },
    [queryClient],
  );

  const handleToggleRead = useCallback(
    async (collect: Collect) => {
      try {
        await collectsApi.updateReadStatus(collect.id, !collect.isRead);
        queryClient.invalidateQueries({ queryKey: ['collects'] });
      } catch {}
    },
    [queryClient],
  );

  // ---- 筛选栏 ----
  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_ITEMS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const isActive = selectedFilter === item.key;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={isActive ? '#1890FF' : '#8C8C8C'}
              />
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // ---- 空状态 ----
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="bookmark-outline" size={56} color="#D9D9D9" />
        </View>
        <Text style={styles.emptyTitle}>暂无收藏</Text>
        <Text style={styles.emptySubtitle}>点击右下角 + 添加你的第一条收藏</Text>
      </View>
    );
  };

  // ---- 底部加载指示器 ----
  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#1890FF" />
          <Text style={styles.footerText}>加载更多...</Text>
        </View>
      );
    }
    if (!hasNextPage && allCollects.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerText}>已经到底了</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderFilterBar()}

      <FlatList
        data={allCollects}
        renderItem={({ item }) => (
          <CollectCard
            collect={item}
            onPress={handlePress}
            onToggleTop={handleToggleTop}
            onToggleRead={handleToggleRead}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          allCollects.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1890FF"
            colors={['#1890FF']}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // ---- 筛选栏 ----
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#E6F7FF',
  },
  filterLabel: {
    fontSize: 13,
    color: '#8C8C8C',
    fontWeight: '500',
  },
  filterLabelActive: {
    color: '#1890FF',
    fontWeight: '600',
  },

  // ---- 列表 ----
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
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
  },

  // ---- 底部 ----
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerEnd: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#BFBFBF',
  },
});
