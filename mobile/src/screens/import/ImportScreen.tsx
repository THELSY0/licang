import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { collectsApi, parseApi } from '../../api';
import { CreateCollectParams, ParseResult } from '../../types';

// ==================== URL解析结果预览项 ====================

interface ImportItem {
  id: string;
  url: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  parseResult?: ParseResult;
  error?: string;
}

// ==================== Component ====================

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [hasClipboard, setHasClipboard] = useState(false);

  // ---- 检测剪贴板 ----
  useEffect(() => {
    checkClipboard();
  }, []);

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getString();
      if (content && content.trim().length > 0 && /https?:\/\/[^\s]+/.test(content)) {
        setHasClipboard(true);
      } else {
        setHasClipboard(false);
      }
    } catch {
      setHasClipboard(false);
    }
  };

  // ---- 从剪贴板导入 ----
  const importFromClipboard = async () => {
    try {
      const content = await Clipboard.getString();
      if (content) {
        setInputText(content);
        parseURLs(content);
      }
    } catch {
      Alert.alert('错误', '无法读取剪贴板');
    }
  };

  // ---- 解析输入文本中的URL ----
  const parseURLs = useCallback((text: string) => {
    const urlRegex = /https?:\/\/[^\s\n\r]+/g;
    const matches = text.match(urlRegex);

    if (!matches || matches.length === 0) {
      Alert.alert('提示', '未检测到有效的URL链接');
      return;
    }

    const newItems: ImportItem[] = matches.map((url, index) => ({
      id: `import-${Date.now()}-${index}`,
      url: url.trim(),
      status: 'pending' as const,
    }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // ---- 批量解析所有URL ----
  const parseAllMutation = useMutation({
    mutationFn: async (targetItems: ImportItem[]) => {
      const results = await Promise.allSettled(
        targetItems.map((item) => parseApi.parseUrl(item.url)),
      );
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return { id: targetItems[index].id, parseResult: result.value, status: 'ready' as const };
        }
        return {
          id: targetItems[index].id,
          status: 'failed' as const,
          error: result.reason?.message || '解析失败',
        };
      });
    },
    onSuccess: (updates) => {
      setItems((prev) =>
        prev.map((item) => {
          const update = updates.find((u) => u.id === item.id);
          if (update) {
            return { ...item, ...update };
          }
          return item;
        }),
      );
    },
  });

  // ---- 开始解析 ----
  const startParsing = useCallback(() => {
    const pendingItems = items.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.status === 'pending' ? { ...item, status: 'parsing' as const } : item,
      ),
    );

    parseAllMutation.mutate(pendingItems);
  }, [items, parseAllMutation]);

  // ---- 批量导入 ----
  const batchImportMutation = useMutation({
    mutationFn: async () => {
      const readyItems = items.filter(
        (item) => item.status === 'ready' && item.parseResult,
      );
      const collectParams: CreateCollectParams[] = readyItems.map((item) => ({
        url: item.url,
        title: item.parseResult!.title || item.url,
        description: item.parseResult!.description,
        type: item.parseResult!.type,
        coverUrl: item.parseResult!.coverUrl,
        content: item.parseResult!.content,
      }));
      return collectsApi.batchImportCollects(collectParams);
    },
    onSuccess: (result) => {
      Alert.alert('导入成功', `成功导入 ${result.length} 条收藏`, [
        {
          text: '查看',
          onPress: () => {
            setItems([]);
            setInputText('');
            navigation.navigate('HomeTab');
          },
        },
        { text: '继续导入', onPress: () => setItems([]) },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('导入失败', err?.message || '请稍后重试');
    },
  });

  // ---- 移除一个导入项 ----
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ---- 清空所有 ----
  const clearAll = useCallback(() => {
    setItems([]);
    setInputText('');
  }, []);

  // ---- 渲染导入项 ----
  const renderItem = ({ item }: { item: ImportItem }) => (
    <View style={styles.importItem}>
      <View style={styles.itemHeader}>
        <View style={styles.itemStatusRow}>
          {/* 状态图标 */}
          {item.status === 'pending' && (
            <View style={styles.statusPending}>
              <Ionicons name="time-outline" size={16} color="#FA8C16" />
              <Text style={styles.statusTextPending}>待解析</Text>
            </View>
          )}
          {item.status === 'parsing' && (
            <View style={styles.statusParsing}>
              <ActivityIndicator size="small" color="#1890FF" />
              <Text style={styles.statusTextParsing}>解析中</Text>
            </View>
          )}
          {item.status === 'ready' && (
            <View style={styles.statusReady}>
              <Ionicons name="checkmark-circle" size={16} color="#52C41A" />
              <Text style={styles.statusTextReady}>就绪</Text>
            </View>
          )}
          {item.status === 'failed' && (
            <View style={styles.statusFailed}>
              <Ionicons name="close-circle" size={16} color="#FF4D4F" />
              <Text style={styles.statusTextFailed}>失败</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#BFBFBF" />
        </TouchableOpacity>
      </View>

      {/* URL */}
      <Text style={styles.itemUrl} numberOfLines={1}>
        {item.url}
      </Text>

      {/* 解析结果预览 */}
      {item.parseResult && (
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.parseResult.title || '未知标题'}
        </Text>
      )}

      {/* 错误信息 */}
      {item.error && <Text style={styles.itemError}>{item.error}</Text>}
    </View>
  );

  // ---- 统计 ----
  const readyCount = items.filter((i) => i.status === 'ready').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const parsingCount = items.filter((i) => i.status === 'parsing').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部栏 ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>导入收藏</Text>
        <Text style={styles.headerSubtitle}>支持批量导入多个链接</Text>
      </View>

      {/* ---- 输入区 ---- */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="粘贴URL链接，每行一个…"
            placeholderTextColor="#BFBFBF"
            multiline
            value={inputText}
            onChangeText={setInputText}
            textAlignVertical="top"
          />
        </View>

        {/* 操作按钮行 */}
        <View style={styles.inputActions}>
          {/* 从剪贴板导入 */}
          {hasClipboard && (
            <TouchableOpacity style={styles.actionBtn} onPress={importFromClipboard}>
              <Ionicons name="clipboard-outline" size={16} color="#1890FF" />
              <Text style={styles.actionBtnText}>读取剪贴板</Text>
            </TouchableOpacity>
          )}

          {/* 解析URL */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => parseURLs(inputText)}
          >
            <Ionicons name="scan-outline" size={16} color="#FFF" />
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              解析链接
            </Text>
          </TouchableOpacity>

          {/* 清空 */}
          {items.length > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={16} color="#FF4D4F" />
              <Text style={[styles.actionBtnText, { color: '#FF4D4F' }]}>清空</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ---- 列表 ----
      {/* ---- 导入项列表 ---- */}
      {items.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              待导入 ({items.length})
            </Text>

            {/* 批量操作按钮 */}
            <View style={styles.listActions}>
              {pendingCount > 0 && (
                <TouchableOpacity
                  style={styles.batchBtn}
                  onPress={startParsing}
                  disabled={parsingCount > 0}
                >
                  <Ionicons name="rocket-outline" size={14} color="#1890FF" />
                  <Text style={styles.batchBtnText}>解析全部</Text>
                </TouchableOpacity>
              )}

              {readyCount > 0 && (
                <TouchableOpacity
                  style={[styles.batchBtn, styles.batchBtnImport]}
                  onPress={() => batchImportMutation.mutate()}
                  disabled={batchImportMutation.isPending}
                >
                  {batchImportMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={14} color="#FFF" />
                      <Text style={[styles.batchBtnText, { color: '#FFF' }]}>
                        导入 {readyCount} 项
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* ---- 空引导 ---- */}
      {items.length === 0 && (
        <View style={styles.emptyGuide}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="link-outline" size={48} color="#D9D9D9" />
          </View>
          <Text style={styles.emptyTitle}>粘贴链接开始导入</Text>
          <Text style={styles.emptySubtitle}>
            支持文章、视频、图片等任意网页链接{'\n'}多行粘贴自动批量导入
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8C8C8C',
    marginTop: 4,
  },

  // ---- 输入区 ----
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 12,
  },
  textInput: {
    minHeight: 80,
    maxHeight: 160,
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    gap: 4,
  },
  actionBtnPrimary: {
    backgroundColor: '#1890FF',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1890FF',
  },
  actionBtnTextPrimary: {
    color: '#FFF',
  },

  // ---- 列表区 ----
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F0F5FF',
    gap: 3,
  },
  batchBtnImport: {
    backgroundColor: '#1890FF',
  },
  batchBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1890FF',
  },
  listContent: {
    paddingBottom: 24,
    gap: 8,
  },

  // ---- 导入项 ----
  importItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusTextPending: { fontSize: 12, color: '#FA8C16', fontWeight: '500' },
  statusParsing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusTextParsing: { fontSize: 12, color: '#1890FF', fontWeight: '500' },
  statusReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusTextReady: { fontSize: 12, color: '#52C41A', fontWeight: '500' },
  statusFailed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusTextFailed: { fontSize: 12, color: '#FF4D4F', fontWeight: '500' },
  itemUrl: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  itemError: {
    fontSize: 12,
    color: '#FF4D4F',
  },

  // ---- 空引导 ----
  emptyGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#595959',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 20,
  },
});
