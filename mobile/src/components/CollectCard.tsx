import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Collect, CollectType } from '../types';
import { formatRelativeTime } from '../utils/time';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const ACTION_WIDTH = 72;

// ==================== Type Icon Map ====================

const TYPE_ICON: Record<CollectType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  video: { name: 'play-circle', color: '#FF4D4F' },
  article: { name: 'document-text', color: '#1890FF' },
  image: { name: 'image', color: '#52C41A' },
  audio: { name: 'musical-notes', color: '#722ED1' },
  link: { name: 'globe', color: '#FA8C16' },
  note: { name: 'document', color: '#13C2C2' },
};

// ==================== Source Platform ====================

function extractSource(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts[0] : null;
  } catch {
    return null;
  }
}

// ==================== Props ====================

interface CollectCardProps {
  collect: Collect;
  onPress: (collect: Collect) => void;
  onLongPress?: (collect: Collect) => void;
  onToggleTop?: (collect: Collect) => void;
  onToggleRead?: (collect: Collect) => void;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onSelect?: (collect: Collect) => void;
}

// ==================== Component ====================

export default function CollectCard({
  collect,
  onPress,
  onLongPress,
  onToggleTop,
  onToggleRead,
  isBatchMode = false,
  isSelected = false,
  onSelect,
}: CollectCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const iconInfo = TYPE_ICON[collect.type] ?? TYPE_ICON.link;
  const source = collect.source ?? extractSource(collect.url);
  const relativeTime = formatRelativeTime(collect.createdAt);

  // ---- 左滑操作渲染 ----
  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [-ACTION_WIDTH * 2, 0],
        outputRange: [0, ACTION_WIDTH * 2],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.swipeActionsContainer}>
          {/* 置顶 */}
          <Animated.View style={[styles.swipeActionWrapper, { transform: [{ translateX }] }]}>
            <TouchableOpacity
              style={[styles.swipeAction, styles.swipeActionTop]}
              onPress={() => {
                swipeableRef.current?.close();
                onToggleTop?.(collect);
              }}
            >
              <Ionicons
                name={collect.isTop ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.swipeActionText}>{collect.isTop ? '取消置顶' : '置顶'}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* 已读/未读 */}
          <Animated.View style={[styles.swipeActionWrapper, { transform: [{ translateX }] }]}>
            <TouchableOpacity
              style={[
                styles.swipeAction,
                collect.isRead ? styles.swipeActionUnread : styles.swipeActionRead,
              ]}
              onPress={() => {
                swipeableRef.current?.close();
                onToggleRead?.(collect);
              }}
            >
              <Ionicons
                name={collect.isRead ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.swipeActionText}>
                {collect.isRead ? '未读' : '已读'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [collect, onToggleTop, onToggleRead],
  );

  // ---- 主卡片渲染 ----
  const renderCard = () => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isBatchMode && styles.cardBatch,
        isSelected && styles.cardSelected,
        pressed && !isBatchMode && styles.cardPressed,
      ]}
      onPress={() => {
        if (isBatchMode) {
          onSelect?.(collect);
        } else {
          onPress(collect);
        }
      }}
      onLongPress={() => {
        if (isBatchMode) return;
        if (onLongPress) {
          onLongPress(collect);
        } else {
          // 默认进入批量模式 — 选中当前
          onSelect?.(collect);
        }
      }}
      delayLongPress={400}
    >
      {/* ---- 封面图区域 ---- */}
      <View style={styles.coverContainer}>
        {collect.coverUrl ? (
          <Image
            source={{ uri: collect.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: iconInfo.color + '20' }]}>
            <Ionicons name={iconInfo.name} size={40} color={iconInfo.color} />
          </View>
        )}

        {/* 类型角标 */}
        <View style={[styles.typeBadge, { backgroundColor: iconInfo.color + 'E6' }]}>
          <Ionicons name={iconInfo.name} size={12} color="#FFF" />
        </View>

        {/* 已读灰色蒙层 */}
        {collect.isRead && <View style={styles.readOverlay} />}

        {/* 批量选择复选框 */}
        {isBatchMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
          </View>
        )}

        {/* 置顶标记 */}
        {collect.isTop && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>📌 置顶</Text>
          </View>
        )}
      </View>

      {/* ---- 信息区域 ---- */}
      <View style={styles.infoContainer}>
        {/* 标题 */}
        <Text style={styles.title} numberOfLines={2}>
          {collect.title}
        </Text>

        {/* 底部元信息 */}
        <View style={styles.metaRow}>
          {/* 来源平台 */}
          {source && (
            <View style={styles.sourceTag}>
              <Text style={styles.sourceText}>{source}</Text>
            </View>
          )}

          {/* 相对时间 */}
          <Text style={styles.timeText}>{relativeTime}</Text>
        </View>
      </View>
    </Pressable>
  );

  // ---- 左滑模式 (非批量时启用) ----
  if (!isBatchMode) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
      >
        {renderCard()}
      </Swipeable>
    );
  }

  return renderCard();
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  // ---- 卡片 ----
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBatch: {
    shadowOpacity: 0.03,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#1890FF',
  },
  cardPressed: {
    opacity: 0.85,
    shadowOpacity: 0.02,
  },

  // ---- 封面 ----
  coverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#F5F5F5',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- 角标 ----
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  topBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },

  // ---- 已读蒙层 ----
  readOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  // ---- 复选框 (批量模式) ----
  checkboxContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#1890FF',
    borderColor: '#1890FF',
  },

  // ---- 信息区 ----
  infoContainer: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    lineHeight: 21,
  },

  // ---- 底部元信息 ----
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceTag: {
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#1890FF',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#8C8C8C',
  },

  // ---- 左滑操作 ----
  swipeActionsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeActionWrapper: {
    justifyContent: 'center',
  },
  swipeAction: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  swipeActionTop: {
    backgroundColor: '#FA8C16',
  },
  swipeActionRead: {
    backgroundColor: '#52C41A',
  },
  swipeActionUnread: {
    backgroundColor: '#8C8C8C',
  },
  swipeActionText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
});
