import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../../api';
import { Tag, CreateTagParams, UpdateTagParams } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAG_COLORS = [
  '#1890FF', '#52C41A', '#FF4D4F', '#FA8C16',
  '#722ED1', '#13C2C2', '#EB2F96', '#FAAD14',
  '#2F54EB', '#A0D911', '#F5222D', '#1D39C4',
];

// ==================== 标签颜色按收藏量映射大小 ====================

function getTagSize(count: number): number {
  if (count <= 0) return 14;
  if (count <= 5) return 14;
  if (count <= 20) return 16;
  if (count <= 50) return 18;
  return 22;
}

// ==================== 编辑/创建弹窗 ====================

function TagFormModal({
  visible,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: Tag;
  onSubmit: (params: CreateTagParams | UpdateTagParams) => Promise<void>;
  title: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? '#1890FF');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setColor(initial?.color ?? '#1890FF');
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onClose();
    } catch (err: any) {
      Alert.alert('操作失败', err?.message || '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#1890FF" />
            ) : (
              <Text style={[styles.modalConfirm, !name.trim() && styles.modalConfirmDisabled]}>
                确定
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>名称</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入标签名称"
              placeholderTextColor="#BFBFBF"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>颜色</Text>
            <View style={styles.colorGrid}>
              {TAG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorItem,
                    { backgroundColor: c },
                    color === c && styles.colorItemActive,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          <View style={styles.previewArea}>
            <Text style={styles.fieldLabel}>预览</Text>
            <View style={[styles.previewTag, { backgroundColor: color + '20' }]}>
              <Text style={[styles.previewText, { color }]}>
                {name || '标签名称'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ==================== 合并弹窗 ====================

function MergeModal({
  visible,
  onClose,
  tags,
  onMerge,
}: {
  visible: boolean;
  onClose: () => void;
  tags: Tag[];
  onMerge: (sourceIds: number[], targetId: number) => Promise<void>;
}) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setSelectedSourceIds([]);
      setTargetId(null);
    }
  }, [visible]);

  const toggleSource = (id: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleMerge = async () => {
    if (selectedSourceIds.length === 0) {
      Alert.alert('提示', '请选择至少一个源标签');
      return;
    }
    if (!targetId) {
      Alert.alert('提示', '请选择目标标签');
      return;
    }
    if (selectedSourceIds.includes(targetId)) {
      Alert.alert('提示', '源标签和目标标签不能相同');
      return;
    }
    setMerging(true);
    try {
      await onMerge(selectedSourceIds, targetId);
      onClose();
      Alert.alert('合并成功', `已将 ${selectedSourceIds.length} 个标签合并`);
    } catch (err: any) {
      Alert.alert('合并失败', err?.message || '请稍后重试');
    } finally {
      setMerging(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>合并标签</Text>
          <TouchableOpacity
            onPress={handleMerge}
            disabled={merging || selectedSourceIds.length === 0 || !targetId}
          >
            <Text
              style={[
                styles.modalConfirm,
                (selectedSourceIds.length === 0 || !targetId) && styles.modalConfirmDisabled,
              ]}
            >
              {merging ? <ActivityIndicator size="small" color="#1890FF" /> : '合并'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 20 }}>
          {/* 选择源标签 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>选择源标签（将被合并）</Text>
            <View style={styles.tagCheckboxGrid}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagCheckbox,
                    selectedSourceIds.includes(tag.id) && {
                      backgroundColor: (tag.color || '#1890FF') + '20',
                      borderColor: tag.color || '#1890FF',
                    },
                  ]}
                  onPress={() => toggleSource(tag.id)}
                >
                  <Text
                    style={[
                      styles.tagCheckboxText,
                      selectedSourceIds.includes(tag.id) && { color: tag.color || '#1890FF' },
                    ]}
                  >
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 选择目标标签 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>选择目标标签（合并到）</Text>
            <View style={styles.tagCheckboxGrid}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.targetChip,
                    targetId === tag.id && {
                      backgroundColor: (tag.color || '#1890FF') + '20',
                      borderColor: tag.color || '#1890FF',
                    },
                  ]}
                  onPress={() => setTargetId(tag.id)}
                >
                  <Text
                    style={[
                      styles.targetChipText,
                      targetId === tag.id && { color: tag.color || '#1890FF' },
                    ]}
                  >
                    {tag.name}
                  </Text>
                  {targetId === tag.id && (
                    <Ionicons name="checkmark-circle" size={16} color={tag.color || '#1890FF'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ==================== TagManageScreen ====================

export default function TagManageScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>();

  // ---- 查询 ----
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
  });

  // ---- 创建 ----
  const createMutation = useMutation({
    mutationFn: (params: CreateTagParams) => tagsApi.createTag(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // ---- 更新 ----
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: number; params: UpdateTagParams }) =>
      tagsApi.updateTag(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // ---- 删除 ----
  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.deleteTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // ---- 合并 ----
  const mergeMutation = useMutation({
    mutationFn: ({ sourceIds, targetId }: { sourceIds: number[]; targetId: number }) =>
      tagsApi.mergeTags({ sourceTagIds: sourceIds, targetTagId: targetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // ---- 下拉刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['tags'] });
    setRefreshing(false);
  }, [queryClient]);

  // ---- 打开创建弹窗 ----
  const openCreate = useCallback(() => {
    setEditingTag(undefined);
    setFormModalVisible(true);
  }, []);

  // ---- 打开编辑 ----
  const openEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setFormModalVisible(true);
  }, []);

  // ---- 表单提交 ----
  const handleFormSubmit = useCallback(
    async (params: CreateTagParams | UpdateTagParams) => {
      if (editingTag) {
        await updateMutation.mutateAsync({ id: editingTag.id, params });
      } else {
        await createMutation.mutateAsync(params as CreateTagParams);
      }
    },
    [editingTag, createMutation, updateMutation],
  );

  // ---- 删除确认 ----
  const confirmDelete = useCallback((tag: Tag) => {
    Alert.alert(
      '删除标签',
      `确定要删除「${tag.name}」吗？${tag.collectCount > 0 ? `该标签关联了 ${tag.collectCount} 条收藏。` : ''}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(tag.id),
        },
      ],
    );
  }, [deleteMutation]);

  // ---- 处理合并 ----
  const handleMerge = useCallback(
    async (sourceIds: number[], targetId: number) => {
      await mergeMutation.mutateAsync({ sourceIds, targetId });
    },
    [mergeMutation],
  );

  // ---- 按收藏量排序: 大的在前 ----
  const sortedTags = [...tags].sort((a, b) => b.collectCount - a.collectCount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部栏 ---- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>标签管理</Text>
          <Text style={styles.headerSubtitle}>{tags.length} 个标签</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.mergeBtn} onPress={() => setMergeModalVisible(true)}>
            <Ionicons name="git-merge-outline" size={18} color="#722ED1" />
            <Text style={styles.mergeBtnText}>合并</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>新建</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---- 标签云 ---- */}
      <ScrollView
        style={styles.cloudContainer}
        contentContainerStyle={[
          styles.cloudContent,
          sortedTags.length === 0 && styles.cloudContentEmpty,
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
      >
        {sortedTags.length > 0 ? (
          <View style={styles.cloudWrapper}>
            {sortedTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.cloudTag,
                  { backgroundColor: (tag.color || '#1890FF') + '15' },
                ]}
                onPress={() => openEdit(tag)}
                onLongPress={() => confirmDelete(tag)}
                delayLongPress={500}
              >
                <Text
                  style={[
                    styles.cloudTagText,
                    { color: tag.color || '#1890FF', fontSize: getTagSize(tag.collectCount) },
                  ]}
                >
                  {tag.name}
                </Text>
                {tag.collectCount > 0 && (
                  <View style={[styles.cloudTagCount, { backgroundColor: (tag.color || '#1890FF') + '30' }]}>
                    <Text style={[styles.cloudTagCountText, { color: tag.color || '#1890FF' }]}>
                      {tag.collectCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={48} color="#D9D9D9" />
            <Text style={styles.emptyText}>
              {isLoading ? '加载中…' : '暂无标签，点击右上角创建'}
            </Text>
          </View>
        )}

        {/* 提示 */}
        {sortedTags.length > 0 && (
          <Text style={styles.hintText}>长按标签可删除</Text>
        )}
      </ScrollView>

      {/* ---- 创建/编辑弹窗 ---- */}
      <TagFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        initial={editingTag}
        onSubmit={handleFormSubmit}
        title={editingTag ? '编辑标签' : '新建标签'}
      />

      {/* ---- 合并弹窗 ---- */}
      <MergeModal
        visible={mergeModalVisible}
        onClose={() => setMergeModalVisible(false)}
        tags={tags}
        onMerge={handleMerge}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8C8C8C',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F9F0FF',
    gap: 4,
  },
  mergeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#722ED1',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1890FF',
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  // ---- 标签云 ----
  cloudContainer: {
    flex: 1,
  },
  cloudContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cloudContentEmpty: {
    flexGrow: 1,
  },
  cloudWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  cloudTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  cloudTagText: {
    fontWeight: '600',
  },
  cloudTagCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  cloudTagCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#BFBFBF',
    marginTop: 20,
  },

  // ---- 空状态 ----
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#BFBFBF',
  },

  // ---- 弹窗通用 ----
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: 15,
    color: '#8C8C8C',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#262626',
  },
  modalConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1890FF',
  },
  modalConfirmDisabled: {
    color: '#D9D9D9',
  },
  modalBody: {
    padding: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#262626',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorItem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorItemActive: {
    borderColor: '#262626',
  },
  previewArea: {
    gap: 8,
  },
  previewTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- 合并弹窗 ----
  tagCheckboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagCheckbox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagCheckboxText: {
    fontSize: 13,
    color: '#595959',
    fontWeight: '500',
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 4,
  },
  targetChipText: {
    fontSize: 13,
    color: '#595959',
    fontWeight: '500',
  },
});
