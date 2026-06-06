import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { collectsApi, categoriesApi, tagsApi, parseApi } from '../../api';
import { Category, Tag, CollectType } from '../../types';

const COLLECT_TYPES: Array<{ key: CollectType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'article', label: '文章', icon: 'document-text-outline' },
  { key: 'video', label: '视频', icon: 'videocam-outline' },
  { key: 'image', label: '图片', icon: 'image-outline' },
  { key: 'link', label: '链接', icon: 'link-outline' },
  { key: 'note', label: '笔记', icon: 'document-outline' },
];

// ==================== Component ====================

export default function CreateCollectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();

  // ---- 表单状态 ----
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CollectType>('link');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // 如果从外部传入 initialUrl 则自动填入
  const initialUrl = (route.params as any)?.initialUrl;
  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  // ---- 获取分类 & 标签 ----
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
  });

  // ---- 解析URL自动填充 ----
  const handleParseUrl = useCallback(async () => {
    if (!url.trim()) {
      Alert.alert('提示', '请先输入URL');
      return;
    }
    setIsParsing(true);
    try {
      const result = await parseApi.parseUrl(url.trim());
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.type) setType(result.type);
      Alert.alert('解析成功', `标题: ${result.title || '已自动填充'}`);
    } catch (err: any) {
      Alert.alert('解析失败', err?.message || '请手动填写信息');
    } finally {
      setIsParsing(false);
    }
  }, [url]);

  // ---- 创建收藏 ----
  const createMutation = useMutation({
    mutationFn: () =>
      collectsApi.createCollect({
        url: url.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        categoryId: selectedCategoryId,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }),
    onSuccess: () => {
      Alert.alert('创建成功', '', [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('创建失败', err?.message || '请稍后重试');
    },
  });

  // ---- 标签选择切换 ----
  const toggleTag = useCallback((tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  // ---- 校验 & 提交 ----
  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入标题');
      return;
    }
    createMutation.mutate();
  }, [title, createMutation]);

  // ---- 是否可提交 ----
  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ---- 顶部导航栏 ---- */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>新建收藏</Text>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- URL ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>链接 URL</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={[styles.textInput, styles.urlInput]}
                placeholder="https://example.com/article"
                placeholderTextColor="#BFBFBF"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={styles.parseBtn}
                onPress={handleParseUrl}
                disabled={isParsing}
              >
                {isParsing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="flash-outline" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ---- 标题 ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>标题 *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="输入收藏标题"
              placeholderTextColor="#BFBFBF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ---- 备注 ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>备注</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="添加备注说明…"
              placeholderTextColor="#BFBFBF"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* ---- 类型选择 ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>类型</Text>
            <View style={styles.typeGrid}>
              {COLLECT_TYPES.map((item) => {
                const isActive = type === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.typeChip, isActive && styles.typeChipActive]}
                    onPress={() => setType(item.key)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isActive ? '#1890FF' : '#8C8C8C'}
                    />
                    <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ---- 分类选择 ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>分类</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <TouchableOpacity
                style={[styles.chip, !selectedCategoryId && styles.chipActive]}
                onPress={() => setSelectedCategoryId(undefined)}
              >
                <Text style={[styles.chipText, !selectedCategoryId && styles.chipTextActive]}>
                  未分类
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const isActive = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat.icon} {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ---- 标签选择 ---- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>标签</Text>
            <View style={styles.tagGrid}>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      isSelected && { backgroundColor: (tag.color || '#1890FF') + '20', borderColor: tag.color || '#1890FF' },
                    ]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        isSelected && { color: tag.color || '#1890FF' },
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {tags.length === 0 && (
                <Text style={styles.noDataText}>暂无标签，可先创建</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },

  // ---- 顶部栏 ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#262626',
  },
  submitBtn: {
    backgroundColor: '#1890FF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#D9D9D9',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // ---- 表单 ----
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },

  // ---- 文本输入 ----
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#262626',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },

  // ---- URL行 ----
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
  },
  parseBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- 类型选择 ----
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: '#E6F7FF',
    borderColor: '#1890FF',
  },
  typeLabel: {
    fontSize: 13,
    color: '#8C8C8C',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#1890FF',
    fontWeight: '600',
  },

  // ---- 分类选择 ----
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#E6F7FF',
    borderColor: '#1890FF',
  },
  chipText: {
    fontSize: 13,
    color: '#595959',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1890FF',
    fontWeight: '600',
  },

  // ---- 标签选择 ----
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagChipText: {
    fontSize: 13,
    color: '#595959',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 13,
    color: '#BFBFBF',
  },
});
