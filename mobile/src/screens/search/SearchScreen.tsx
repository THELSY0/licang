import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { searchApi, collectsApi } from '../../api';
import { Collect, SearchParams } from '../../types';
import CollectCard from '../../components/CollectCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ==================== 高亮文本组件 ====================

function HighlightedText({
  text,
  keyword,
  style,
}: {
  text: string;
  keyword: string;
  style?: any;
}) {
  if (!keyword.trim()) {
    return <Text style={style} numberOfLines={2}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'));

  return (
    <Text style={style} numberOfLines={2}>
      {parts.map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <Text key={index} style={styles.highlight}>{part}</Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== Component ====================

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ---- 搜索建议 ----
  const { data: suggestions = [] } = useQuery({
    queryKey: ['searchSuggestions', keyword],
    queryFn: () => searchApi.getSearchSuggestions(keyword),
    enabled: keyword.trim().length >= 1,
    staleTime: 30_000,
  });

  // ---- 搜索结果 (无限分页) ----
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['search', searchKeyword],
    queryFn: ({ pageParam = 1 }) =>
      searchApi.searchCollects(searchKeyword, pageParam, 20),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: searchKeyword.trim().length > 0,
  });

  const results: Collect[] = data?.pages.flatMap((page) => page.items) ?? [];

  // ---- 搜索提交 ----
  const handleSearch = useCallback(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchKeyword(trimmed);
    inputRef.current?.blur();
  }, [keyword]);

  // ---- 选建议词 ----
  const selectSuggestion = useCallback((suggestion: string) => {
    setKeyword(suggestion);
    setSearchKeyword(suggestion);
    inputRef.current?.blur();
  }, []);

  // ---- 清除 ----
  const clearSearch = useCallback(() => {
    setKeyword('');
    setSearchKeyword('');
    inputRef.current?.focus();
  }, []);

  // ---- 下拉刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ---- 触底加载 ----
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---- 点击收藏 ----
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
        queryClient.invalidateQueries({ queryKey: ['search'] });
      } catch {}
    },
    [queryClient],
  );

  const handleToggleRead = useCallback(
    async (collect: Collect) => {
      try {
        await collectsApi.updateReadStatus(collect.id, !collect.isRead);
        queryClient.invalidateQueries({ queryKey: ['search'] });
      } catch {}
    },
    [queryClient],
  );

  // ---- 搜索结果渲染 ----
  const renderItem = useCallback(
    ({ item }: { item: Collect }) => {
      // 自定义渲染 — 带高亮的标题
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress(item)}
        >
          <View style={styles.resultItem}>
            <View style={styles.resultIconContainer}>
              <Ionicons
                name={
                  item.type === 'article'
                    ? 'document-text-outline'
                    : item.type === 'video'
                    ? 'videocam-outline'
                    : item.type === 'image'
                    ? 'image-outline'
                    : 'link-outline'
                }
                size={22}
                color="#1890FF"
              />
            </View>
            <View style={styles.resultContent}>
              <HighlightedText
                text={item.title}
                keyword={searchKeyword}
                style={styles.resultTitle}
              />
              {item.excerpt && (
                <HighlightedText
                  text={item.excerpt}
                  keyword={searchKeyword}
                  style={styles.resultExcerpt}
                />
              )}
              <Text style={styles.resultUrl} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress, searchKeyword],
  );

  const resultsCount = data?.pages[0]?.total ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 搜索栏 ---- */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={18} color="#BFBFBF" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="搜索收藏、标签、链接..."
            placeholderTextColor="#BFBFBF"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#BFBFBF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ---- 搜索提示词 ---- */}
      {searchKeyword === '' && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>搜索建议</Text>
          <View style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion}-${index}`}
                style={styles.suggestionChip}
                onPress={() => selectSuggestion(suggestion)}
              >
                <Ionicons name="trending-up" size={14} color="#8C8C8C" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ---- 搜索结果 ---- */}
      {searchKeyword !== '' && (
        <View style={styles.resultContainer}>
          {/* 结果统计 */}
          {!isLoading && (
            <View style={styles.resultStats}>
              <Text style={styles.resultStatsText}>
                找到 {resultsCount} 条与「{searchKeyword}」相关的结果
              </Text>
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.resultStatsClear}>清除</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.resultList,
              results.length === 0 && styles.resultListEmpty,
            ]}
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
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1890FF" />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#D9D9D9" />
                  <Text style={styles.emptyText}>未找到相关收藏</Text>
                  <Text style={styles.emptySubtext}>换个关键词试试</Text>
                </View>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#1890FF" />
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* ---- 初始空状态 ---- */}
      {searchKeyword === '' && suggestions.length === 0 && (
        <View style={styles.initialEmpty}>
          <Ionicons name="search" size={56} color="#E8E8E8" />
          <Text style={styles.initialEmptyTitle}>搜索收藏</Text>
          <Text style={styles.initialEmptySubtitle}>
            输入关键词搜索你的收藏{'\n'}支持标题、标签、链接搜索
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ---- 搜索栏 ----
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#262626',
    paddingVertical: 0,
  },

  // ---- 搜索建议 ----
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595959',
    marginBottom: 10,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#595959',
  },

  // ---- 搜索结果 ----
  resultContainer: {
    flex: 1,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  resultStatsText: {
    fontSize: 13,
    color: '#8C8C8C',
  },
  resultStatsClear: {
    fontSize: 13,
    color: '#1890FF',
    fontWeight: '500',
  },
  resultList: {
    paddingVertical: 8,
  },
  resultListEmpty: {
    flexGrow: 1,
  },

  // ---- 搜索结果项 ----
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 3,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    lineHeight: 20,
  },
  resultExcerpt: {
    fontSize: 13,
    color: '#595959',
    lineHeight: 18,
  },
  resultUrl: {
    fontSize: 12,
    color: '#BFBFBF',
  },

  // ---- 高亮 ----
  highlight: {
    backgroundColor: '#FFFBE6',
    color: '#FA8C16',
    fontWeight: '600',
  },

  // ---- 空 / 初始 ----
  initialEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  initialEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#595959',
  },
  initialEmptySubtitle: {
    fontSize: 14,
    color: '#BFBFBF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8C8C8C',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BFBFBF',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
