import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  SafeAreaView,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { collectsApi } from '../../api';
import { Collect, CollectType } from '../../types';
import { formatRelativeTime } from '../../utils/time';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ==================== 视频类型判断 ====================

function isVideoUrl(url: string): boolean {
  const videoPatterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /bilibili\.com\/video/i,
    /vimeo\.com\//i,
    /\.(mp4|webm|mov|avi)(\?|$)/i,
  ];
  return videoPatterns.some((pattern) => pattern.test(url));
}

// ==================== 获取嵌入式URL ====================

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }

  // Bilibili
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biliMatch) {
    return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&autoplay=1`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

// ==================== 简易MD渲染 (仅基础) ====================

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 标题
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#{1,6}/)![0].length;
      const content = line.replace(/^#{1,6}\s/, '');
      const size = [26, 22, 18, 16, 14, 13][level - 1] || 14;
      elements.push(
        <Text key={key++} style={[styles.mdHeading, { fontSize: size, marginTop: level <= 2 ? 16 : 12 }]}>
          {content}
        </Text>,
      );
      continue;
    }

    // 空行
    if (line.trim() === '') {
      elements.push(<View key={key++} style={{ height: 10 }} />);
      continue;
    }

    // 列表项
    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const content = line.replace(/^[-*+]\s|\d+\.\s/, '');
      elements.push(
        <View key={key++} style={styles.mdListItem}>
          <Text style={styles.mdListBullet}>•</Text>
          <Text style={styles.mdListText}>{content}</Text>
        </View>,
      );
      continue;
    }

    // 普通段落 (带简单行内样式)
    elements.push(
      <Text key={key++} style={styles.mdParagraph}>
        {parseInlineMarkdown(line)}
      </Text>,
    );
  }

  return elements;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // 加粗 **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  let lastIndex = 0;

  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }
    parts.push(
      <Text key={key++} style={{ fontWeight: '700' }}>{match[1]}</Text>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts;
}

// ==================== DetailScreen ====================

export default function DetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: { collectId: number } }>>();
  const queryClient = useQueryClient();
  const collectId = route.params?.collectId;

  const [showWebView, setShowWebView] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(false);

  // ---- 查询收藏详情 ----
  const {
    data: collect,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collect', collectId],
    queryFn: () => collectsApi.getCollectById(collectId),
    enabled: !!collectId,
  });

  // ---- 标记已读 ----
  const markReadMutation = useMutation({
    mutationFn: () => collectsApi.updateReadStatus(collectId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collect', collectId] });
      queryClient.invalidateQueries({ queryKey: ['collects'] });
    },
  });

  // 进入时自动标记已读
  React.useEffect(() => {
    if (collect && !collect.isRead) {
      markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collect?.id]);

  // ---- 分享 ----
  const handleShare = useCallback(async () => {
    if (!collect) return;
    try {
      await Share.share({
        title: collect.title,
        message: `${collect.title}\n${collect.url}`,
        url: collect.url,
      });
    } catch {}
  }, [collect]);

  // ---- 在浏览器打开 ----
  const handleOpenInBrowser = useCallback(() => {
    if (collect?.url) {
      Linking.openURL(collect.url);
    }
  }, [collect]);

  // ---- 删除 ----
  const deleteMutation = useMutation({
    mutationFn: () => collectsApi.deleteCollect(collectId),
    onSuccess: () => {
      Alert.alert('已删除', '', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
      queryClient.invalidateQueries({ queryKey: ['collects'] });
    },
    onError: (err: any) => {
      Alert.alert('删除失败', err?.message || '请稍后重试');
    },
  });

  const handleDelete = useCallback(() => {
    Alert.alert('删除收藏', '确定要删除这条收藏吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  }, [deleteMutation]);

  // ---- 加载中 ----
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890FF" />
        </View>
      </SafeAreaView>
    );
  }

  // ---- 出错 ----
  if (error || !collect) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4D4F" />
          <Text style={styles.errorText}>无法加载收藏</Text>
          <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBackText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isVideo = collect.type === 'video' || isVideoUrl(collect.url);
  const embedUrl = getEmbedUrl(collect.url);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部导航栏 ---- */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBtn}>
          <Ionicons name="arrow-back" size={22} color="#262626" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {collect.title}
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={handleShare} style={styles.topBarBtn}>
            <Ionicons name="share-outline" size={22} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.topBarBtn}>
            <Ionicons name="trash-outline" size={22} color="#FF4D4F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- 封面图 ---- */}
        {collect.coverUrl && !showWebView && (
          <Image
            source={{ uri: collect.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* ---- 标题区 ---- */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{collect.title}</Text>

          {/* 元信息 */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#8C8C8C" />
              <Text style={styles.metaText}>{formatRelativeTime(collect.createdAt)}</Text>
            </View>
            {collect.source && (
              <View style={styles.metaItem}>
                <Ionicons name="globe-outline" size={14} color="#8C8C8C" />
                <Text style={styles.metaText}>{collect.source}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#8C8C8C" />
              <Text style={styles.metaText}>{collect.readCount} 次阅读</Text>
            </View>
          </View>

          {/* 分类 & 标签 */}
          <View style={styles.tagRow}>
            {collect.categoryId && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>分类 #{collect.categoryId}</Text>
              </View>
            )}
            {collect.tags.map((tag) => (
              <View key={tag.id} style={[styles.tagChip, { backgroundColor: (tag.color || '#1890FF') + '15' }]}>
                <Text style={[styles.tagChipText, { color: tag.color || '#1890FF' }]}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---- 操作按钮 ---- */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleOpenInBrowser}>
            <Ionicons name="open-outline" size={16} color="#1890FF" />
            <Text style={styles.actionBtnText}>浏览器打开</Text>
          </TouchableOpacity>

          {collect.type !== 'note' && !isVideo && (
            <TouchableOpacity
              style={[styles.actionBtn, showWebView && styles.actionBtnActive]}
              onPress={() => setShowWebView(!showWebView)}
            >
              <Ionicons
                name={showWebView ? 'text-outline' : 'globe-outline'}
                size={16}
                color={showWebView ? '#FFF' : '#1890FF'}
              />
              <Text style={[styles.actionBtnText, showWebView && styles.actionBtnTextActive]}>
                {showWebView ? '查看摘要' : '查看原文'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---- 视频播放 (嵌入式) ---- */}
        {isVideo && embedUrl && (
          <View style={styles.videoContainer}>
            <WebView
              source={{ uri: embedUrl }}
              style={styles.videoWebView}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
            />
          </View>
        )}

        {/* ---- 原文 WebView ---- */}
        {showWebView && collect.url && !isVideo && (
          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: collect.url }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoader}>
                  <ActivityIndicator size="large" color="#1890FF" />
                </View>
              )}
            />
          </View>
        )}

        {/* ---- 摘要 / 正文 ---- */}
        {!showWebView && (
          <View style={styles.contentSection}>
            {/* 描述 */}
            {collect.description ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.sectionTitle}>简介</Text>
                <Text style={styles.descriptionText}>{collect.description}</Text>
              </View>
            ) : null}

            {/* 正文内容 — 如果有content则渲染 */}
            {collect.content ? (
              <View style={styles.contentBlock}>
                <Text style={styles.sectionTitle}>正文</Text>
                <View style={styles.mdContainer}>
                  {renderMarkdown(collect.content)}
                </View>
              </View>
            ) : null}

            {/* URL */}
            {collect.url && (
              <View style={styles.urlBlock}>
                <Text style={styles.sectionTitle}>链接</Text>
                <TouchableOpacity onPress={handleOpenInBrowser}>
                  <Text style={styles.urlText} numberOfLines={2}>
                    {collect.url}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 没有内容时的空状态 */}
            {!collect.description && !collect.content && !isVideo && (
              <View style={styles.noContent}>
                <Ionicons name="document-text-outline" size={40} color="#D9D9D9" />
                <Text style={styles.noContentText}>
                  暂无摘要内容
                </Text>
                <TouchableOpacity
                  style={styles.viewOriginalBtn}
                  onPress={() => {
                    if (collect.url) setShowWebView(true);
                    else handleOpenInBrowser();
                  }}
                >
                  <Text style={styles.viewOriginalText}>查看原文</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ---- 顶部导航栏 ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  topBarActions: {
    flexDirection: 'row',
  },

  // ---- 滚动 ----
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ---- 封面 ----
  coverImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.56,
    backgroundColor: '#F5F5F5',
  },

  // ---- 标题区 ----
  titleSection: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#1890FF',
    fontWeight: '500',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ---- 操作按钮 ----
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
    gap: 5,
  },
  actionBtnActive: {
    backgroundColor: '#1890FF',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1890FF',
  },
  actionBtnTextActive: {
    color: '#FFF',
  },

  // ---- 视频 ----
  videoContainer: {
    marginHorizontal: 0,
    height: 240,
    backgroundColor: '#000',
  },
  videoWebView: {
    flex: 1,
  },

  // ---- WebView ----
  webViewContainer: {
    height: 500,
    marginTop: 8,
  },
  webView: {
    flex: 1,
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // ---- 内容区 ----
  contentSection: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 6,
  },
  descriptionBlock: {},
  descriptionText: {
    fontSize: 14,
    color: '#595959',
    lineHeight: 22,
  },
  contentBlock: {},
  urlBlock: {},
  urlText: {
    fontSize: 13,
    color: '#1890FF',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },

  // ---- MD渲染 ----
  mdContainer: {
    gap: 2,
  },
  mdHeading: {
    fontWeight: '700',
    color: '#262626',
    lineHeight: 30,
  },
  mdParagraph: {
    fontSize: 15,
    color: '#262626',
    lineHeight: 24,
  },
  mdListItem: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  mdListBullet: {
    fontSize: 15,
    color: '#8C8C8C',
    lineHeight: 24,
  },
  mdListText: {
    fontSize: 15,
    color: '#262626',
    lineHeight: 24,
    flex: 1,
  },

  // ---- 无内容 ----
  noContent: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  noContentText: {
    fontSize: 14,
    color: '#BFBFBF',
  },
  viewOriginalBtn: {
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewOriginalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1890FF',
  },

  // ---- 加载 / 错误 ----
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#595959',
  },
  errorBackBtn: {
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1890FF',
  },
});
