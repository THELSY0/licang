import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../api';
import { Category, CreateCategoryParams, UpdateCategoryParams } from '../../types';

const PRESET_COLORS = [
  '#1890FF', '#52C41A', '#FF4D4F', '#FA8C16',
  '#722ED1', '#13C2C2', '#EB2F96', '#FAAD14',
  '#2F54EB', '#A0D911',
];

const PRESET_ICONS = ['📁', '📂', '📖', '🎵', '🎬', '🖼️', '🔖', '⭐', '💡', '📌'];

// ==================== 编辑/创建弹窗 ====================

function CategoryFormModal({
  visible,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: Category;
  onSubmit: (params: CreateCategoryParams | UpdateCategoryParams) => Promise<void>;
  title: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '📁');
  const [color, setColor] = useState(initial?.color ?? '#1890FF');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setIcon(initial?.icon ?? '📁');
      setColor(initial?.color ?? '#1890FF');
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), icon, color, sortOrder: initial?.sortOrder });
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
        {/* 顶部栏 */}
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
          {/* 名称 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>名称</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入分类名称"
              placeholderTextColor="#BFBFBF"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          {/* 图标 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>图标</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconItem, icon === ic && styles.iconItemActive]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={styles.iconEmoji}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 颜色 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>颜色</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
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

          {/* 预览 */}
          <View style={styles.previewArea}>
            <Text style={styles.fieldLabel}>预览</Text>
            <View style={[styles.previewCard, { backgroundColor: color + '15' }]}>
              <Text style={styles.previewEmoji}>{icon}</Text>
              <Text style={[styles.previewName, { color }]}>{name || '分类名称'}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ==================== 删除确认弹窗 ====================

function DeleteConfirmModal({
  visible,
  onClose,
  category,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.deleteOverlay}>
        <View style={styles.deleteDialog}>
          <Ionicons name="warning-outline" size={40} color="#FA8C16" />
          <Text style={styles.deleteTitle}>删除分类</Text>
          <Text style={styles.deleteDesc}>
            确定要删除「{category?.name}」吗？{'\n'}该分类下的收藏将变为"未分类"状态。
          </Text>
          <View style={styles.deleteActions}>
            <TouchableOpacity style={styles.deleteCancelBtn} onPress={onClose}>
              <Text style={styles.deleteCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteConfirmBtn}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.deleteConfirmText}>删除</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ==================== CategoryManageScreen ====================

export default function CategoryManageScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ---- 查询 ----
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  // ---- 创建 ----
  const createMutation = useMutation({
    mutationFn: (params: CreateCategoryParams) => categoriesApi.createCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // ---- 更新 ----
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: number; params: UpdateCategoryParams }) =>
      categoriesApi.updateCategory(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // ---- 删除 ----
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // ---- 下拉刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    setRefreshing(false);
  }, [queryClient]);

  // ---- 打开创建弹窗 ----
  const openCreate = useCallback(() => {
    setEditingCategory(undefined);
    setFormModalVisible(true);
  }, []);

  // ---- 打开编辑弹窗 ----
  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setFormModalVisible(true);
  }, []);

  // ---- 表单提交 ----
  const handleFormSubmit = useCallback(
    async (params: CreateCategoryParams | UpdateCategoryParams) => {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, params });
      } else {
        await createMutation.mutateAsync(params as CreateCategoryParams);
      }
    },
    [editingCategory, createMutation, updateMutation],
  );

  // ---- 确认删除 ----
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  // ---- 渲染分类项 ----
  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.categoryEmoji}>{item.icon || '📁'}</Text>
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.categoryCount}>{item.collectCount} 条收藏</Text>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color="#1890FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setDeleteTarget(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF4D4F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- 顶部栏 ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>分类管理</Text>
        <Text style={styles.headerSubtitle}>{categories.length} 个分类</Text>
        <TouchableOpacity style={styles.addFab} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addFabText}>新建分类</Text>
        </TouchableOpacity>
      </View>

      {/* ---- 列表 ---- */}
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          categories.length === 0 && styles.listContentEmpty,
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
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#D9D9D9" />
              <Text style={styles.emptyText}>暂无分类，点击上方按钮创建</Text>
            </View>
          )
        }
      />

      {/* ---- 创建/编辑弹窗 ---- */}
      <CategoryFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        initial={editingCategory}
        onSubmit={handleFormSubmit}
        title={editingCategory ? '编辑分类' : '新建分类'}
      />

      {/* ---- 删除确认弹窗 ---- */}
      <DeleteConfirmModal
        visible={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        category={deleteTarget}
        onConfirm={handleDelete}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 14,
    color: '#8C8C8C',
    flex: 1,
    marginLeft: 8,
  },
  addFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1890FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addFabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },

  // ---- 列表 ----
  listContent: {
    padding: 16,
    gap: 10,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // ---- 分类项 ----
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  categoryCount: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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

  // ---- 弹窗 ----
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
    gap: 20,
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconItem: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconItemActive: {
    borderColor: '#1890FF',
    backgroundColor: '#E6F7FF',
  },
  iconEmoji: {
    fontSize: 20,
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ---- 删除确认弹窗 ----
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deleteDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },
  deleteDesc: {
    fontSize: 14,
    color: '#595959',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#595959',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF4D4F',
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
