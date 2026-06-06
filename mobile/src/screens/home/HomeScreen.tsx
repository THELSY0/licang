import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../api';
import CategoryHomeScreen from './CategoryHomeScreen';
import AllCollectsScreen from './AllCollectsScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;

type HomeViewMode = 'categories' | 'allCollects';

// ==================== SegmentedControl ====================

function SegmentedControl({
  selectedIndex,
  labels,
  onChange,
}: {
  selectedIndex: number;
  labels: string[];
  onChange: (index: number) => void;
}) {
  return (
    <View style={styles.segmentContainer}>
      {labels.map((label, index) => {
        const isActive = index === selectedIndex;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.segmentItem, isActive && styles.segmentItemActive]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ==================== HomeScreen ====================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [viewMode, setViewMode] = useState<HomeViewMode>('categories');

  // 用于顶部显示收藏总数
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });
  const totalCollects = categories.reduce((sum, c) => sum + c.collectCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部栏 ---- */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.greeting}>栗藏</Text>
            <Text style={styles.subtitle}>
              {viewMode === 'categories'
                ? `${categories.length} 个分类`
                : `${totalCollects} 条收藏`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCollect')}
          >
            <Ionicons name="add" size={24} color="#1890FF" />
          </TouchableOpacity>
        </View>

        {/* 分段切换器 */}
        <SegmentedControl
          selectedIndex={viewMode === 'categories' ? 0 : 1}
          labels={['分类视图', '全部收藏']}
          onChange={(index) => setViewMode(index === 0 ? 'categories' : 'allCollects')}
        />
      </View>

      {/* ---- 内容区 ---- */}
      <View style={styles.contentArea}>
        {viewMode === 'categories' ? <CategoryHomeScreen compact /> : <AllCollectsScreen />}
      </View>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
  subtitle: {
    fontSize: 13,
    color: '#8C8C8C',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- 分段切换器 ----
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8C8C8C',
  },
  segmentTextActive: {
    color: '#1890FF',
    fontWeight: '600',
  },

  // ---- 内容区 ----
  contentArea: {
    flex: 1,
  },
});
